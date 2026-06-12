import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatusBadge } from "@/components/StatusBadge";
import { CreditCard, Server, Info, Trash2, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/market";

const brokerSchema = z.object({
  brokerName: z.string().min(2, { message: "Broker name is required" }),
  server: z.string().min(2, { message: "Server address is required" }),
  accountNumber: z.string().min(4, { message: "Account number is required" }),
  password: z.string().min(4, { message: "Password is required" }),
  platform: z.enum(["MT4", "MT5"]),
});

const SYMBOL_MAPPING: Record<string, string[]> = {
  XAUUSD: ["XAUUSD", "GOLD", "GOLD.m", "GOLD.pro", "XAUUSD.m", "XAUUSD.ECN"],
  US30: ["US30", "DJ30", "WS30", "DJIA", "US30.m", "WallStreet30"],
  US100: ["US100", "NAS100", "NASDAQ", "NDX", "US100.m", "NAS100.m"],
  BTCUSD: ["BTCUSD", "BTC/USD", "BTCUSD.", "Bitcoin", "BTCUSDT"],
  EURUSD: ["EURUSD", "EURUSD.m", "EURUSD.ECN", "EURUSD.pro"],
  GBPUSD: ["GBPUSD", "GBPUSD.m", "GBPUSD.ECN", "GBPUSD.pro"],
};

export default function BrokersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingId, setTestingId] = useState<number | null>(null);

  const { data: brokers, isLoading } = useQuery({
    queryKey: ["brokers"],
    queryFn: () => apiFetch("brokers"),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch("brokers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast({ title: "Broker connection added" });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["brokers"] });
    },
    onError: (err: any) =>
      toast({ variant: "destructive", title: "Failed to add broker", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`brokers/${id}`, { method: "DELETE" }).catch(() => null),
    onSuccess: () => {
      toast({ title: "Broker disconnected" });
      queryClient.invalidateQueries({ queryKey: ["brokers"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`brokers/${id}/test`, { method: "POST" }),
    onSuccess: (res: any, id) => {
      setTestingId(null);
      toast({
        title: res.success ? "✓ Connection Verified" : "✗ Connection Failed",
        description: res.message,
        variant: res.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["brokers"] });
    },
    onError: (err: any) => {
      setTestingId(null);
      toast({ variant: "destructive", title: "Test failed", description: err.message });
    },
  });

  const form = useForm<z.infer<typeof brokerSchema>>({
    resolver: zodResolver(brokerSchema),
    defaultValues: { brokerName: "", server: "", accountNumber: "", password: "", platform: "MT5" },
  });

  const onSubmit = (values: z.infer<typeof brokerSchema>) => createMutation.mutate(values);

  const onTest = (id: number) => {
    setTestingId(id);
    testMutation.mutate(id);
  };

  const onDelete = (id: number) => {
    if (!confirm("Disconnect this broker?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-neon-cyan" />
          Broker Connections
        </h1>
        <p className="text-muted-foreground">Connect your MT4/MT5 trading account to the GFX Expert Advisor.</p>
      </header>

      {/* Symbol resolver info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Auto Symbol Resolver</span> — GFX EA automatically detects your broker's
            symbol naming (e.g. GOLD vs XAUUSD, NAS100 vs US100, DJ30 vs US30, BTCUSD vs BTC/USD) and maps trades to the correct instrument.
            Common suffixes (.m, .ECN, .pro, .s) are handled automatically.
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="border-border/50 bg-card/30 card-glow">
            <CardHeader>
              <CardTitle>Add Connection</CardTitle>
              <CardDescription>Connect a new MetaTrader account</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="platform" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Platform</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="MT4" /></FormControl>
                            <FormLabel className="font-normal">MetaTrader 4</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="MT5" /></FormControl>
                            <FormLabel className="font-normal">MetaTrader 5</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="brokerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broker Name</FormLabel>
                      <FormControl><Input placeholder="E.g. IC Markets" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="server" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server Address</FormLabel>
                      <FormControl><Input placeholder="E.g. ICMarkets-Live01" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="accountNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number / Login ID</FormLabel>
                      <FormControl><Input placeholder="Your MT login number" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investor Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Read-only investor password" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button
                    type="submit"
                    className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/90 cyan-glow mt-4"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Connecting..." : "Connect Broker"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/20 mt-4">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Symbol Resolver Map</p>
              <div className="space-y-1.5">
                {Object.entries(SYMBOL_MAPPING).map(([canonical, aliases]) => (
                  <div key={canonical} className="flex items-start gap-2 text-xs">
                    <span className="font-mono font-bold text-primary shrink-0 w-14">{canonical}</span>
                    <span className="text-muted-foreground">{aliases.slice(1).join(", ")}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Card key={i} className="h-28 animate-pulse bg-card/20 border-border/50" />)}
            </div>
          ) : !brokers || brokers.length === 0 ? (
            <Card className="border-dashed border-border/50 bg-background">
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <WifiOff className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold mb-2">No Brokers Connected</h3>
                <p className="text-muted-foreground max-w-xs">
                  Add your MT4/MT5 broker account on the left to allow the GFX Expert Advisor to monitor and execute trades.
                </p>
              </CardContent>
            </Card>
          ) : (
            brokers.map((broker: any) => (
              <Card key={broker.id} className="border-border/50 bg-card/30">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <Server className="w-6 h-6 text-neon-cyan" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold">{broker.brokerName}</h3>
                          <StatusBadge status={broker.status} />
                          <span className="text-xs bg-muted px-2 py-1 rounded font-mono">{broker.platform}</span>
                        </div>
                        <p className="text-muted-foreground text-sm font-mono">
                          Server: {broker.server} · Acc: {broker.accountNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Connected: {new Date(broker.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTest(broker.id)}
                        disabled={testingId === broker.id}
                        className="flex-1 md:flex-none"
                      >
                        <Wifi className="w-4 h-4 mr-2" />
                        {testingId === broker.id ? "Testing..." : "Test"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(broker.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
