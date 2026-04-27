import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
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

/** 候補の表示名: 既存タグ参照があればその名前、無ければ proposed_name にフォールバック。 */
function suggestionLabel(s: SuggestedTagWithTag): string {
  return s.tag?.name ?? s.proposed_name ?? "(名称未設定)";
}

function suggestionCategory(s: SuggestedTagWithTag): TagCategory {
  return s.tag?.category ?? s.proposed_category;
}

/**
 * 1 件分の候補を描画する子コンポーネント。
 *
 * 各行で `useAcceptSuggestedTag` / `useRejectSuggestedTag` を独立に呼ぶことで、
 * 連続クリック時に他の行のボタン状態を巻き込まないようにしている
 * （単一の mutation インスタンスを共有すると `variables` が後勝ちで上書きされ、
 *  進行中の行のボタンが誤って再度活性化されてしまう）。
 */
function SuggestionItem({
  suggestion,
  onMutated,
}: {
  suggestion: SuggestedTagWithTag;
  onMutated: () => void;
}) {
  const acceptMutation = useAcceptSuggestedTag();
  const rejectMutation = useRejectSuggestedTag();
  const isPending = acceptMutation.isPending || rejectMutation.isPending;
  const label = suggestionLabel(suggestion);

  const handleAccept = () => {
    acceptMutation.mutate(suggestion.id, {
      onSuccess: () => {
        toast.success(`「${label}」を追加しました`);
        onMutated();
      },
      onError: (err) => toast.error(err.message || "追加に失敗しました"),
    });
  };

  const handleReject = () => {
    rejectMutation.mutate(suggestion.id, {
      onSuccess: () => {
        toast.success(`「${label}」を却下しました`);
        onMutated();
      },
      onError: (err) => toast.error(err.message || "却下に失敗しました"),
    });
  };

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium break-all">{label}</span>
          <Badge variant="outline" className="text-[10px] font-normal">
            {CATEGORY_LABELS[suggestionCategory(suggestion)]}
          </Badge>
        </div>
      </div>
      {suggestion.reason ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.reason}</p>
      ) : null}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleAccept} disabled={isPending} className="flex-1">
          追加
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={isPending}
          className="flex-1"
        >
          却下
        </Button>
      </div>
    </div>
  );
}

export default function SuggestedTagsSheet({ open, onOpenChange }: SuggestedTagsSheetProps) {
  // useAuth().profile は React Query の外でローカル state 管理されているため、
  // ['profiles'] の invalidate だけでは MyPage 上の `tags` が更新されない。
  // mutation 成功時に明示的に refreshProfile を呼んで自己整合させる。
  const { user, refreshProfile } = useAuth();
  const { data: suggestions, isLoading, isError } = useSuggestedTags(user?.id);

  const items = suggestions ?? [];

  const handleMutated = () => {
    // QueryClient invalidate と平行で auth の profile state を再取得。
    // refreshProfile の失敗は UI ロジックを止めないためここで吸収する。
    refreshProfile().catch((err: unknown) => {
      const message =
        err instanceof Error ? err.message : "プロフィールの再取得に失敗しました";
      toast.error(message);
    });
  };

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
          ) : isError ? (
            <p className="text-sm text-destructive py-6 text-center">
              候補タグの取得に失敗しました。時間をおいて再度お試しください。
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              現在、候補のタグはありません。
            </p>
          ) : (
            items.map((s) => (
              <SuggestionItem key={s.id} suggestion={s} onMutated={handleMutated} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
