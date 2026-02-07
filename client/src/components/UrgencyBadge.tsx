import { cn } from "@/lib/utils";
import { UrgencyLevel } from "@shared/schema";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

interface UrgencyBadgeProps {
  level: UrgencyLevel;
  className?: string;
}

export function UrgencyBadge({ level, className }: UrgencyBadgeProps) {
  const styles = {
    high: "bg-red-500/15 text-red-500 border-red-500/20 shadow-[0_0_10px_-3px_rgba(239,68,68,0.3)]",
    medium: "bg-orange-500/15 text-orange-500 border-orange-500/20 shadow-[0_0_10px_-3px_rgba(249,115,22,0.3)]",
    low: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]",
  };

  const icons = {
    high: AlertCircle,
    medium: AlertTriangle,
    low: CheckCircle,
  };

  const Icon = icons[level];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border uppercase tracking-wider",
      styles[level],
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      {level}
    </span>
  );
}
