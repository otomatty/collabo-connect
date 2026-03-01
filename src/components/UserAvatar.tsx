import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  className?: string;
}

const colors = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent",
  "bg-secondary text-secondary-foreground",
  "bg-muted text-muted-foreground",
];

export default function UserAvatar({ name, className }: UserAvatarProps) {
  const idx = name.charCodeAt(0) % colors.length;
  const initial = name.charAt(0);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-medium",
        colors[idx],
        className ?? "h-10 w-10 text-sm"
      )}
    >
      {initial || <User className="h-4 w-4" />}
    </div>
  );
}
