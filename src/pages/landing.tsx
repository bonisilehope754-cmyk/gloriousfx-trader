import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useGetPricingPlans } from "@workspace/api-client-react";
import { Shield, TrendingUp, Terminal, BarChart2 } from "lucide-react";

export default function LandingPage() {
  const { data: plans } = useGetPricingPlans();

  return (
    <div className="min-h-screen bg-[#050505] text-foreground font-sans selection:bg-neon-green selection:text-black">
      {/* Navbar */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <img src="/logo.png" alt="Glorious Trader" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hover:text-neon-green hover:bg-neon-green/10">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-neon-green text-black hover:bg-neon-green/80 neon-glow">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="flex justify-center mb-10">
            <img src="/logo.png" alt="Glorious FX" className="h-36 w-auto drop-shadow-[0_0_24px_rgba(255,215,0,0.4)]" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Trade Smarter with <span className="text-neon-green" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, letterSpacing: '0.02em' }}>GloriousFX AI Precision</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Get elite trading signals, an automated Expert Advisor, and AI-driven chart scanning all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-neon-green text-black hover:bg-neon-green/90 neon-glow">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 border-border hover:bg-white/5" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card/30 border-y border-border/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background/50 border-border/50 card-glow">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-neon-green mb-4" />
                <CardTitle>Premium Signals</CardTitle>
                <CardDescription>High-probability trade setups with exact entry, stop loss, and take profit targets.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-background/50 border-border/50 card-glow">
              <CardHeader>
                <Terminal className="w-10 h-10 text-neon-cyan mb-4" />
                <CardTitle>Expert Advisor</CardTitle>
                <CardDescription>Connect your MT4/MT5 broker and let our EA execute trades automatically.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-background/50 border-border/50 card-glow">
              <CardHeader>
                <BarChart2 className="w-10 h-10 text-[#ffd700] mb-4" />
                <CardTitle>AI Chart Scanner</CardTitle>
                <CardDescription>Instantly analyze any pair and timeframe for hidden patterns and trends.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16">Membership Plans</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans?.map((plan) => (
              <Card key={plan.id} className={`bg-background/50 border-border/50 relative overflow-hidden ${plan.isPopular ? 'border-neon-green/50 shadow-[0_0_30px_rgba(0,255,136,0.1)]' : ''}`}>
                {plan.isPopular && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-neon-green" />
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R{plan.priceZar}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Shield className="w-5 h-5 text-neon-green shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/payment?plan=${plan.tier}`}>
                    <Button className="w-full" variant={plan.isPopular ? "default" : "outline"}>
                      Choose {plan.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-card/30 border-t border-border/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-border/50">
              <AccordionTrigger className="hover:text-neon-green">Do I need trading experience?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No, our platform is designed for both beginners and professionals. The Expert Advisor can trade completely hands-free once connected to your broker.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-border/50">
              <AccordionTrigger className="hover:text-neon-green">Which brokers are supported?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We support any broker that offers MT4 or MT5 platforms. You simply need your server address, account number, and password to connect via our dashboard.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-border/50">
              <AccordionTrigger className="hover:text-neon-green">How accurate are the signals?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our AI-driven strategy maintains an average win rate of 74-82% depending on market conditions, with strict risk management (1:2 minimum Risk-Reward).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <footer className="py-10 text-center border-t border-border/50">
        <p className="text-muted-foreground">© 2026 GloriousFX Trader. All rights reserved.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Need help?{" "}
          <a href="mailto:glorious.support@gmail.com" className="text-primary hover:underline">
            glorious.support@gmail.com
          </a>
        </p>
        <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto">Trading foreign exchange on margin carries a high level of risk. Past performance is not indicative of future results.</p>
      </footer>
    </div>
  );
}
