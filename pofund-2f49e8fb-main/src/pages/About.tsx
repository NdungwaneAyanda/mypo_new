import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Target, Users, Shield, Building2 } from "lucide-react";
import { COMPANY } from "@/lib/company";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why MyPO Exists
            </h1>
            <p className="text-lg text-muted-foreground">
              Helping South African suppliers turn purchase orders into cash.
            </p>
          </div>

          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">The problem we're solving</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Every day, South African SMEs win purchase orders from large corporates and government — and then watch
                those opportunities slip away because they can't fund the stock, materials, or labour to deliver.
              </p>
              <p>
                Traditional banks are slow. Their PO finance products are buried under paperwork, collateral demands,
                and weeks of waiting. A confirmed PO from a blue-chip buyer should be a green light, not a barrier.
              </p>
              <p>
                Meanwhile, private funders across South Africa actively want short-term, asset-backed deals like PO
                finance — but they have no easy way to find vetted suppliers with real, executable orders in hand.
              </p>
              <p className="text-foreground font-medium">
                MyPO is the marketplace that connects them directly. Suppliers apply in minutes. Funders see qualified
                opportunities. Deals get done.
              </p>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Our Mission</h3>
              <p className="text-sm text-muted-foreground">
                Unlock the working capital trapped inside every confirmed purchase order in South Africa.
              </p>
            </Card>
            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Who We Serve</h3>
              <p className="text-sm text-muted-foreground">
                SA suppliers with confirmed POs, and the private funders who back them.
              </p>
            </Card>
            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Our Promise</h3>
              <p className="text-sm text-muted-foreground">
                Direct, transparent connections. No middlemen, no hidden fees, no gatekeepers.
              </p>
            </Card>
          </div>

          <Card className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Company Information</h2>
                <p className="text-muted-foreground mb-4">
                  MyPO is operated by <span className="font-medium text-foreground">{COMPANY.legalName}</span>, a private
                  company registered in {COMPANY.jurisdiction}.
                </p>
                <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Registered name</dt>
                    <dd className="text-foreground font-medium">{COMPANY.legalName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Jurisdiction</dt>
                    <dd className="text-foreground font-medium">{COMPANY.jurisdiction}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Website</dt>
                    <dd className="text-foreground font-medium">www.{COMPANY.domain}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
