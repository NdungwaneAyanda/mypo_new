import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Card } from "@/components/ui/card";
import { Mail, MapPin } from "lucide-react";
import { COMPANY } from "@/lib/company";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              We'd love to hear from you. Get in touch with the MyPO team.
            </p>
          </div>

          <div className="mb-8">
            <ContactForm />
          </div>

          <div className="mb-8">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Email</h3>
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-accent hover:underline break-all"
              >
                {COMPANY.email}
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                We aim to respond within one business day.
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Office</h3>
                <p className="text-muted-foreground">
                  {COMPANY.legalName}
                  <br />
                  {COMPANY.address.line1}
                  <br />
                  {COMPANY.address.line2}
                  <br />
                  {COMPANY.address.city}, {COMPANY.address.postalCode}
                  <br />
                  {COMPANY.jurisdiction}
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
