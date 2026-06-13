import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Shield, Users, CreditCard, Settings, TrendingUp, HelpCircle, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import {
  useGetAdminStats,
  useListAdminUsers,
  useListAdminPayments,
  useUpdateUserSubscription,
  useApprovePayment,
  useRejectPayment,
  useCreateSignal,
  useGetBankDetails,
  useUpdateBankDetails,
  useGetPricingPlans,
  useUpdatePricingPlan,
} from "@/lib/api-client";

const signalSchema = z.object({
  pair: z.string().min(1, "Pair is required"),
  direction: z.enum(["BUY", "SELL"]),
  entry: z.coerce.number().min(0.00001, "Entry price is required"),
  tp1: z.coerce.number().min(0.00001, "TP1 is required"),
  tp2: z.coerce.number().min(0.00001, "TP2 is required"),
  sl: z.coerce.number().min(0.00001, "SL is required"),
});

const bankSchema = z.object({
  bankName: z.string().min(1, "Required"),
  accountName: z.string().min(1, "Required"),
  accountNumber: z.string().min(1, "Required"),
  branchCode: z.string().min(1, "Required"),
  reference: z.string().min(1, "Required"),
  instructions: z.string().optional(),
});

const STATUS_ICON: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-4 h-4 text-yellow-400" />,
  in_progress: <Clock className="w-4 h-4 text-neon-cyan" />,
  resolved: <CheckCircle2 className="w-4 h-4 text-primary" />,
  closed: <CheckCircle2 className="w-4 h-4 text-muted-foreground" />,
};

function SupportTicketsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [note, setNote] = useState<<Record<number, string>>({});

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/support-tickets", {
        headers: { Authorization: `Bearer ${localStorage.getItem("apex_token")}` },
      });
      return res.json();
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: number; status?: string; adminNote?: string }) => {
      const res = await fetch(`/api/admin/support-tickets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("apex_token")}`,
        },
        body: JSON.stringify({ status, adminNote }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ticket updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
  });

  const openCount = tickets.filter((t: any) => t.status === "open").length;

  return (
    <Card className="border-border/50 bg-card/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-yellow-400" />
          Support Tickets
          {openCount > 0 && (
            <span className="ml-2 text-xs font-semibold bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">
              {openCount} open
            </span>
          )}
        </CardTitle>
        <CardDescription>Contact form submissions from users. Reply via email.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No support tickets yet.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t: any) => (
              <div key={t.id} className="border border-border/40 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-colors text-left"
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                >
                  {STATUS_ICON[t.status] ?? STATUS_ICON.open}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{t.name} · {t.email} · {format(new Date(t.createdAt), "dd MMM yyyy HH:mm")}</p>
                  </div>
                  <span className="text-xs capitalize font-medium px-2 py-1 rounded-full bg-white/5 border border-border/40 shrink-0">
                    {t.status.replace("_", " ")}
                  </span>
                </button>
                {expanded === t.id && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4 bg-background/30">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{t.message}</p>
                    {t.adminNote && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-3">
                        Note: {t.adminNote}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 items-end">
                      <div className="flex-1 min-w-[180px]">
                        <Input
                          placeholder="Add internal note…"
                          className="bg-background/50 text-sm"
                          value={note[t.id] ?? ""}
                          onChange={(e) => setNote(n => ({ ...n, [t.id]: e.target.value }))}
                        />
                      </div>
                      <Select
                        defaultValue={t.status}
                        onValueChange={(val) => updateMut.mutate({ id: t.id, status: val })}
                      >
                        <SelectTrigger className="w-36 bg-background/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="bg-primary text-black hover:bg-primary/90"
                        onClick={() => updateMut.mutate({ id: t.id, adminNote: note[t.id] ?? "" })}
                        disabled={updateMut.isPending}
                      >
                        Save Note
                      </Button>
                      <a href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)}`}>
                        <Button size="sm" variant="outline">Reply via Email</Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats } = useGetAdminStats();
  const { data: users } = useListAdminUsers();
  const { data: payments } = useListAdminPayments();
  const { data: bankDetails } = useGetBankDetails();
  const { data: pricingPlans } = useGetPricingPlans();

  const updateSubMut = useUpdateUserSubscription();
  const approveMut = useApprovePayment();
  const rejectMut = useRejectPayment();
  const createSignalMut = useCreateSignal();
  const updateBankMut = useUpdateBankDetails();
  const updatePricingMut = useUpdatePricingPlan();

  const signalForm = useForm<<z.infer<<typeof signalSchema>>({
    resolver: zodResolver(signalSchema),
    defaultValues: { pair: "XAUUSD", direction: "BUY", entry: 0, tp1: 0, tp2: 0, sl: 0 },
  });

  const bankForm = useForm<<z.infer<<typeof bankSchema>>({
    resolver: zodResolver(bankSchema),
    values: bankDetails ? {
      bankName: bankDetails.bankName,
      accountName: bankDetails.accountName,
      accountNumber: bankDetails.accountNumber,
      branchCode: bankDetails.branchCode,
      reference: bankDetails.reference,
      instructions: bankDetails.instructions || "",
    } : undefined
  });

  const handleUpdateSub = (userId: number, tier: string) => {
    updateSubMut.mutate({ id: userId, data: { subscriptionTier: tier } as any }, {
      onSuccess: () => {
        toast({ title: "User subscription updated" });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      }
    });
  };

  const handlePayment = (id: number, action: 'approve' | 'reject') => {
    const mut = action === 'approve' ? approveMut : rejectMut;
    mut.mutate({ id }, {
      onSuccess: () => {
        toast({ title: `Payment ${action}d` });
        queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      }
    });
  };

  const onSignalSubmit = (values: z.infer<<typeof signalSchema>) => {
    createSignalMut.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Signal published successfully" });
        signalForm.reset();
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      }
    });
  };

  const onBankSubmit = (values: z.infer<<typeof bankSchema>) => {
    updateBankMut.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Bank details updated" });
        queryClient.invalidateQueries({ queryKey: ['bank-details'] });
      }
    });
  };

  const updatePrice = (tier: string, priceZar: number) => {
    updatePricingMut.mutate({ data: { tier, priceZar } }, {
      onSuccess: () => {
        toast({ title: `${tier} plan price updated` });
        queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Admin Control Center
        </h1>
        <p className="text-muted-foreground">Manage platform, users, payments, and signals.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
            <p className="text-3xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Active Subs</p>
            <p className="text-3xl font-bold text-neon-green">{stats?.activeSubscriptions || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Pending EFTs</p>
            <p className="text-3xl font-bold text-neon-cyan">{stats?.pendingPayments || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Rev</p>
            <p className="text-3xl font-bold text-[#ffd700]">R{stats?.revenueThisMonth?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-background/50 border border-border/50 p-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"><CreditCard className="w-4 h-4 mr-2" /> Payments</TabsTrigger>
          <TabsTrigger value="signals" className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green"><TrendingUp className="w-4 h-4 mr-2" /> Publisher</TabsTrigger>
          <TabsTrigger value="support" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"><HelpCircle className="w-4 h-4 mr-2" /> Support</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-muted data-[state=active]:text-foreground"><Settings className="w-4 h-4 mr-2" /> Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card className="border-border/50 bg-card/30">
            <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground text-left">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Tier</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map(u => (
                      <tr key={u.id} className="border-b border-border/10">
                        <td className="py-3 font-bold">{u.name}</td>
                        <td className="py-3">{u.email}</td>
                        <td className="py-3"><StatusBadge status={u.role} /></td>
                        <td className="py-3"><StatusBadge status={u.subscriptionTier || 'NONE'} /></td>
                        <td className="py-3 flex justify-end">
                          <Select onValueChange={(val) => handleUpdateSub(u.id, val)} value={u.subscriptionTier || 'lite'}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Set Tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lite">Lite</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card className="border-border/50 bg-card/30 border-neon-cyan/20">
            <CardHeader><CardTitle>EFT Payment Approvals</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground text-left">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Ref</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments?.map(p => (
                      <tr key={p.id} className="border-b border-border/10">
                        <td className="py-3 font-mono text-xs">{format(new Date(p.createdAt), "MMM d, HH:mm")}</td>
                        <td className="py-3 font-bold">{p.userName}<br/><span className="font-normal text-xs text-muted-foreground">{p.userEmail}</span></td>
                        <td className="py-3 uppercase">{p.plan}</td>
                        <td className="py-3 font-mono text-neon-cyan">{p.reference}</td>
                        <td className="py-3 font-mono">R{p.amount}</td>
                        <td className="py-3"><StatusBadge status={p.status} /></td>
                        <td className="py-3 flex justify-end gap-2">
                          {p.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 border-neon-green text-neon-green hover:bg-neon-green/10" onClick={() => handlePayment(p.id, 'approve')}>Approve</Button>
                              <Button size="sm" variant="outline" className="h-8 border-danger text-danger hover:bg-danger/10" onClick={() => handlePayment(p.id, 'reject')}>Reject</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="mt-6">
          <Card className="border-border/50 bg-card/30 border-neon-green/20 max-w-2xl">
            <CardHeader>
              <CardTitle>Publish Signal</CardTitle>
              <CardDescription>Broadcast a new trading signal to all subscribers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...signalForm}>
                <form onSubmit={signalForm.handleSubmit(onSignalSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={signalForm.control} name="pair" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pair</FormLabel>
                        <FormControl><Input placeholder="XAUUSD" {...field} className="uppercase bg-background/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signalForm.control} name="direction" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direction</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="BUY">BUY</SelectItem>
                            <SelectItem value="SELL">SELL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={signalForm.control} name="entry" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Price</FormLabel>
                        <FormControl><Input type="number" step="0.00001" {...field} className="bg-background/50 font-mono" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signalForm.control} name="sl" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stop Loss (SL)</FormLabel>
                        <FormControl><Input type="number" step="0.00001" {...field} className="bg-background/50 font-mono text-danger" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={signalForm.control} name="tp1" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Take Profit 1 (TP1)</FormLabel>
                        <FormControl><Input type="number" step="0.00001" {...field} className="bg-background/50 font-mono text-neon-green" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signalForm.control} name="tp2" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Take Profit 2 (TP2)</FormLabel>
                        <FormControl><Input type="number" step="0.00001" {...field} className="bg-background/50 font-mono text-neon-green" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full bg-neon-green text-black hover:bg-neon-green/90 neon-glow mt-4" disabled={createSignalMut.isPending}>
                    Publish Signal
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <SupportTicketsPanel />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card className="border-border/50 bg-card/30 max-w-2xl">
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>EFT details shown to users during payment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...bankForm}>
                <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={bankForm.control} name="bankName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={bankForm.control} name="accountName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={bankForm.control} name="accountNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl><Input {...field} className="bg-background/50 font-mono" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={bankForm.control} name="branchCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Code</FormLabel>
                        <FormControl><Input {...field} className="bg-background/50 font-mono" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={bankForm.control} name="reference" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Reference Pattern</FormLabel>
                      <FormControl><Input {...field} className="bg-background/50 font-mono" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={bankForm.control} name="instructions" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extra Instructions</FormLabel>
                      <FormControl><Textarea {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={updateBankMut.isPending}>Save Bank Details</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30 max-w-2xl">
            <CardHeader>
              <CardTitle>Pricing Config</CardTitle>
              <CardDescription>Update monthly subscription prices (ZAR).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingPlans?.map(plan => (
                  <div key={plan.tier} className="flex items-center gap-4 p-4 border border-border/50 bg-background/50 rounded-lg">
                    <div className="w-24 font-bold uppercase">{plan.tier}</div>
                    <div className="flex-1">
                      <Input 
                        type="number" 
                        defaultValue={plan.priceZar} 
                        className="font-mono bg-background"
                        id={`price-${plan.tier}`}
                      />
                    </div>
                    <Button onClick={() => {
                      const input = document.getElementById(`price-${plan.tier}`) as HTMLInputElement;
                      if(input) updatePrice(plan.tier, parseInt(input.value));
                    }} disabled={updatePricingMut.isPending}>
                      Update
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
