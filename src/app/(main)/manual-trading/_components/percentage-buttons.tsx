import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PercentageButtonsProps {
  onPercentageSelect: (percentage: number) => void;
  className?: string;
}

const PERCENTAGE_OPTIONS = [25, 50, 75, 100];

export function PercentageButtons({ onPercentageSelect, className }: PercentageButtonsProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {PERCENTAGE_OPTIONS.map((percentage) => (
        <Button
          key={percentage}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs font-medium hover:bg-muted transition-colors"
          onClick={() => onPercentageSelect(percentage)}
        >
          {percentage}%
        </Button>
      ))}
    </div>
  );
}
