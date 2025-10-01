import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function ExpandableSection({ 
  title, 
  children, 
  defaultExpanded = false, 
  className 
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("border rounded-lg", className)}>
      <Button
        type="button"
        variant="ghost"
        className="w-full flex items-center justify-between p-4 h-auto text-left font-medium hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>{title}</span>
        <ChevronRight 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded && "rotate-90"
          )} 
        />
      </Button>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50">
          {children}
        </div>
      )}
    </div>
  );
}
