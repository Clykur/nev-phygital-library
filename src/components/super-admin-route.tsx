import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { useAuth } from "@/context/auth-context";
import { defaultLoggedInHome } from "@/lib/app-paths";
import { isSuperAdmin } from "@/lib/rbac";
import type { ReactNode } from "react";

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return <Redirect to="/sign-in" />;
  }
  if (!isSuperAdmin(user)) {
    return <Redirect to={defaultLoggedInHome(user)} />;
  }
  return <>{children}</>;
}
