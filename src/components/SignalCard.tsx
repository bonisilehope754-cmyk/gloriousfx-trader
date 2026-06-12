import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";

interface SignalCardProps {
  signal: {
    id: number;
    pair: string;
    direction: string;
    entry: number;
    tp1: number;
    tp2: number;
    sl: number;
    status: string;
    createdAt: string;
    pips?: number | null;
  };
}

export function SignalCard({ signal }: SignalCardProps) {
  const isBuy = signal.direction.toUpperCase() === "BUY";
  
  return (
    <Card className={`relative overflow-hidden card-glow border-l-4 ${isBuy ? 'border-l-neon-green' : 'border-l-danger'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight">{signal.pair}</h3>
            <p className="text-xs text-muted-foreground font-mono">
              {format(new Date(signal.createdAt), "MMM d, HH:mm")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={signal.direction} />
            <StatusBadge status={signal.status} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-2 text-sm font-mono bg-background p-3 rounded-md border border-border/50">
          <div className="flex justify-between text-muted-foreground">
            <span>ENTRY</span>
            <span className="text-foreground">{signal.entry}</span>
          </div>
          <div className="flex justify-between text-muted-foreground pl-4 border-l border-border/50">
            <span>SL</span>
            <span className="text-danger">{signal.sl}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>TP1</span>
            <span className="text-neon-green">{signal.tp1}</span>
          </div>
          <div className="flex justify-between text-muted-foreground pl-4 border-l border-border/50">
            <span>TP2</span>
            <span className="text-neon-green">{signal.tp2}</span>
          </div>
        </div>

        {signal.pips != null && (
          <div className="mt-3 text-right">
            <span className={`font-mono font-bold ${signal.pips >= 0 ? 'text-neon-green' : 'text-danger'}`}>
              {signal.pips >= 0 ? '+' : ''}{signal.pips} PIPS
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
