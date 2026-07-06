import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Users } from "lucide-react";

interface HeroProps {
  onApply?: () => void;
}

const Hero = ({ onApply }: HeroProps) => {
  const scrollToApply = () => {
    if (onApply) {
      onApply();
      return;
    }
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero-gradient min-h-screen flex items-center pt-16">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Fast & Reliable PO Funding</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Turn Your Purchase Orders Into
            <span className="block mt-2 bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
              Working Capital
            </span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Connect with verified funders ready to finance your purchase orders. 
            Submit once, reach multiple funders instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" onClick={scrollToApply}>
              Apply for Funding
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
              Learn How It Works
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-3 justify-center text-primary-foreground/80">
              <Shield className="w-5 h-5 text-accent" />
              <span>Verified Funders Only</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-primary-foreground/80">
              <Zap className="w-5 h-5 text-accent" />
              <span>24-48 Hour Response</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-primary-foreground/80">
              <Users className="w-5 h-5 text-accent" />
              <span>Multiple Funding Options</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
