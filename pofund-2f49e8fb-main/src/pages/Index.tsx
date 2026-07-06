import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, FileText, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const goApply = () => {
    if (user) {
      navigate("/apply");
    } else {
      navigate("/auth?redirect=/apply&intent=supplier");
    }
  };

  const goFunder = () => {
    if (user) {
      if (profile?.role === "funder") {
        navigate("/dashboard");
      } else {
        navigate("/register-funder");
      }
    } else {
      navigate("/auth?redirect=/register-funder&intent=funder");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero onApply={goApply} />
      <HowItWorks />

      {/* Supplier CTA */}
      <section id="apply" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-card rounded-2xl p-10 shadow-elevated border border-border">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-accent/10 items-center justify-center mb-5">
              <FileText className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Apply for PO Funding
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Create your free account to submit your PO funding application and connect with verified funders.
            </p>
            <Button size="xl" onClick={goApply}>
              {user ? "Start Application" : "Sign Up to Apply"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Funder CTA */}
      <section id="funders" className="py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-card rounded-2xl p-10 shadow-elevated border border-border">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-accent/10 items-center justify-center mb-5">
              <Briefcase className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Join Our Funder Network
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get pre-qualified PO funding opportunities delivered straight to your inbox. Sign up to register as a funder.
            </p>
            <Button size="xl" onClick={goFunder}>
              {user ? (profile?.role === "funder" ? "Browse Opportunities" : "Register as Funder") : "Sign Up as Funder"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
