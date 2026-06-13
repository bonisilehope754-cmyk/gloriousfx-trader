import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginUser } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<<z.infer<<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLoginUser();

  const onSubmit = (values: z.infer<<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, { ...data.user, subscriptionTier: data.user.subscriptionTier ?? null, subscriptionExpiry: data.user.subscriptionExpiry ?? null });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "Invalid credentials",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 hover:opacity-80 transition-opacity block">
        <img src="/logo.png" alt="Glorious Trader" className="h-20 w-auto mx-auto" />
      </Link>
      
      <Card className="w-full max-w-md border-border/50 card-glow bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Access Terminal</CardTitle>
          <CardDescription>Enter your credentials to access the trading dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="trader@example.com" {...field} className="bg-background/50 focus:border-neon-green/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} className="bg-background/50 focus:border-neon-green/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-neon-green text-black hover:bg-neon-green/90 neon-glow mt-6"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Initialize Session"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground border-t border-border/50 pt-6">
          <div>
            Don't have an account?{" "}
            <Link href="/signup" className="text-neon-green hover:underline">
              Register here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
