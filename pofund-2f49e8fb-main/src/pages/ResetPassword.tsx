import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Eye, EyeOff, Check, X, ArrowRight } from "lucide-react";
import logo from "@/assets/mypo-logo.png";
import { cn } from "@/lib/utils";

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Password must be 72 characters or less")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^a-zA-Z0-9]/, "At least one special character");

const evaluatePassword = (pw: string) => [
  { label: "At least 8 characters", passed: pw.length >= 8 },
  { label: "One uppercase letter", passed: /[A-Z]/.test(pw) },
  { label: "One lowercase letter", passed: /[a-z]/.test(pw) },
  { label: "One number", passed: /[0-9]/.test(pw) },
  { label: "One special character", passed: /[^a-zA-Z0-9]/.test(pw) },
];

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase exchanges the recovery token automatically and emits PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checks = useMemo(() => evaluatePassword(password), [password]);
  const passedCount = checks.filter((c) => c.passed).length;
  const strengthPct = (passedCount / checks.length) * 100;
  const strengthLabel = passedCount <= 2 ? "Weak" : passedCount <= 4 ? "Fair" : "Strong";
  const strengthColor =
    passedCount <= 2 ? "bg-destructive" : passedCount <= 4 ? "bg-yellow-500" : "bg-green-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      toast({
        title: "Weak Password",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      const msg = error.message || "";
      const description = /pwned|leaked|compromised|breach/i.test(msg)
        ? "This password has appeared in a known data breach. Please choose a different one."
        : msg;
      toast({ title: "Reset Failed", description, variant: "destructive" });
      return;
    }

    toast({
      title: "Password updated",
      description: "Your password has been reset. You're now signed in.",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logo} alt="MyPO logo" className="h-32 w-auto brightness-0 invert" width={256} height={256} />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Set a new password
          </h1>
          <p className="text-primary-foreground/60">
            Choose a strong password to secure your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-elevated space-y-5">
          {!ready && (
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground text-center">
              Verifying your reset link...
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-300", strengthColor)}
                      style={{ width: `${strengthPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {strengthLabel}
                  </span>
                </div>
                <ul className="space-y-1">
                  {checks.map((check) => (
                    <li
                      key={check.label}
                      className={cn(
                        "flex items-center gap-1.5 text-xs transition-colors",
                        check.passed ? "text-green-600" : "text-muted-foreground"
                      )}
                    >
                      {check.passed ? (
                        <Check className="w-3 h-3 shrink-0" />
                      ) : (
                        <X className="w-3 h-3 shrink-0" />
                      )}
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || !ready}>
            {loading ? "Updating..." : (
              <>
                Update password
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
