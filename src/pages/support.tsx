import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, MessageCircle, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Please provide more detail (at least 20 characters)"),
});

const COMMON_TOPICS = [
  { icon: "💳", label: "Payment not approved", subject: "My EFT payment has not been approved" },
  { icon: "🤖", label: "EA not working", subject: "Expert Advisor is not executing trades" },
  { icon: "📶", label: "Broker connection issue", subject: "Cannot connect my broker account" },
  { icon: "📊", label: "Missing signals", subject: "I am not receiving trading signals" },
  { icon: "📱", label: "WhatsApp alerts", subject: "I am not receiving WhatsApp signal notifications" },
  { icon: "🔑", label: "Account / login issue", subject: "I cannot log into my account" },
];

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "Please try again or email us directly at glorious.support@gmail.com",
      });
    } finally {
      setLoading(false);
    }
  };

  const fillTopic = (subject: string) => {
    form.setValue("subject", subject);
    form.setValue("message", "");
    document.getElementById("message-field")?.focus();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-primary/30 bg-card/50 text-center p-8">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ticket Submitted!</h2>
          <p className="text-muted-foreground mb-2">
            Your support request has been received. Our team will review it and respond to <strong>{form.getValues("email")}</strong> within 24 hours.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            For urgent queries:{" "}
            <a href="mailto:glorious.support@gmail.com" className="text-primary hover:underline">
              glorious.support@gmail.com
            </a>
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={user ? "/dashboard" : "/"}>
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
            <Button onClick={() => { setSubmitted(false); form.reset({ name: user?.name ?? "", email: user?.email ?? "" }); }}>
              Submit Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={user ? "/dashboard" : "/"}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <img src="/logo.png" alt="GloriousFX" className="h-9 w-auto" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Contact{" "}
            <span className="text-primary" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Support
            </span>
          </h1>
          <p className="text-muted-foreground text-lg">We typically respond within 24 hours on business days.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: info + quick topics */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> Direct Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href="mailto:glorious.support@gmail.com"
                  className="text-primary text-sm font-medium hover:underline break-all"
                >
                  glorious.support@gmail.com
                </a>
                <p className="text-xs text-muted-foreground mt-2">For urgent issues, email us directly.</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Response Time
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>🟢 Chat AI — instant</p>
                <p>📧 Email — within 24 h</p>
                <p>📋 Tickets — within 24 h</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" /> Quick Topics
                </CardTitle>
                <CardDescription>Tap to pre-fill your subject</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {COMMON_TOPICS.map((t) => (
                  <button
                    key={t.subject}
                    onClick={() => fillTopic(t.subject)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center gap-2"
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: form */}
          <div className="md:col-span-2">
            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>Fill in the details below and our team will get back to you.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input {...field} type="email" className="bg-background/50" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="subject" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl><Input {...field} placeholder="What do you need help with?" className="bg-background/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            id="message-field"
                            placeholder="Describe your issue in detail — include any error messages, your account email, and steps you've already tried."
                            rows={6}
                            className="bg-background/50 resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary text-black hover:bg-primary/90 neon-glow font-semibold"
                      disabled={loading}
                    >
                      {loading ? "Submitting…" : "Submit Ticket"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
