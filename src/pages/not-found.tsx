import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE } from "@/lib/portal-typography";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface px-4">
      <div className={cn(PORTAL_PAGE_CONTAINER, "max-w-md")}>
        <Card variant="elevated" className="w-full">
          <CardContent className="p-6 pt-6">
            <div className="mb-4 flex gap-3">
              <AlertCircle className="h-8 w-8 shrink-0 text-destructive" aria-hidden />
              <h1 className={PORTAL_PAGE_TITLE}>Page not found</h1>
            </div>
            <p className={PORTAL_PAGE_LEAD}>
              This route does not exist. Check the URL or return to the catalog.
            </p>
            <Button asChild className="mt-6 w-full sm:w-auto">
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
