import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, Redirect } from "wouter";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: "user" | "admin";
}

export default function RoleGuard({ children, requiredRole = "user" }: RoleGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="brand-mark">la</div>
          <span className="text-sm text-muted-foreground">Verifying permissions…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  // Check role authorization
  const activeRole = localStorage.getItem("activeRole") || user?.role || "user";
  
  if (requiredRole === "admin" && activeRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-destructive/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="inline-flex size-14 rounded-2xl bg-destructive/10 text-destructive items-center justify-center">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You do not have Administrator permissions to view this area. Admin authorization is strictly enforced.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft size={16} /> Return to Learner Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
