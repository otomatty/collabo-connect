import * as React from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

const currentYear = new Date().getFullYear();
const YEAR_MIN = currentYear - 9;
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

export interface MonthYearPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  supportingText?: string;
  className?: string;
}

function parseValue(value: string): { year: number; month: number } | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [y, m] = value.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  return { year: y, month: m };
}

function formatDisplay(value: string): string {
  const p = parseValue(value);
  if (!p) return "";
  return `${p.year}年${p.month}月`;
}

export function MonthYearPicker({
  value,
  onChange,
  id,
  label,
  placeholder = "選択してください",
  disabled = false,
  supportingText,
  className,
}: MonthYearPickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseValue(value);
  const [year, setYear] = React.useState(parsed?.year ?? currentYear);
  const [month, setMonth] = React.useState(parsed?.month ?? 1);

  React.useEffect(() => {
    if (parsed) {
      setYear(parsed.year);
      setMonth(parsed.month);
    } else {
      setYear(currentYear);
      setMonth(1);
    }
  }, [parsed?.year, parsed?.month]);

  const displayText = value ? formatDisplay(value) : "";
  const hasValue = Boolean(value);

  const handleSelectMonth = (m: number) => {
    const next = `${year}-${String(m).padStart(2, "0")}`;
    onChange(next);
    setMonth(m);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "block text-xs font-medium tracking-wide transition-colors",
            hasValue ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex h-12 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-4 py-3 text-left text-base",
              "outline-none transition-[border-color,box-shadow] duration-200",
              "hover:border-input hover:bg-primary/10",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={label ? `${label}: ${displayText || placeholder}` : undefined}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
              <span className={displayText ? "text-foreground" : "text-muted-foreground"}>
                {displayText || placeholder}
              </span>
            </span>
            <ChevronDown
              className={cn("h-5 w-5 text-muted-foreground transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] rounded-xl border border-border bg-popover p-0 shadow-md"
          sideOffset={8}
        >
          <div className="p-3">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {label ?? "年月を選択"}
            </p>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">年</label>
              <ScrollArea className="h-[180px] rounded-lg border border-input bg-muted/50">
                <div className="p-2">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={cn(
                        "flex w-full items-center justify-center rounded-full py-2.5 text-sm transition-colors",
                        "hover:bg-primary/10",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        year === y && "bg-primary text-primary-foreground font-medium",
                      )}
                    >
                      {y}年
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">月</label>
              <div className="grid grid-cols-4 gap-1">
                {MONTHS.map((monthLabel, i) => {
                  const m = i + 1;
                  const isSelected = month === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(m)}
                      className={cn(
                        "rounded-full py-2.5 text-sm transition-colors",
                        "hover:bg-primary/10",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        isSelected && "bg-primary text-primary-foreground font-medium",
                      )}
                    >
                      {monthLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {supportingText && (
        <p className="text-xs text-muted-foreground" role="status">
          {supportingText}
        </p>
      )}
    </div>
  );
}
