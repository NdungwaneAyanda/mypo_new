import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { COMPANY } from "@/lib/company";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold text-foreground mb-3">{title}</h2>
    <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {COMPANY.lastUpdated}</p>
          </div>

          <Card className="p-6 mb-6 border-accent/30 bg-accent/5">
            <p className="text-sm text-foreground">
              <strong>Draft notice:</strong> This Privacy Policy is a working draft aligned with the Protection of
              Personal Information Act (POPIA). It is provided for transparency while under final legal review and
              should not be relied upon as legal advice.
            </p>
          </Card>

          <Card className="p-8">
            <Section title="1. Who we are">
              <p>
                MyPO is operated by {COMPANY.legalName}, a private company registered in {COMPANY.jurisdiction} ("we",
                "us", "our"). We are the responsible party for the personal information processed through{" "}
                {COMPANY.domain}.
              </p>
            </Section>

            <Section title="2. Information we collect">
              <p>We collect personal information you provide directly when you use MyPO, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Account details: name, email address, role (supplier or funder).</li>
                <li>Business details: company name, industry, location.</li>
                <li>Application data: purchase order details, financial figures, supporting documents.</li>
                <li>Funder profile: investment range, sectors of interest, contact preferences.</li>
                <li>Communications: messages exchanged through the platform's chat feature.</li>
                <li>Technical data: IP address, browser type, and usage logs.</li>
              </ul>
            </Section>

            <Section title="3. How we use your information">
              <ul className="list-disc pl-6 space-y-1">
                <li>To create and manage your account and verify your identity.</li>
                <li>To match suppliers with relevant funders and notify funders of new opportunities.</li>
                <li>To enable communication between suppliers and funders for accepted opportunities.</li>
                <li>To send transactional emails (confirmations, password resets, notifications).</li>
                <li>To improve, secure, and operate the platform.</li>
                <li>To comply with legal and regulatory obligations.</li>
              </ul>
            </Section>

            <Section title="4. Lawful basis (POPIA)">
              <p>
                We process personal information on the bases of: your consent, performance of a contract, our legitimate
                interests in operating the marketplace, and compliance with the law.
              </p>
            </Section>

            <Section title="5. Sharing of information">
              <p>
                Supplier identifying details and uploaded documents are shared with funders only where access has been
                expressly granted (for example, when a funder accepts an opportunity). We do not sell your personal
                information. We use trusted processors (cloud hosting, email delivery) under appropriate data-processing
                terms.
              </p>
            </Section>

            <Section title="6. Data security">
              <p>
                We use encrypted storage, role-based access controls, and database-level security policies to protect
                your information. Despite reasonable safeguards, no system is fully immune to risk.
              </p>
            </Section>

            <Section title="7. Retention">
              <p>
                We retain personal information for as long as your account is active and for a reasonable period
                thereafter to meet legal, accounting, or reporting requirements.
              </p>
            </Section>

            <Section title="8. Your rights">
              <p>
                Under POPIA you have the right to access, correct, or delete your personal information, object to
                processing, and lodge a complaint with the Information Regulator of South Africa.
              </p>
            </Section>

            <Section title="9. Cookies">
              <p>
                We use essential cookies and local storage to keep you signed in and remember your preferences. We do
                not use advertising trackers.
              </p>
            </Section>

            <Section title="10. Contact us">
              <p>
                For privacy questions or to exercise your rights, contact us at{" "}
                <a href={`mailto:${COMPANY.email}`} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
                .
              </p>
            </Section>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
