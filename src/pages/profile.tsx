import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StatusBadge } from "@/components/StatusBadge";
import { Settings, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useUpdateProfile, useListPayments } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
});

const statusColor: Record<string, string> = {
  approved: "text-primary",
  pending: "text-yellow-400",
  rejected: "text-destructive",
};

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: payments } = useListPayments();
  const updateMut = useUpdateProfile();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", phone: "" },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateMut.mutate({ data: values as any }, {
      onSuccess: (updated) => {
        toast({ title: "Profile updated", description: "Your details have been saved." });
        if (user && token) {
          login(token, { ...user, name: updated.name ?? user.name });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Update failed", description: "Please try again." });
      },
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-foreground" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground">Manage your account, WhatsApp notifications, and subscription.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: avatar + status */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/30 text-center pt-8">
            <CardContent>
              <div className="w-24 h-24 mx-auto rounded-full bg-secondary flex items-center justify-center text-3xl font-bold mb-4 border-2 border-primary/30">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
              <p className="text-muted-foreground text-sm mb-4">{user?.email}</p>
              <StatusBadge status={user?.subscriptionTier || "guest"} className="text-base px-4 py-1" />
              {user?.subscriptionExpiry && (
                <p className="text-xs text-muted-foreground mt-3">
                  Expires {format(new Date(user.subscriptionExpiry), "dd MMM yyyy")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary">WhatsApp Signals</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your WhatsApp number below (with country code, e.g. 27821234567) to receive instant signal alerts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: edit form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        WhatsApp Number
                        <span className="text-xs text-primary font-normal">Signal notifications</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="27821234567"
                          className="bg-background/50 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    className="bg-primary text-black hover:bg-primary/90 neon-glow"
                    disabled={updateMut.isPending}
                  >
                    {updateMut.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Payment history */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {!payments || payments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No payments yet.</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                      <div>
                        <p className="font-semibold capitalize">{p.plan} plan</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.reference} · {format(new Date(p.createdAt), "dd MMM yyyy")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold">R{p.amount}</p>
                        <p className={`text-xs font-medium ${statusColor[p.status] || "text-muted-foreground"}`}>
                          {p.status.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
