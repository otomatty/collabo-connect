import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";
import { currentUser } from "@/lib/mockData";

interface AppHeaderProps {
  title: string;
  back?: boolean | string;
  action?: React.ReactNode;
  hideAvatar?: boolean;
}

export default function AppHeader({ title, back, action, hideAvatar }: AppHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof back === "string") {
      navigate(back);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="flex items-center gap-2 pb-1">
      {back && (
        <Button variant="ghost" size="icon" className="shrink-0 -ml-2 h-8 w-8" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      <h1 className="text-lg font-semibold flex-1 truncate">{title}</h1>

      {action && <div className="shrink-0">{action}</div>}

      {!hideAvatar && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0">
              <UserAvatar name={currentUser.name} className="h-8 w-8 text-xs" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.role}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/mypage" className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                マイページ
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
