import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  // Score is 0-100
  // Color gradient from green (0) to red (100)
  
  const getColor = (s: number) => {
    if (s >= 80) return "text-red-500";
    if (s >= 50) return "text-orange-500";
    return "text-emerald-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
          {/* Background Circle */}
          <path
            className="text-muted"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          {/* Progress Circle */}
          <path
            className={cn("transition-all duration-500 ease-out", getColor(score))}
            strokeDasharray={`${score}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
        <span className={cn("absolute text-[10px] font-bold font-mono", getColor(score))}>
          {score}
        </span>
      </div>
    </div>
  );
}
