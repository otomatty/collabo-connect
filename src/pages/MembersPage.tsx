import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { mockUsers } from "@/lib/mockData";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(mockUsers.flatMap((u) => u.tags)));

  const filtered = mockUsers.filter((u) => {
    const matchSearch = !search || u.name.includes(search) || u.tags.some((t) => t.includes(search));
    const matchTag = !selectedTag || u.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold">メンバー</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="名前やタグで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-full pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {allTags.slice(0, 8).map((tag) => (
          <Badge
            key={tag}
            variant={selectedTag === tag ? "default" : "secondary"}
            className="rounded-full cursor-pointer text-xs"
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((user) => (
          <Link key={user.id} to={`/members/${user.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <UserAvatar name={user.name} className="h-12 w-12 text-base" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.aiIntro.slice(0, 50)}...</p>
                  <div className="flex flex-wrap gap-1">
                    {user.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-full text-xs py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
