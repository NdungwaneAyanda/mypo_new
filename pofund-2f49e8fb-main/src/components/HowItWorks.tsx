import { FileText, Send, Handshake, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Submit Your Details",
    description: "Fill out our simple form with your purchase order information and business details.",
  },
  {
    icon: Send,
    title: "Instant Broadcast",
    description: "Your request is immediately sent to all verified funders in our network.",
  },
  {
    icon: Handshake,
    title: "Receive Offers",
    description: "Funders review your request and send you competitive funding offers.",
  },
  {
    icon: CheckCircle,
    title: "Get Funded",
    description: "Choose the best offer and receive your funds to fulfill your orders.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get from application to funding in just a few simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative bg-card rounded-2xl p-6 shadow-soft hover:shadow-elevated transition-all duration-300 group"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full accent-gradient flex items-center justify-center text-accent-foreground font-bold text-sm shadow-accent">
                {index + 1}
              </div>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <step.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
