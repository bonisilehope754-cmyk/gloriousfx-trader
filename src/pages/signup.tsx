import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const registerMutation = useRegisterUser();

  const onSubmit = (values: z.infer<typeof signupSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, { ...data.user, subscriptionTier: data.user.subscriptionTier ?? null, subscriptionExpiry: data.user.subscriptionExpiry ?? null });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: error.message || "An error occurred during registration",
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
          <CardTitle className="text-2xl font-bold tracking-tight">Create Profile</CardTitle>
          <CardDescription>Register for an APEX PRO terminal account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="bg-background/50 focus:border-neon-green/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormLabel>Password</FormLabel>
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
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating Profile..." : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground border-t border-border/50 pt-6">
          <div>
            Already have an account?{" "}
            <Link href="/login" className="text-neon-green hover:underline">
              Log in here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
