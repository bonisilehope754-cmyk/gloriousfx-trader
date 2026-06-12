import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Activity, 
  BarChart2, 
  CreditCard, 
  LogOut, 
  Settings, 
  Shield, 
  Terminal, 
  TrendingUp, 
  Users, 
  HelpCircle,
  Menu,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/signals", label: "Signals", icon: TrendingUp },
    { href: "/brokers", label: "Brokers", icon: CreditCard },
    { href: "/ea", label: "EA Manager", icon: Terminal },
    { href: "/scanner", label: "Chart Scanner", icon: BarChart2 },
    { href: "/profile", label: "Profile", icon: Settings },
    { href: "/support", label: "Support", icon: HelpCircle },
  ];

  if (user?.role === "admin") {
    links.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  const NavLinks = () => (
    <div className="flex flex-col gap-1 w-full mt-8">
      {links.map((link) => {
        const active = location === link.href;
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
            <Button
              variant={active ? "secondary" : "ghost"}
              className={`w-full justify-start ${active ? 'text-neon-green bg-neon-green/10 hover:bg-neon-green/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="w-4 h-4 mr-3" />
              {link.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-border z-50 relative">
        <div className="flex items-center">
          <img src="/logo.png" alt="Glorious Trader" className="h-8 w-auto" />
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0a0a0a] border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:relative md:flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 hidden md:flex items-center">
          <img src="/logo.png" alt="Glorious Trader" className="h-12 w-auto" />
        </div>

        <div className="flex-1 px-4 overflow-y-auto">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <div className="mt-1">
                <StatusBadge status={user?.subscriptionTier || "FREE"} />
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10"
            onClick={() => { logout(); setLocation("/login"); }}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
