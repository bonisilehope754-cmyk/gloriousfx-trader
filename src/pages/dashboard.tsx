import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EARobotAvatar } from "@/components/EARobotAvatar";
import { SignalCard } from "@/components/SignalCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Bell, ArrowRight, Play, SquareSquare, Activity, RefreshCw, Terminal, Moon, Bitcoin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMarketStatus, apiFetch } from "@/lib/market";

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  useEffect(() => {
    const interval = setInterval(() => setMarketStatus(getMarketStatus()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: eaStatus } = useQuery({
    queryKey: ["ea-status"],
    queryFn: () => apiFetch("ea/status"),
    refetchInterval: 5000,
  });

  const { data: logs } = useQuery({
    queryKey: ["ea-logs"],
    queryFn: () => apiFetch("ea/logs"),
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery({
    queryKey: ["signal-stats"],
    queryFn: () => apiFetch("signals/stats"),
    refetchInterval: 10000,
  });

  const { data: tradeSummary } = useQuery({
    queryKey: ["trades-summary"],
    queryFn: () => apiFetch("trades/summary"),
    refetchInterval: 15000,
  });

  const { data: signals } = useQuery({
    queryKey: ["signals-dashboard"],
    queryFn: () => apiFetch("signals?status=active"),
    refetchInterval: 15000,
  });

  const startMut = useMutation({
    mutationFn: () => apiFetch("ea/start", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ea-status"] }),
  });

  const stopMut = useMutation({
    mutationFn: () => apiFetch("ea/stop", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ea-status"] }),
  });

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const isRunning = eaStatus?.status === "RUNNING";

  const terminalLines = (() => {
    if (!marketStatus.isOpen && !marketStatus.cryptoActive) {
      return [
        { id: 0, message: "[GFX EA] Markets are closed for the weekend.", level: "warn", timestamp: new Date().toISOString() },
        { id: 1, message: "[GFX EA] Forex & Equity sessions resume Monday 00:00 SAST.", level: "info", timestamp: new Date().toISOString() },
      ];
    }
    if (marketStatus.isWeekend) {
      const baseLogs = logs || [];
      const cryptoOnly = baseLogs.filter((l: any) =>
        ["BTCUSD", "BTC", "Crypto"].some(k => l.message.includes(k))
      );
      const weekendNotice = {
        id: 9999,
        message: `[GFX EA] Forex markets closed. Monitoring BTCUSD only (crypto trades 24/7).`,
        level: "warn",
        timestamp: new Date().toISOString(),
      };
      return [weekendNotice, ...cryptoOnly];
    }
    return logs || [];
  })();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Market Status Banner */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium ${
        marketStatus.isOpen
          ? "border-primary/30 bg-primary/5 text-primary"
          : marketStatus.isWeekend
          ? "border-orange-500/30 bg-orange-500/5 text-orange-400"
          : "border-border/50 bg-card/20 text-muted-foreground"
      }`}>
        {marketStatus.isWeekend ? (
          <Moon className="w-4 h-4 shrink-0" />
        ) : (
          <Activity className={`w-4 h-4 shrink-0 ${marketStatus.isOpen ? "animate-pulse" : ""}`} />
        )}
        <span>{marketStatus.label}</span>
        {marketStatus.isOpen && (
          <span className="text-muted-foreground font-normal">— {marketStatus.session}</span>
        )}
        {marketStatus.isWeekend && (
          <span className="ml-auto flex items-center gap-1.5 text-[#ffd700]">
            <Bitcoin className="w-3.5 h-3.5" /> Crypto Active 24/7
          </span>
        )}
      </div>

      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Terminal Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}. GFX system online.</p>
        </div>
        <Button variant="outline" size="icon" className="rounded-full relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-neon-green rounded-full border-2 border-background"></span>
        </Button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Win Rate</p>
            <p className="text-3xl font-bold text-neon-green">
              {stats?.winRate != null ? `${stats.winRate}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Signals Today</p>
            <p className="text-3xl font-bold text-foreground">{stats?.totalToday ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Active Pairs</p>
            <p className="text-3xl font-bold text-neon-cyan">{stats?.activePairs ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Profit</p>
            <p className={`text-3xl font-bold ${(tradeSummary?.totalProfit ?? 0) >= 0 ? "text-neon-green" : "text-danger"}`}>
              {tradeSummary?.totalProfit != null
                ? `${tradeSummary.totalProfit >= 0 ? "+" : ""}$${tradeSummary.totalProfit.toFixed(2)}`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: EA + Terminal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/30 card-glow overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1 h-full ${isRunning ? "bg-neon-green shadow-[0_0_15px_#FFD700]" : "bg-muted-foreground/30"}`} />
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <EARobotAvatar className="w-16 h-16" animate={isRunning} />
                <div>
                  <h3 className="text-xl font-bold mb-2">GFX Expert Advisor</h3>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={eaStatus?.status || "IDLE"} />
                    {isRunning && (
                      <span className="text-sm text-muted-foreground font-mono">
                        {marketStatus.isWeekend ? "BTCUSD" : "XAUUSD | EURUSD | GBPUSD"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {!isRunning ? (
                  <Button
                    size="icon"
                    className="bg-neon-green text-black hover:bg-neon-green/80 rounded-full w-12 h-12"
                    onClick={() => startMut.mutate()}
                    disabled={startMut.isPending}
                  >
                    <Play className="w-6 h-6 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="rounded-full w-12 h-12 shadow-[0_0_15px_rgba(255,0,102,0.4)]"
                    onClick={() => stopMut.mutate()}
                    disabled={stopMut.isPending}
                  >
                    <SquareSquare className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-[#050505]">
            <CardHeader className="py-4 border-b border-border/30 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neon-green" />
                Live Terminal
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {marketStatus.isOpen ? (
                  <>
                    <Activity className="w-3 h-3 text-neon-green animate-pulse" />
                    {marketStatus.session}
                  </>
                ) : (
                  <>
                    <Moon className="w-3 h-3 text-orange-400" />
                    Markets Closed
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 terminal-log text-sm" ref={terminalRef}>
                {terminalLines.length === 0 ? (
                  <div className="text-muted-foreground/50 font-mono text-sm">
                    Waiting for EA activity...
                  </div>
                ) : (
                  terminalLines.map((log: any) => (
                    <div key={log.id} className="mb-1 flex gap-3">
                      <span className="text-muted-foreground/50 shrink-0 font-mono">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`${
                        log.level === "error" ? "text-danger" :
                        log.level === "warn" ? "text-orange-400" :
                        log.level === "trade" ? "text-neon-cyan" :
                        "text-neon-green"
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
                <div className="flex items-center mt-2">
                  <span className="text-neon-green mr-2">{">"}</span>
                  <span className="w-2 h-4 bg-neon-green animate-cursor inline-block" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Signals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">Live Signals</h3>
            <Link href="/signals" className="text-sm text-neon-green hover:underline flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {!signals || signals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-border/50 rounded-xl">
                {marketStatus.isWeekend ? "Forex markets closed — no new signals." : "No active signals right now."}
              </div>
            ) : (
              signals.slice(0, 5).map((signal: any) => (
                <SignalCard key={signal.id} signal={signal} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
