import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/mypo-logo.png";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isSupplier = profile?.role === "supplier";
  const isFunder = profile?.role === "funder";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-28 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="MyPO home">
          <img src={logo} alt="MyPO logo" className="h-40 w-auto -my-6" width={256} height={256} />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </button>
          {(!user || isSupplier) && (
            <button
              onClick={() => {
                if (user) navigate("/apply");
                else navigate("/auth?redirect=/apply&intent=supplier");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Apply for Funding
            </button>
          )}
          {(!user || isFunder) && (
            <button
              onClick={() => {
                if (user) navigate("/dashboard");
                else navigate("/auth?redirect=/register-funder&intent=funder");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isFunder ? "Browse Opportunities" : "For Funders"}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                {isSupplier ? "My Applications" : isFunder ? "My Opportunities" : "Dashboard"}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")}>Get Started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
