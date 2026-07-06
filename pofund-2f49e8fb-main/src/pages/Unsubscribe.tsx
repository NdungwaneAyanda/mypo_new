import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import logo from "@/assets/mypo-logo.png";

type Status = "validating" | "valid" | "already" | "invalid" | "confirming" | "success" | "error";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const fnUrl = `${supabaseUrl}/functions/v1/handle-email-unsubscribe`;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("validating");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("This unsubscribe link is missing its token.");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${fnUrl}?token=${encodeURIComponent(token)}`, {
          headers: { apikey: supabaseAnonKey },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus("invalid");
          setMessage(body?.error ?? "This link is invalid or has expired.");
          return;
        }
        if (body?.valid === false && body?.reason === "already_unsubscribed") {
          setStatus("already");
          return;
        }
        setStatus("valid");
      } catch (err) {
        setStatus("invalid");
        setMessage("We couldn't validate this link. Please try again later.");
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("confirming");
    try {
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (body?.success === false && body?.reason === "already_unsubscribed") {
        setStatus("already");
        return;
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <img
              src={logo}
              alt="MyPO logo"
              className="h-32 w-auto brightness-0 invert"
              width={256}
              height={256}
            />
          </Link>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Email preferences
          </h1>
          <p className="text-primary-foreground/60">
            Manage what MyPO sends to your inbox
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-elevated text-center space-y-5">
          {status === "validating" && (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Verifying your link...</p>
            </>
          )}

          {status === "valid" && (
            <>
              <h2 className="text-xl font-semibold">Unsubscribe from MyPO emails?</h2>
              <p className="text-sm text-muted-foreground">
                You'll stop receiving notifications about new PO funding
                opportunities and application updates. You can re-enable them
                later from your dashboard.
              </p>
              <Button onClick={handleConfirm} size="lg" className="w-full">
                Confirm unsubscribe
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">Keep me subscribed</Link>
              </Button>
            </>
          )}

          {status === "confirming" && (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Processing your request...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
              <h2 className="text-xl font-semibold">You've been unsubscribed</h2>
              <p className="text-sm text-muted-foreground">
                We've removed your email from our notifications list. You can
                still sign in to {" "}
                <Link to="/dashboard" className="text-accent hover:underline">
                  your dashboard
                </Link>{" "}
                at any time.
              </p>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-accent" />
              <h2 className="text-xl font-semibold">Already unsubscribed</h2>
              <p className="text-sm text-muted-foreground">
                This email address is already removed from our notifications list.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Back to MyPO</Link>
              </Button>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <h2 className="text-xl font-semibold">Link couldn't be used</h2>
              <p className="text-sm text-muted-foreground">
                {message || "This unsubscribe link is invalid or has expired."}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/contact">Contact support</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;
