import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  useAcceptSuggestedTag,
  useRejectSuggestedTag,
  useSuggestedTags,
  type SuggestedTagWithTag,
} from "@/hooks/useSuggestedTags";
import type { TagCategory } from "@/types/tags";

interface SuggestedTagsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_LABELS: Record<TagCategory, string> = {
  skill: "スキル",
  hobby: "趣味",
  area: "エリア",
  role: "役割",
  other: "その他",
};

/** Display name for a suggestion: prefer canonical tag, fall back to proposed_name. */
function suggestionLabel(s: SuggestedTagWithTag): string {
  return s.tag?.name ?? s.proposed_name ?? "(名称未設定)";
}

function suggestionCategory(s: SuggestedTagWithTag): TagCategory {
  return s.tag?.category ?? s.proposed_category;
}

export default function SuggestedTagsSheet({ open, onOpenChange }: SuggestedTagsSheetProps) {
  const { data: suggestions, isLoading } = useSuggestedTags();
  const acceptMutation = useAcceptSuggestedTag();
  const rejectMutation = useRejectSuggestedTag();

  const handleAccept = (s: SuggestedTagWithTag) => {
    acceptMutation.mutate(s.id, {
      onSuccess: () => toast.success(`「${suggestionLabel(s)}」を追加しました`),
      onError: (err) => toast.error(err.message || "追加に失敗しました"),
    });
  };

  const handleReject = (s: SuggestedTagWithTag) => {
    rejectMutation.mutate(s.id, {
      onSuccess: () => toast.success(`「${suggestionLabel(s)}」を却下しました`),
      onError: (err) => toast.error(err.message || "却下に失敗しました"),
    });
  };

  const items = suggestions ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle>タグ候補</SheetTitle>
          <SheetDescription>
            AIが提案したタグです。あなたに合うものを追加してください。
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              読み込み中...
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              現在、候補のタグはありません。
            </p>
          ) : (
            items.map((s) => {
              const isPending =
                (acceptMutation.isPending && acceptMutation.variables === s.id) ||
                (rejectMutation.isPending && rejectMutation.variables === s.id);
              return (
                <div
                  key={s.id}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium break-all">
                        {suggestionLabel(s)}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {CATEGORY_LABELS[suggestionCategory(s)]}
                      </Badge>
                    </div>
                  </div>
                  {s.reason ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {s.reason}
                    </p>
                  ) : null}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(s)}
                      disabled={isPending}
                      className="flex-1"
                    >
                      追加
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(s)}
                      disabled={isPending}
                      className="flex-1"
                    >
                      却下
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
