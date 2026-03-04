import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuideConfig } from "@/lib/guideConfig";

interface GuideModalProps {
  open: boolean;
  guide: GuideConfig;
  onDismiss: (hideAllGuides: boolean) => void;
}

/** マークダウン風の簡単な整形（**太字** のみ対応） */
function formatDescription(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={i > 0 ? "mt-2" : ""}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </p>
    );
  });
}

export function GuideModal({ open, guide, onDismiss }: GuideModalProps) {
  const [hideAllGuides, setHideAllGuides] = useState(false);

  const handleClose = () => {
    onDismiss(hideAllGuides);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">{guide.title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription
          className={cn(
            "rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground leading-relaxed"
          )}
        >
          {formatDescription(guide.description)}
        </DialogDescription>
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="hide-all-guides"
            checked={hideAllGuides}
            onCheckedChange={(checked) => setHideAllGuides(checked === true)}
          />
          <Label
            htmlFor="hide-all-guides"
            className="text-sm font-normal cursor-pointer text-muted-foreground"
          >
            すべてのガイドを今後表示しない
          </Label>
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>
            わかりました
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
