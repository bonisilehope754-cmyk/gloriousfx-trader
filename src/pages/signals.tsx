import { useState, useMemo } from "react";
import { SignalCard } from "@/components/SignalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Filter, BarChart2, Clock, Archive, Moon } from "lucide-react";
import { apiFetch, getMarketStatus, ALL_TRADING_PAIRS } from "@/lib/market";

const ACTIVE_STATUSES = ["ACTIVE", "PENDING", "active", "pending"];
const CLOSED_STATUSES = ["HIT_TP1", "HIT_TP2", "HIT_SL", "CLOSED", "hit_tp1", "hit_tp2", "hit_sl", "closed"];
const EXPIRY_HOURS = 24;

export default function SignalsPage() {
  const [filterPair, setFilterPair] = useState("ALL");
  const [filterDirection, setFilterDirection] = useState("ALL");
  const marketStatus = getMarketStatus();

  const { data: allSignals = [], isLoading } = useQuery({
    queryKey: ["signals-all"],
    queryFn: () => apiFetch("signals"),
    refetchInterval: 15000,
  });

  const { data: stats } = useQuery({
    queryKey: ["signal-stats-page"],
    queryFn: () => apiFetch("signals/stats"),
    refetchInterval: 20000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["signals-analytics"],
    queryFn: () => apiFetch("signals/analytics"),
    refetchInterval: 60000,
  });

  const filteredAll = useMemo(() => {
    return (allSignals as any[]).filter((s: any) => {
      if (filterPair !== "ALL" && s.pair !== filterPair) return false;
      if (filterDirection !== "ALL" && s.direction !== filterDirection.toUpperCase()) return false;
      return true;
    });
  }, [allSignals, filterPair, filterDirection]);

  const activeSignals = useMemo(
    () => filteredAll.filter((s: any) => ACTIVE_STATUSES.includes(s.status)),
    [filteredAll]
  );

  const expiredSignals = useMemo(() => {
    const cutoff = Date.now() - EXPIRY_HOURS * 60 * 60 * 1000;
    return filteredAll.filter((s: any) => {
      if (!CLOSED_STATUSES.includes(s.status)) return false;
      const closedAt = new Date(s.createdAt).getTime();
      return closedAt > cutoff;
    });
  }, [filteredAll]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-neon-green" />
          Trading Signals
        </h1>
        <p className="text-muted-foreground">
          High-probability setups — {marketStatus.isWeekend ? "Crypto signals active. Forex resumes Monday." : `${marketStatus.session} live.`}
        </p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Win Rate</p>
            <p className="text-3xl font-bold text-neon-green">{stats?.winRate ?? 0}%</p>
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
            <p className="text-sm font-medium text-muted-foreground mb-1">Winning</p>
            <p className="text-3xl font-bold text-neon-green">{stats?.wins ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Losing</p>
            <p className="text-3xl font-bold text-danger">{stats?.losses ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Panel */}
      {analytics && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Daily Analytics Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Signals</p>
                <p className="font-bold text-lg">{analytics.total}</p>
              </div>
              <div>
                <p className="text-muted-foreground">TP1 Hit</p>
                <p className="font-bold text-lg text-neon-green">{analytics.hitTp1}</p>
              </div>
              <div>
                <p className="text-muted-foreground">TP2 Hit</p>
                <p className="font-bold text-lg text-neon-green">{analytics.hitTp2}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SL Hit</p>
                <p className="font-bold text-lg text-danger">{analytics.hitSl}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Pips</p>
                <p className={`font-bold text-lg ${(analytics.totalPips ?? 0) >= 0 ? "text-neon-green" : "text-danger"}`}>
                  {(analytics.totalPips ?? 0) >= 0 ? "+" : ""}{analytics.totalPips ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-border/50 bg-card/30">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 text-muted-foreground pr-4 hidden md:flex">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="w-full md:w-56">
            <Select value={filterPair} onValueChange={setFilterPair}>
              <SelectTrigger className="bg-background/50 font-mono">
                <SelectValue placeholder="All Pairs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Pairs</SelectItem>
                {ALL_TRADING_PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select value={filterDirection} onValueChange={setFilterDirection}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Directions</SelectItem>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ACTIVE / RUNNING SIGNALS */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse inline-block" />
          Active / Running Signals
          <span className="text-sm font-normal text-muted-foreground ml-2">({activeSignals.length})</span>
        </h2>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-card/20 border-border/50" />)}
          </div>
        ) : activeSignals.length === 0 ? (
          <div className="text-center py-14 bg-card/20 border border-border/50 rounded-xl">
            {marketStatus.isWeekend ? (
              <div className="flex flex-col items-center gap-3">
                <Moon className="w-10 h-10 text-orange-400" />
                <p className="text-muted-foreground">Forex markets closed. Crypto signals active 24/7.</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No active signals match your filters.</p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSignals.map((signal: any) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </section>

      {/* EXPIRED / CLOSED SIGNALS */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Archive className="w-5 h-5 text-muted-foreground" />
          Expired / Closed Signals
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({expiredSignals.length}) — auto-archived after {EXPIRY_HOURS}h
          </span>
        </h2>

        {expiredSignals.length === 0 ? (
          <div className="text-center py-10 bg-card/20 border border-dashed border-border/50 rounded-xl">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No recently closed signals.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
            {expiredSignals.map((signal: any) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
