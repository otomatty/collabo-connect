import { Link, useRouterState } from "@tanstack/react-router";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type NavLinkProps = React.ComponentProps<typeof Link> & {
  activeClassName?: string;
  pendingClassName?: string;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const toPath = typeof to === "string" ? to : (to as { to?: string }).to ?? "";
    const isActive =
      toPath === "/" ? pathname === "/" : pathname === toPath || pathname.startsWith(toPath + "/");

    return (
      <Link
        ref={ref}
        to={to}
        className={cn(className, isActive && activeClassName, pendingClassName)}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
