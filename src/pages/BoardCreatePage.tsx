import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const categories = [
  { value: "food", label: "🍽️ ごはん・飲み" },
  { value: "study", label: "📚 勉強会・技術相談" },
  { value: "event", label: "🎉 イベント" },
];

export default function BoardCreatePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("food");
  const [dateUndecided, setDateUndecided] = useState(false);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
      <Link to="/board" className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> 戻る
      </Link>

      <h1 className="text-xl font-bold">募集を作成</h1>

      <Card>
        <CardContent className="p-4 space-y-5">
          {/* Category */}
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Button
                  key={c.value}
                  variant={category === c.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCategory(c.value)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input id="title" placeholder="例: 新宿でランチ行きませんか？" className="rounded-xl" />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>日時</Label>
            <div className="flex items-center gap-3">
              <Input type="date" disabled={dateUndecided} className="rounded-xl flex-1" />
              <Button
                variant={dateUndecided ? "default" : "outline"}
                size="sm"
                className="rounded-full shrink-0"
                onClick={() => setDateUndecided(!dateUndecided)}
              >
                未定
              </Button>
            </div>
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="area">エリア</Label>
            <Input id="area" placeholder="例: 新宿 / オンライン" className="rounded-xl" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc">概要</Label>
            <Textarea
              id="desc"
              placeholder="どんな集まりか、気軽に書いてください！"
              className="rounded-xl min-h-[100px]"
            />
          </div>

          <Button className="w-full rounded-xl py-5 text-base" onClick={() => navigate("/board")}>
            募集を投稿する
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
