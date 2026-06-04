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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalStudents}</div>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Subs</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.activeSubscriptions}</div>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Expired Subs</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.expiredSubscriptions}</div>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Credits Issued</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalCreditsIssued}</div>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Credits Spent</CardTitle>
          <HandCoins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalCreditsRedeemed}</div>
        </CardContent>
      </Card>
    </div>
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
    <div className="space-y-6">
      <h2 className="text-lg font-serif font-bold">Associated Students</h2>
      
      <div className="rounded-xl border border-border/60 overflow-hidden bg-background shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead className="text-right">Wallet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No students associated with this hub yet.
                </TableCell>
              </TableRow>
            ) : (
              data.students.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{student.name}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{student.publicId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{student.email}</div>
                    {student.phone && <div className="text-xs text-muted-foreground mt-1">{student.phone}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.accountStatus === 'active' ? 'default' : 'secondary'} className="capitalize rounded-md">
                      {student.accountStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className={
                        student.subscriptionStatus === 'active' 
                          ? "border-green-500/30 text-success dark:text-success bg-green-500/10" 
                          : "border-border text-muted-foreground"
                      }>
                        {student.subscriptionStatus}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{student.subscriptionPlan}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-mono font-medium">{student.walletBalance} cr</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="text-success dark:text-success">+{student.creditsEarned}</span> / <span className="text-destructive">-{student.creditsSpent}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
