import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Check, X } from "lucide-react";
import logo from "@/assets/mypo-logo.png";
import { cn } from "@/lib/utils";

// Strong password schema for sign-up
const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Password must be 72 characters or less") // bcrypt limit
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^a-zA-Z0-9]/, "At least one special character");

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

interface PasswordCheck {
  label: string;
  passed: boolean;
}

const evaluatePassword = (pw: string): PasswordCheck[] => [
  { label: "At least 8 characters", passed: pw.length >= 8 },
  { label: "One uppercase letter", passed: /[A-Z]/.test(pw) },
  { label: "One lowercase letter", passed: /[a-z]/.test(pw) },
  { label: "One number", passed: /[0-9]/.test(pw) },
  { label: "One special character", passed: /[^a-zA-Z0-9]/.test(pw) },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const intent = searchParams.get("intent");

  const [isLogin, setIsLogin] = useState(!intent);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      if (redirectTo) navigate(redirectTo);
      else navigate("/dashboard");
    }
  }, [authLoading, user, profile, navigate, redirectTo]);

  const checks = useMemo(() => evaluatePassword(password), [password]);
  const passedCount = checks.filter((c) => c.passed).length;
  const strengthPct = (passedCount / checks.length) * 100;
  const strengthLabel =
    passedCount <= 2 ? "Weak" : passedCount <= 4 ? "Fair" : "Strong";
  const strengthColor =
    passedCount <= 2
      ? "bg-destructive"
      : passedCount <= 4
      ? "bg-yellow-500"
      : "bg-green-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Email validation (both modes)
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({
        title: "Invalid Email",
        description: emailResult.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    // Strong password validation on signup only
    if (!isLogin) {
      const pwResult = passwordSchema.safeParse(password);
      if (!pwResult.success) {
        toast({
          title: "Weak Password",
          description: pwResult.error.issues[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      // Friendlier message for HIBP / leaked password rejections
      const msg = error.message || "";
      const description = /pwned|leaked|compromised|breach/i.test(msg)
        ? "This password has appeared in a known data breach. Please choose a different one."
        : msg;
      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description,
        variant: "destructive",
      });
    } else if (!isLogin) {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account before signing in.",
      });
    }

    setLoading(false);
  };

  const intentMessage =
    intent === "supplier"
      ? "Create your free account to submit your PO funding application and connect with funders."
      : intent === "funder"
      ? "Create your free account to register as a funder and start receiving PO funding opportunities."
      : null;

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logo} alt="MyPO logo" className="h-32 w-auto brightness-0 invert" width={256} height={256} />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-primary-foreground/60">
            {isLogin ? "Sign in to manage your PO funding" : "Join MyPO to get started"}
          </p>
        </div>

        {intentMessage && (
          <div className="mb-6 rounded-xl bg-accent/15 border border-accent/30 p-4 text-center text-sm text-primary-foreground">
            {intentMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-elevated space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-10"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {isLogin && (
                <Link
                  to="/forgot-password"
                  className="text-xs text-accent font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10"
                minLength={isLogin ? undefined : 8}
                maxLength={72}
                autoComplete={isLogin ? "current-password" : "new-password"}
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

            {/* Strength meter + checklist (signup only) */}
            {!isLogin && password.length > 0 && (
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

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Please wait..." : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-accent font-medium hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
