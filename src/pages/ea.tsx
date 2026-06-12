import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { EARobotAvatar } from "@/components/EARobotAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Terminal, Play, SquareSquare, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ALLOWED_PAIRS, SYNTHETIC_PAIRS } from "@/lib/market";

const ALL_EA_PAIRS = [
  ...ALLOWED_PAIRS,
  ...SYNTHETIC_PAIRS,
];

const settingsSchema = z.object({
  lotSize: z.array(z.number()),
  maxTrades: z.array(z.number()),
  slPips: z.array(z.number()),
  pairs: z.array(z.string()).min(1, "Select at least one pair"),
  sessionStart: z.string(),
  sessionEnd: z.string(),
});

export default function EAPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ["ea-status"],
    queryFn: () => apiFetch("ea/status"),
    refetchInterval: 5000,
  });

  const { data: settings } = useQuery({
    queryKey: ["ea-settings"],
    queryFn: () => apiFetch("ea/settings"),
  });

  const { data: summary } = useQuery({
    queryKey: ["trade-summary"],
    queryFn: () => apiFetch("trades/summary"),
    refetchInterval: 30000,
  });

  const { data: trades } = useQuery({
    queryKey: ["trades"],
    queryFn: () => apiFetch("trades"),
    refetchInterval: 15000,
  });

  const startMut = useMutation({
    mutationFn: () => apiFetch("ea/start", { method: "POST" }),
    onSuccess: () => {
      toast({ title: "EA started successfully" });
      queryClient.invalidateQueries({ queryKey: ["ea-status"] });
      queryClient.invalidateQueries({ queryKey: ["ea-logs"] });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Failed to start EA", description: err.message }),
  });

  const stopMut = useMutation({
    mutationFn: () => apiFetch("ea/stop", { method: "POST" }),
    onSuccess: () => {
      toast({ title: "EA stopped" });
      queryClient.invalidateQueries({ queryKey: ["ea-status"] });
    },
  });

  const restartMut = useMutation({
    mutationFn: () => apiFetch("ea/restart", { method: "POST" }),
    onSuccess: () => {
      toast({ title: "EA restarted" });
      queryClient.invalidateQueries({ queryKey: ["ea-status"] });
      queryClient.invalidateQueries({ queryKey: ["ea-logs"] });
    },
  });

  const updateSettingsMut = useMutation({
    mutationFn: (data: any) =>
      apiFetch("ea/settings", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast({ title: "Settings saved" });
      queryClient.invalidateQueries({ queryKey: ["ea-settings"] });
    },
    onError: (err: any) =>
      toast({ variant: "destructive", title: "Failed to save settings", description: err.message }),
  });

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      lotSize: [0.1],
      maxTrades: [3],
      slPips: [30],
      pairs: ["XAUUSD", "EURUSD"],
      sessionStart: "08:00",
      sessionEnd: "17:00",
    },
    values: settings
      ? {
          lotSize: [settings.lotSize],
          maxTrades: [settings.maxTrades],
          slPips: [settings.slPips],
          pairs: (settings.pairs || []).filter((p: string) => ALL_EA_PAIRS.includes(p)),
          sessionStart: settings.sessionStart,
          sessionEnd: settings.sessionEnd,
        }
      : undefined,
  });

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    updateSettingsMut.mutate({
      ...values,
      lotSize: values.lotSize[0],
      maxTrades: values.maxTrades[0],
      slPips: values.slPips[0],
    });
  };

  const isRunning = status?.status === "RUNNING";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Terminal className="w-8 h-8 text-neon-green" />
          EA Manager
        </h1>
        <p className="text-muted-foreground">Configure and control the GFX automated trading robot.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/30 card-glow overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1 ${isRunning ? "bg-neon-green shadow-[0_0_15px_#FFD700]" : "bg-muted-foreground/30"}`} />
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-6 mt-4">
                <EARobotAvatar className="w-28 h-28" animate={isRunning} />
              </div>
              <h2 className="text-2xl font-bold mb-1">GFX EA</h2>
              <p className="text-sm text-muted-foreground mb-4 font-mono">GloriousFX Expert Advisor v2.0</p>
              <div className="mb-6">
                <StatusBadge status={status?.status || "IDLE"} className="text-lg px-4 py-1" />
              </div>
              {status?.startedAt && isRunning && (
                <p className="text-xs text-muted-foreground mb-4 font-mono">
                  Running since {new Date(status.startedAt).toLocaleTimeString()}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {!isRunning ? (
                  <Button
                    className="w-full bg-neon-green text-black hover:bg-neon-green/90 neon-glow col-span-2"
                    onClick={() => startMut.mutate()}
                    disabled={startMut.isPending}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {startMut.isPending ? "Initialising..." : "Start GFX EA"}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      className="shadow-[0_0_15px_rgba(255,0,102,0.4)]"
                      onClick={() => stopMut.mutate()}
                      disabled={stopMut.isPending}
                    >
                      <SquareSquare className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => restartMut.mutate()}
                      disabled={restartMut.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${restartMut.isPending ? "animate-spin" : ""}`} />
                      Restart
                    </Button>
                  </>
                )}
                {!isRunning && (
                  <Button
                    variant="outline"
                    className="col-span-2"
                    onClick={() => restartMut.mutate()}
                    disabled={restartMut.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${restartMut.isPending ? "animate-spin" : ""}`} />
                    Restart
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30">
            <CardHeader><CardTitle>Performance Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total Profit", value: summary?.totalProfit != null ? `$${summary.totalProfit.toFixed(2)}` : "—", color: (summary?.totalProfit ?? 0) >= 0 ? "text-neon-green" : "text-danger" },
                { label: "Total Pips", value: summary?.totalPips != null ? `+${summary.totalPips}` : "—", color: "text-neon-green" },
                { label: "Win Rate", value: summary?.winRate != null ? `${summary.winRate}%` : "—", color: "text-foreground" },
                { label: "Total Trades", value: summary?.totalTrades ?? 0, color: "text-foreground" },
                { label: "Open Trades", value: summary?.openTrades ?? 0, color: "text-neon-cyan" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center p-3 bg-background rounded-md border border-border/50">
                  <span className="text-muted-foreground text-sm">{label}</span>
                  <span className={`font-bold font-mono ${color}`}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle>Trading Parameters</CardTitle>
              <CardDescription>Configure risk management — applies to all GFX-allowed pairs</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="lotSize" render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                          <FormLabel>Fixed Lot Size</FormLabel>
                          <span className="text-neon-green font-mono">{field.value[0]}</span>
                        </div>
                        <FormControl>
                          <Slider min={0.01} max={1.00} step={0.01} value={field.value} onValueChange={field.onChange} className="py-4" />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="slPips" render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                          <FormLabel>Stop Loss (Pips)</FormLabel>
                          <span className="text-danger font-mono">{field.value[0]}</span>
                        </div>
                        <FormControl>
                          <Slider min={10} max={100} step={1} value={field.value} onValueChange={field.onChange} className="py-4" />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="maxTrades" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <div className="flex justify-between">
                          <FormLabel>Max Concurrent Trades</FormLabel>
                          <span className="font-mono">{field.value[0]}</span>
                        </div>
                        <FormControl>
                          <Slider min={1} max={10} step={1} value={field.value} onValueChange={field.onChange} className="py-4" />
                        </FormControl>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="pairs" render={() => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Active Trading Pairs</FormLabel>
                        <p className="text-xs text-muted-foreground mb-3">GFX EA only operates on approved pairs below. Crypto pairs are active 24/7.</p>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Forex & Commodities</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {ALLOWED_PAIRS.map(pair => (
                                <FormField key={pair} control={form.control} name="pairs" render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-3 bg-background/50">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(pair)}
                                        onCheckedChange={(checked) =>
                                          checked
                                            ? field.onChange([...field.value, pair])
                                            : field.onChange(field.value?.filter(v => v !== pair))
                                        }
                                      />
                                    </FormControl>
                                    <FormLabel className="font-mono font-medium leading-none">{pair}</FormLabel>
                                  </FormItem>
                                )} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Synthetic Indices</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {SYNTHETIC_PAIRS.map(pair => (
                                <FormField key={pair} control={form.control} name="pairs" render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-3 bg-background/50">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(pair)}
                                        onCheckedChange={(checked) =>
                                          checked
                                            ? field.onChange([...field.value, pair])
                                            : field.onChange(field.value?.filter(v => v !== pair))
                                        }
                                      />
                                    </FormControl>
                                    <FormLabel className="font-mono font-medium leading-none text-xs">{pair}</FormLabel>
                                  </FormItem>
                                )} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="sessionStart" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Start (Server Time)</FormLabel>
                        <FormControl><Input type="time" {...field} className="bg-background/50 font-mono" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sessionEnd" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session End (Server Time)</FormLabel>
                        <FormControl><Input type="time" {...field} className="bg-background/50 font-mono" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" disabled={updateSettingsMut.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {updateSettingsMut.isPending ? "Saving..." : "Save Parameters"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30">
            <CardHeader><CardTitle>Recent Trades</CardTitle></CardHeader>
            <CardContent>
              {!trades || trades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No trades recorded yet. Start the EA to begin trading.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground text-left">
                        <th className="pb-3 font-medium">Pair</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Lots</th>
                        <th className="pb-3 font-medium">Pips</th>
                        <th className="pb-3 font-medium text-right">Profit</th>
                        <th className="pb-3 font-medium text-right">Opened</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade: any) => (
                        <tr key={trade.id} className="border-b border-border/10 last:border-0">
                          <td className="py-3 font-bold font-mono">{trade.pair}</td>
                          <td className="py-3"><StatusBadge status={trade.type} /></td>
                          <td className="py-3 font-mono">{trade.lots}</td>
                          <td className={`py-3 font-mono ${(trade.pips ?? 0) >= 0 ? "text-neon-green" : "text-danger"}`}>
                            {trade.pips != null ? `${trade.pips >= 0 ? "+" : ""}${trade.pips}` : "—"}
                          </td>
                          <td className={`py-3 font-mono text-right font-bold ${(trade.profit ?? 0) >= 0 ? "text-neon-green" : "text-danger"}`}>
                            {trade.profit != null ? `${trade.profit >= 0 ? "+" : ""}$${Math.abs(trade.profit).toFixed(2)}` : "—"}
                          </td>
                          <td className="py-3 text-right text-muted-foreground text-xs font-mono">
                            {new Date(trade.openedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
