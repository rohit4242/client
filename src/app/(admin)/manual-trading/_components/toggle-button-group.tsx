import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToggleOption {
  value: string;
  label: string;
  variant?: 'default' | 'success' | 'danger';
}

interface ToggleButtonGroupProps {
  options: ToggleOption[];
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

const variantStyles = {
  default: {
    selected: "bg-slate-800 hover:bg-slate-900 text-white",
    unselected: "hover:bg-slate-50 hover:text-slate-800 hover:border-slate-800"
  },
  success: {
    selected: "bg-teal-600 hover:bg-teal-700 text-white",
    unselected: "hover:bg-teal-50 hover:text-teal-600 hover:border-teal-600"
  },
  danger: {
    selected: "bg-rose-600 hover:bg-rose-700 text-white",
    unselected: "hover:bg-rose-50 hover:text-rose-600 hover:border-rose-600"
  }
};

export function ToggleButtonGroup({
  options,
  value,
  onChange,
  className
}: ToggleButtonGroupProps) {
  return (
    <div className={cn("grid gap-2", 
      options.length === 2 ? "grid-cols-2" : 
      options.length === 3 ? "grid-cols-3" : 
      "grid-cols-1", 
      className
    )}>
      {options.map((option) => {
        const variant = option.variant || 'default';
        const styles = variantStyles[variant];
        const isSelected = value === option.value;
        
        return (
          <Button
            key={option.value}
            type="button"
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "transition-all duration-200",
              isSelected ? styles.selected : styles.unselected
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
