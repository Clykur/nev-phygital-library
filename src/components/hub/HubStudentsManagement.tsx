import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Users, Wallet, CheckCircle, XCircle, RefreshCw, HandCoins } from "lucide-react";
import { format } from "date-fns";

export function HubStudentAnalytics({ overviewHubId }: { overviewHubId: string }) {
  const { token, user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["hub", "students", "analytics", overviewHubId, token],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => {
      const hubQ = overviewHubId === "all" ? "" : `?hubId=${encodeURIComponent(overviewHubId)}`;
      return apiFetch<any>(`/api/hub/students/analytics${hubQ}`, { token: token! });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-border/60">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <section aria-label="Student Analytics" className="rounded-md border border-border bg-background overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="section-kicker">
          Student Analytics
        </h2>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-5">
        <div className="p-3">
          <p className="section-kicker">Total Students</p>
          <p className="mt-1 font-mono h4-scale font-semibold tracking-tight text-foreground">
            {data.totalStudents}
          </p>
        </div>
        <div className="p-3">
          <p className="section-kicker">Active Subs</p>
          <p className="mt-1 font-mono h4-scale font-semibold tracking-tight text-foreground">
            {data.activeSubscriptions}
          </p>
        </div>
        <div className="p-3">
          <p className="section-kicker">Expired Subs</p>
          <p className="mt-1 font-mono h4-scale font-semibold tracking-tight text-foreground">
            {data.expiredSubscriptions}
          </p>
        </div>
        <div className="p-3">
          <p className="section-kicker">Credits Issued</p>
          <p className="mt-1 font-mono h4-scale font-semibold tracking-tight text-foreground">
            {data.totalCreditsIssued}
          </p>
        </div>
        <div className="p-3">
          <p className="section-kicker">Credits Spent</p>
          <p className="mt-1 font-mono h4-scale font-semibold tracking-tight text-foreground">
            {data.totalCreditsRedeemed}
          </p>
        </div>
      </div>
    </section>
  );
}

export function HubStudentsSection({ overviewHubId }: { overviewHubId: string }) {
  const { token, user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["hub", "students", overviewHubId, token],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => {
      const hubQ = overviewHubId === "all" ? "" : `?hubId=${encodeURIComponent(overviewHubId)}`;
      return apiFetch<any>(`/api/hub/students${hubQ}`, { token: token! });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border/60">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !data.students) return null;

  return (
    <section aria-label="Associated Students" className="rounded-md border border-border bg-background overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="section-kicker">
          Associated Students
        </h2>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[600px] w-full text-sm">
          <TableHeader>
            <TableRow className="border-b border-border text-left section-kicker text-foreground">
              <TableHead className="w-[30%] px-4 py-2">Student</TableHead>
              <TableHead className="w-[20%] hidden md:table-cell px-4 py-2">Contact</TableHead>
              <TableHead className="w-[15%] px-4 py-2">Status</TableHead>
              <TableHead className="w-[20%] hidden md:table-cell px-4 py-2">Subscription</TableHead>
              <TableHead className="w-[15%] text-right pr-4 py-2">Wallet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.students.length === 0 ? (
              <TableRow className="border-b border-border">
                <TableCell colSpan={5} className="h-32 text-center text-foreground-muted">
                  No students associated with this hub yet.
                </TableCell>
              </TableRow>
            ) : (
              data.students.map((student: any) => (
                <TableRow key={student.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <TableCell className="align-top py-3 px-4">
                    <div className="font-medium text-foreground whitespace-nowrap">{student.name || "Unknown Student"}</div>
                    <div className="caption-scale font-medium text-foreground-muted font-mono mt-0.5">{student.publicId}</div>
                    <div className="caption-scale font-medium text-foreground-muted mt-1.5 md:hidden space-y-0.5">
                      <div className="truncate max-w-[150px]">{student.email || "No email"}</div>
                      <div className="capitalize">{student.subscriptionPlan || "No active plan"}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell align-top py-3 px-4">
                    <div className="body-scale text-foreground truncate max-w-[180px]">{student.email || "-"}</div>
                    {student.phone && <div className="caption-scale font-medium text-foreground-muted mt-0.5">{student.phone}</div>}
                  </TableCell>
                  <TableCell className="align-top py-3 px-4">
                    <Badge variant={student.accountStatus === 'active' ? 'default' : 'secondary'} className="capitalize rounded-sm px-2 py-0.5 caption-scale font-semibold">
                      {student.accountStatus || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell align-top py-3 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className={
                        student.subscriptionStatus === 'active'
                          ? "border-success/30 text-success bg-success/10 rounded-sm px-2 py-0.5 caption-scale font-semibold capitalize"
                          : "border-border text-foreground-muted rounded-sm px-2 py-0.5 caption-scale font-semibold capitalize"
                      }>
                        {student.subscriptionStatus || 'Inactive'}
                      </Badge>
                      <span className="caption-scale font-medium text-foreground-muted capitalize">{student.subscriptionPlan || "No active plan"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right align-top py-3 px-4">
                    <div className="font-mono font-semibold body-scale text-foreground">{student.walletBalance ?? 0} cr</div>
                    <div className="caption-scale font-medium text-foreground-muted mt-0.5 whitespace-nowrap">
                      <span className="text-success">+{student.creditsEarned ?? 0}</span> / <span className="text-destructive">-{student.creditsSpent ?? 0}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
