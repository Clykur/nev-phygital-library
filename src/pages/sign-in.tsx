import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { HUB_KIND_OPTIONS, type HubKindValue } from "@/lib/hub-display";
import { afterAuthPath, afterHubRegisterPath } from "@/lib/sign-in-return";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registerAs, setRegisterAs] = useState<"student" | "hub">("student");
  const [hubName, setHubName] = useState("");
  const [hubLocation, setHubLocation] = useState("");
  const [hubKind, setHubKind] = useState<HubKindValue>("other");
  const [busy, setBusy] = useState(false);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/");
  }, [setLocation]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const signedIn = await login(email, password);
      toast.success("Signed in");
      setLocation(afterAuthPath(signedIn));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (registerAs === "hub") {
        const created = await register({
          name,
          email,
          password,
          accountType: "hub",
          hubName: hubName.trim(),
          hubLocation: hubLocation.trim(),
          hubKind,
        });
        if (created.hubStaffHubIds.length === 0) {
          toast.error(
            "Hub portal access was not attached to your account. Restart the API dev server (so it rebuilds), then register again with a new email — or ask an admin to add a hub_admin membership for you.",
            { duration: 12_000 },
          );
          setLocation(afterAuthPath(created));
          return;
        }
        toast.success("Hub created — you’re the hub lead");
        setLocation(afterHubRegisterPath(created));
      } else {
        const created = await register({ name, email, password });
        toast.success("Account created");
        setLocation(afterAuthPath(created));
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not register");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-[#0F172A]/55 px-4 py-10 pb-16 backdrop-blur-[3px] sm:items-center sm:py-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-title"
    >
      {/* Click-away closes like a modal */}
      <button
        type="button"
        aria-label="Close sign-in"
        className="fixed inset-0 z-0 cursor-default"
        onClick={dismiss}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px] border border-border bg-card shadow-2xl ring-1 ring-black/[0.06] dark:ring-white/[0.06]"
      >
        <div className="absolute right-3 top-3 z-20 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-none text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={dismiss}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-6 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-11">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">
            Neev
          </p>
          <h1
            id="sign-in-title"
            className="mt-3 font-[var(--font-display)] text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-[1.65rem]"
          >
            Student Library Network
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sign in to browse the marketplace, borrow or buy at hubs, and list your copies.
          </p>

          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="grid h-11 w-full grid-cols-2 gap-0 rounded-none border border-border bg-muted/50 p-0">
              <TabsTrigger
                value="signin"
                className="rounded-none border-0 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-none border-0 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-7 outline-none">
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="si-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-none border-border bg-background focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-password" className="text-foreground">
                    Password
                  </Label>
                  <Input
                    id="si-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-none border-border bg-background focus-visible:ring-primary"
                  />
                </div>
                <Button type="submit" disabled={busy} className="mt-2 h-11 w-full rounded-none font-semibold">
                  {busy ? "…" : "Continue"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-7 outline-none">
              <form onSubmit={onRegister} className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-foreground">I am signing up as</Label>
                  <RadioGroup
                    value={registerAs}
                    onValueChange={(v) => setRegisterAs(v as "student" | "hub")}
                    className="grid gap-2"
                  >
                    <label
                      className={cn(
                        "flex cursor-pointer gap-3 border p-3 text-left transition-colors rounded-none",
                        registerAs === "student"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                          : "border-border bg-background hover:bg-muted/50",
                      )}
                    >
                      <RadioGroupItem value="student" id="reg-student" className="mt-0.5 border-primary" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">Student</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Borrow, buy, and sell books on the campus shelf.
                        </span>
                      </span>
                    </label>
                    <label
                      className={cn(
                        "flex cursor-pointer gap-3 border p-3 text-left transition-colors rounded-none",
                        registerAs === "hub"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                          : "border-border bg-background hover:bg-muted/50",
                      )}
                    >
                      <RadioGroupItem value="hub" id="reg-hub" className="mt-0.5 border-primary" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          Library hub (desk)
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Register a lending location and use hub desk tools.
                        </span>
                      </span>
                    </label>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name">{registerAs === "hub" ? "Your name" : "Name"}</Label>
                  <Input
                    id="reg-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 rounded-none border-border bg-background focus-visible:ring-primary"
                  />
                </div>
                {registerAs === "hub" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reg-hub-name">Hub / library name</Label>
                      <Input
                        id="reg-hub-name"
                        value={hubName}
                        onChange={(e) => setHubName(e.target.value)}
                        required
                        placeholder="e.g. North Campus Reading Room"
                        className="h-11 rounded-none border-border bg-background focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-hub-location">Location</Label>
                      <Input
                        id="reg-hub-location"
                        value={hubLocation}
                        onChange={(e) => setHubLocation(e.target.value)}
                        required
                        placeholder="City, campus, or address"
                        className="h-11 rounded-none border-border bg-background focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-hub-kind">Hub type</Label>
                      <Select value={hubKind} onValueChange={(v) => setHubKind(v as HubKindValue)}>
                        <SelectTrigger
                          id="reg-hub-kind"
                          className="h-11 rounded-none border-border bg-background focus:ring-primary"
                        >
                          <SelectValue placeholder="Choose type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-border">
                          {HUB_KIND_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-none border-border bg-background focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password (min 8)</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11 rounded-none border-border bg-background focus-visible:ring-primary"
                  />
                </div>
                <Button type="submit" disabled={busy} className="mt-2 h-11 w-full rounded-none font-semibold">
                  {busy ? "…" : registerAs === "hub" ? "Create hub & account" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
