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

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: {COMPANY.lastUpdated}</p>
          </div>

          <Card className="p-6 mb-6 border-accent/30 bg-accent/5">
            <p className="text-sm text-foreground">
              <strong>Draft notice:</strong> These Terms of Service are a working draft for the MyPO marketplace and
              are under final legal review. They do not constitute legal advice.
            </p>
          </Card>

          <Card className="p-8">
            <Section title="1. About these terms">
              <p>
                These Terms of Service ("Terms") govern your use of the MyPO platform at {COMPANY.domain}, operated by{" "}
                {COMPANY.legalName}. By creating an account or using the platform you agree to these Terms.
              </p>
            </Section>

            <Section title="2. What MyPO is">
              <p>
                MyPO is an online marketplace that connects South African suppliers who hold confirmed purchase orders
                with funders who may be interested in financing them. MyPO is <strong>not a lender</strong>, broker, or
                financial advisor. We do not provide credit, guarantee any deal, or participate in funding agreements
                between users.
              </p>
            </Section>

            <Section title="3. Accounts">
              <ul className="list-disc pl-6 space-y-1">
                <li>You must be 18 or older and authorised to act on behalf of any business you register.</li>
                <li>You are responsible for keeping your login credentials confidential.</li>
                <li>The information you provide must be accurate, current, and complete.</li>
                <li>We may suspend or terminate accounts that breach these Terms.</li>
              </ul>
            </Section>

            <Section title="4. Suppliers">
              <p>
                Suppliers represent that any purchase order submitted is genuine, valid, and held by them. Supporting
                documents must be authentic. Suppliers are solely responsible for delivering on POs they fund through
                the platform.
              </p>
            </Section>

            <Section title="5. Funders">
              <p>
                Funders are responsible for their own due diligence on any opportunity. MyPO does not vet, rate, or
                endorse opportunities or suppliers. Any funding agreement is concluded directly between the funder and
                the supplier, on terms they negotiate themselves.
              </p>
            </Section>

            <Section title="6. No financial advice">
              <p>
                Nothing on MyPO is financial, legal, or tax advice. You should consult qualified professionals before
                entering into any funding arrangement.
              </p>
            </Section>

            <Section title="7. Fees">
              <p>
                Use of the MyPO platform is currently free for both suppliers and funders. We will provide written
                notice before introducing any platform fees.
              </p>
            </Section>

            <Section title="8. Acceptable use">
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Submit false, misleading, or fraudulent information or documents.</li>
                <li>Use the platform for any unlawful purpose or to harass other users.</li>
                <li>Attempt to access data, accounts, or systems you are not authorised to access.</li>
                <li>Scrape, copy, or redistribute platform content without permission.</li>
              </ul>
            </Section>

            <Section title="9. Limitation of liability">
              <p>
                To the maximum extent permitted by law, MyPO and its operators are not liable for any loss arising from
                your use of the platform, including any funding agreements, business losses, or third-party conduct.
                The platform is provided "as is" without warranties of any kind.
              </p>
            </Section>

            <Section title="10. Intellectual property">
              <p>
                The MyPO name, logo, and platform are owned by {COMPANY.legalName}. You retain ownership of the content
                and documents you upload, and grant us a limited licence to host and display them as needed to operate
                the platform.
              </p>
            </Section>

            <Section title="11. Termination">
              <p>
                You may close your account at any time. We may suspend or terminate access for breach of these Terms.
                Provisions that by their nature should survive termination (such as liability and IP) will continue to
                apply.
              </p>
            </Section>

            <Section title="12. Governing law">
              <p>
                These Terms are governed by the laws of {COMPANY.jurisdiction}. Disputes are subject to the exclusive
                jurisdiction of South African courts.
              </p>
            </Section>

            <Section title="13. Changes to these terms">
              <p>
                We may update these Terms from time to time. Continued use of the platform after changes are posted
                constitutes acceptance of the updated Terms.
              </p>
            </Section>

            <Section title="14. Contact">
              <p>
                Questions about these Terms? Email{" "}
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

export default Terms;
