import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { BarChart2, Lock, Scan, Zap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiFetch, ALL_TRADING_PAIRS } from "@/lib/market";

const scanSchema = z.object({
  pair: z.string().min(1, "Pair is required"),
  timeframe: z.enum(["M1", "M5", "M15", "H1", "H4", "D1"]),
});

export default function ScannerPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const scanMut = useMutation({
    mutationFn: (data: z.infer<typeof scanSchema>) =>
      apiFetch("scanner/scan", { method: "POST", body: JSON.stringify(data) }),
  });

  const form = useForm<z.infer<typeof scanSchema>>({
    resolver: zodResolver(scanSchema),
    defaultValues: { pair: "XAUUSD", timeframe: "H1" },
  });

  const onSubmit = (values: z.infer<typeof scanSchema>) => {
    scanMut.mutate(values, {
      onSuccess: (data) => setResult(data),
    });
  };

  const isPremium = user?.subscriptionTier === "premium" || user?.role === "admin";

  if (!isPremium) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-[80vh] flex flex-col items-center justify-center">
        <Card className="max-w-md border-primary/30 bg-card/30 text-center p-8 shadow-[0_0_40px_rgba(255,215,0,0.1)]">
          <Lock className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold tracking-tight mb-3 text-primary">Premium Feature</h2>
          <p className="text-muted-foreground mb-2">
            The GFX AI Chart Scanner is exclusively available to <strong>Premium</strong> members.
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            Upgrade your account to unlock real-time AI technical analysis and pattern recognition on all GFX-approved pairs.
          </p>
          <Link href="/payment?plan=premium">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow text-base py-6">
              <Zap className="w-5 h-5 mr-2" />
              Upgrade to Premium — R749/mo
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            Includes: AI Chart Scanner + All Pro features + Priority Support
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-primary" />
          GFX AI Chart Scanner
        </h1>
        <p className="text-muted-foreground">Real-time AI technical analysis on GFX-approved pairs.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="border-border/50 bg-card/30 card-glow">
            <CardHeader>
              <CardTitle>Scan Parameters</CardTitle>
              <CardDescription>Select asset and timeframe</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="pair" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Pair</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 font-mono">
                            <SelectValue placeholder="Select pair" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ALL_TRADING_PAIRS.map(p => (
                            <SelectItem key={p} value={p} className="font-mono">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="timeframe" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeframe</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 font-mono">
                            <SelectValue placeholder="Select timeframe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M1">1 Minute (M1)</SelectItem>
                          <SelectItem value="M5">5 Minutes (M5)</SelectItem>
                          <SelectItem value="M15">15 Minutes (M15)</SelectItem>
                          <SelectItem value="H1">1 Hour (H1)</SelectItem>
                          <SelectItem value="H4">4 Hours (H4)</SelectItem>
                          <SelectItem value="D1">Daily (D1)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                    disabled={scanMut.isPending}
                  >
                    {scanMut.isPending ? (
                      <span className="flex items-center"><Scan className="w-4 h-4 mr-2 animate-spin" /> Analysing...</span>
                    ) : (
                      <span className="flex items-center"><Scan className="w-4 h-4 mr-2" /> Scan Now</span>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {scanMut.isPending ? (
            <Card className="border-border/50 bg-card/30 h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full animate-spin" />
                  <div className="absolute inset-2 border-4 border-t-transparent border-r-transparent border-b-neon-green border-l-neon-green rounded-full animate-spin" style={{ animationDirection: "reverse" }} />
                  <Scan className="absolute inset-0 m-auto w-8 h-8 text-foreground animate-pulse" />
                </div>
                <div className="font-mono text-sm text-muted-foreground animate-pulse">GFX Neural Network Analysing...</div>
              </div>
            </Card>
          ) : scanMut.isError ? (
            <Card className="border-danger/30 bg-card/30 h-full min-h-[200px] flex items-center justify-center">
              <div className="text-center text-danger p-8">
                <p className="font-bold mb-2">Scan Failed</p>
                <p className="text-sm text-muted-foreground">{(scanMut.error as any)?.message || "Could not complete analysis."}</p>
                <Button variant="outline" className="mt-4" onClick={() => scanMut.reset()}>Try Again</Button>
              </div>
            </Card>
          ) : result ? (
            <Card className="border-border/50 bg-card/30 card-glow relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${
                result.trend === "BULLISH" ? "bg-neon-green shadow-[0_0_15px_#FFD700]" :
                result.trend === "BEARISH" ? "bg-danger shadow-[0_0_15px_#ff0066]" :
                "bg-muted-foreground"
              }`} />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl font-bold tracking-tight mb-1 font-mono">{result.pair}</CardTitle>
                    <CardDescription className="font-mono">{result.timeframe} timeframe · {new Date(result.scannedAt).toLocaleTimeString()}</CardDescription>
                  </div>
                  <StatusBadge status={result.trend} className="text-base px-4 py-1" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Signal Strength</span>
                    <span className="text-sm font-mono font-bold">{result.signalStrength}%</span>
                  </div>
                  <div className={`h-2.5 w-full rounded-full overflow-hidden bg-muted`}>
                    <div
                      className={`h-full rounded-full transition-all ${
                        result.trend === "BULLISH" ? "bg-neon-green" :
                        result.trend === "BEARISH" ? "bg-danger" : "bg-muted-foreground"
                      }`}
                      style={{ width: `${result.signalStrength}%` }}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">RSI (14)</div>
                    <div className="text-2xl font-bold font-mono">{result.rsiValue}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.rsiValue > 70 ? "Overbought" : result.rsiValue < 30 ? "Oversold" : "Neutral zone"}
                    </div>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">MACD Signal</div>
                    <div className="text-xl font-bold font-mono">{result.macdSignal?.replace("_", " ")}</div>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Support</div>
                    <div className="text-2xl font-bold font-mono text-neon-green">{result.supportLevel}</div>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resistance</div>
                    <div className="text-2xl font-bold font-mono text-danger">{result.resistanceLevel}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Key Levels</h3>
                  <div className="flex gap-2 flex-wrap">
                    {result.keyLevels?.map((level: number, i: number) => (
                      <div key={i} className="px-3 py-1.5 bg-background border border-border/50 rounded-md font-mono text-sm">
                        {level}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> GFX AI Recommendation
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{result.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/50 bg-background h-full min-h-[400px]">
              <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
                <BarChart2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">Awaiting Parameters</h3>
                <p className="text-muted-foreground max-w-sm text-sm">Select a GFX-approved pair and timeframe, then click Scan Now to run the AI analysis.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
