import { Badge } from "@/components/ui/badge";

export type StatusVariant = 
  | "premium" | "pro" | "lite" | "guest" | "admin" 
  | "approved" | "pending" | "rejected" | "failed"
  | "IDLE" | "RUNNING" | "ERROR"
  | "active" | "closed" | "hit_tp1" | "hit_tp2" | "hit_sl"
  | "BUY" | "SELL"
  | "BULLISH" | "BEARISH" | "NEUTRAL";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normStatus = status?.toUpperCase() as StatusVariant | string;

  let variantClass = "bg-muted text-muted-foreground border-muted-foreground/30";

  switch (normStatus) {
    case "PREMIUM":
      variantClass = "bg-[#ffd700]/10 text-[#ffd700] border-[#ffd700]/30 shadow-[0_0_10px_rgba(255,215,0,0.2)]";
      break;
    case "PRO":
      variantClass = "bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]";
      break;
    case "LITE":
      variantClass = "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30";
      break;
    case "ADMIN":
      variantClass = "bg-primary/10 text-primary border-primary/30";
      break;
    
    case "APPROVED":
    case "RUNNING":
    case "HIT_TP1":
    case "HIT_TP2":
    case "BUY":
    case "BULLISH":
      variantClass = "bg-neon-green/10 text-neon-green border-neon-green/30 shadow-[0_0_8px_rgba(0,255,136,0.3)]";
      break;

    case "PENDING":
    case "ACTIVE":
      variantClass = "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30";
      break;

    case "REJECTED":
    case "FAILED":
    case "ERROR":
    case "HIT_SL":
    case "SELL":
    case "BEARISH":
      variantClass = "bg-danger/10 text-danger border-danger/30 shadow-[0_0_8px_rgba(255,0,102,0.3)]";
      break;

    case "IDLE":
    case "CLOSED":
    case "NEUTRAL":
    default:
      variantClass = "bg-muted text-muted-foreground border-muted-foreground/30";
      break;
  }

  return (
    <Badge variant="outline" className={`font-mono uppercase ${variantClass} ${className}`}>
      {status?.replace('_', ' ')}
    </Badge>
  );
}
