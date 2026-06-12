import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetBankDetails, useCreatePayment, useGetPricingPlans } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Zap, Copy, CheckCircle2, ArrowLeft } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";

const paymentSchema = z.object({
  reference: z.string().min(3, { message: "Reference is required" }),
});

export default function PaymentPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Parse query string manually
  const planQuery = location.split("?plan=")[1] || "pro";
  const selectedTier = planQuery as any;
  
  const { data: bankDetails, isLoading: bankLoading } = useGetBankDetails();
  const { data: plans, isLoading: plansLoading } = useGetPricingPlans();
  const createPayment = useCreatePayment();
  
  const selectedPlan = plans?.find(p => p.tier === selectedTier) || plans?.[1];

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { reference: "" },
  });

  const onSubmit = (values: z.infer<typeof paymentSchema>) => {
    if (!selectedPlan) return;
    
    createPayment.mutate({ 
      data: {
        plan: selectedPlan.tier as any,
        amount: selectedPlan.priceZar,
        reference: values.reference
      } 
    }, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Payment Submission Failed",
          description: error.message || "Failed to submit payment details",
        });
      }
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied to clipboard`,
    });
  };

  if (bankLoading || plansLoading) {
    return <div className="h-screen flex items-center justify-center"><div className="animate-pulse-neon w-16 h-16 rounded-full" /></div>;
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-neon-green/50 card-glow text-center">
          <CardContent className="pt-10 pb-8">
            <CheckCircle2 className="w-20 h-20 text-neon-green mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Payment Submitted</h2>
            <p className="text-muted-foreground mb-8">
              Your payment is pending review. Once we verify the EFT transfer, your account will be upgraded automatically. This usually takes 1-12 hours.
            </p>
            <Link href="/dashboard">
              <Button className="bg-neon-green text-black hover:bg-neon-green/90 neon-glow w-full">
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl mb-8 flex justify-between items-center">
        <Link href="/">
          <Button variant="ghost" className="hover:text-neon-green">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>
        <div className="flex items-center">
          <img src="/logo.png" alt="Glorious Trader" className="h-10 w-auto" />
        </div>
      </div>
      
      <div className="w-full max-w-2xl grid md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background/50 p-4 rounded-lg border border-border/50 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-bold uppercase">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                <span className="text-muted-foreground">Billing Cycle</span>
                <span>Monthly</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Total Due</span>
                <span className="font-bold text-neon-green">R{selectedPlan?.priceZar}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">Banking Details for EFT</h3>
              {bankDetails && (
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center p-2 hover:bg-secondary/50 rounded group">
                    <div><span className="text-muted-foreground block text-xs">Bank</span>{bankDetails.bankName}</div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(bankDetails.bankName, 'Bank Name')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-secondary/50 rounded group">
                    <div><span className="text-muted-foreground block text-xs">Account Name</span>{bankDetails.accountName}</div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(bankDetails.accountName, 'Account Name')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-secondary/50 rounded group">
                    <div><span className="text-muted-foreground block text-xs">Account Number</span>{bankDetails.accountNumber}</div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account Number')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-secondary/50 rounded group">
                    <div><span className="text-muted-foreground block text-xs">Branch Code</span>{bankDetails.branchCode}</div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(bankDetails.branchCode, 'Branch Code')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Confirmation Form */}
        <Card className="border-border/50 card-glow bg-card/50">
          <CardHeader>
            <CardTitle>Confirm Payment</CardTitle>
            <CardDescription>
              After making the EFT transfer, enter your payment reference below so we can verify it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-primary/10 border border-primary/30 p-4 rounded-md text-sm text-primary mb-4">
                  <p><strong>IMPORTANT:</strong> Use the reference exactly as shown below when making your transfer.</p>
                </div>
                
                <div className="p-4 bg-background rounded-md border border-border flex justify-between items-center">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Your Unique Reference</span>
                    <span className="font-mono text-lg font-bold text-neon-green">{bankDetails?.reference || 'GFX-XXXX'}</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(bankDetails?.reference || '', 'Reference')}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Reference Used</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. GFX-1234" {...field} className="bg-background/50 focus:border-neon-green/50 uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-neon-green text-black hover:bg-neon-green/90 neon-glow"
                  disabled={createPayment.isPending}
                >
                  {createPayment.isPending ? "Submitting..." : "I Have Made The Payment"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
