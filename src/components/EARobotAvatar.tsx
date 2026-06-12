interface EARobotAvatarProps {
  className?: string;
  animate?: boolean;
}

export function EARobotAvatar({ className = "", animate = true }: EARobotAvatarProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div
        className={`absolute inset-0 rounded-full ${animate ? "animate-pulse-neon" : ""}`}
        style={{ background: "radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)" }}
      />
      <img
        src="/logo.png"
        alt="GloriousFX Trader"
        className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]"
      />
    </div>
  );
}
