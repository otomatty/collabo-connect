import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name: string;
  url?: string | null;
  className?: string;
}

const colors = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent",
  "bg-secondary text-secondary-foreground",
  "bg-muted text-muted-foreground",
];

export default function UserAvatar({ name, url, className }: UserAvatarProps) {
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const initial = name ? name.charAt(0).toUpperCase() : "";

  return (
    <Avatar className={cn(className ?? "h-10 w-10 text-sm")}>
      {url && <AvatarImage src={url} alt={name} className="object-cover" />}
      <AvatarFallback className={cn("font-medium", colors[idx])} delayMs={url ? 600 : 0}>
        {initial || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
