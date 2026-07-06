import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Mail, TrendingUp, Shield, Globe, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const INDUSTRY_OPTIONS = [
  "Manufacturing",
  "Technology",
  "Healthcare",
  "Agriculture",
  "Retail",
  "Logistics",
  "Construction",
  "Mining",
  "Energy",
  "Food & Beverage",
  "Textiles",
  "Automotive",
  "Education",
  "Other",
];

const FunderRegistration = () => {
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    companyWebsite: "",
    yearsInBusiness: "",
    fundingCapacity: "",
    minPoAmount: "",
    maxPoAmount: "",
    fundingDescription: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Please log in", description: "You need to be signed in to register as a funder.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from("registered_funders")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        await supabase
          .from("user_roles")
          .upsert({ user_id: user.id, role: "funder" as const }, { onConflict: "user_id,role" });

        await supabase
          .from("profiles")
          .update({
            company_name: formData.companyName || null,
            contact_name: formData.contactName || null,
            email: formData.email || null,
            phone: formData.phone || null,
          })
          .eq("id", user.id);

        await refreshProfile();
        toast({
          title: "Already Registered",
          description: "You are already registered as a funder. Redirecting to your dashboard.",
        });
        navigate("/dashboard");
        return;
      }

      const insertData: any = {
        user_id: user.id,
        company_name: formData.companyName,
        contact_name: formData.contactName,
        email: formData.email,
        phone: formData.phone || null,
        funding_capacity: formData.fundingCapacity || null,
        industries: selectedIndustries.length > 0 ? selectedIndustries : null,
        min_po_amount: formData.minPoAmount ? parseFloat(formData.minPoAmount) : null,
        max_po_amount: formData.maxPoAmount ? parseFloat(formData.maxPoAmount) : null,
        company_website: formData.companyWebsite || null,
        years_in_business: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness, 10) : null,
        funding_description: formData.fundingDescription || null,
      };

      const { error: funderErr } = await supabase
        .from("registered_funders")
        .insert(insertData);

      if (funderErr) throw funderErr;

      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "funder" as const }, { onConflict: "user_id,role" });

      if (roleErr) throw roleErr;

      await supabase
        .from("profiles")
        .update({
          company_name: formData.companyName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone || null,
        })
        .eq("id", user.id);

      await refreshProfile();

      toast({
        title: "Registration Complete!",
        description: "Welcome to our funder network. You can now browse funding opportunities.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: "Failed to register. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="funders" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Benefits */}
          <div className="lg:sticky lg:top-24">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Join Our Funder Network
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get access to pre-qualified PO funding opportunities delivered directly to your inbox.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Instant Deal Flow</h3>
                  <p className="text-muted-foreground">Receive new funding opportunities via email the moment they're submitted.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Vetted Opportunities</h3>
                  <p className="text-muted-foreground">All submissions are reviewed for completeness before being broadcast.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Grow Your Portfolio</h3>
                  <p className="text-muted-foreground">Access a steady stream of PO funding deals across multiple industries.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-card rounded-2xl p-8 shadow-elevated">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold text-foreground">Funder Registration</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Company Info Section */}
              <div className="space-y-1 pb-2 border-b border-border">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Company Information</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="funderCompanyName">Company Name *</Label>
                  <Input id="funderCompanyName" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Your funding company" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funderContactName">Contact Name *</Label>
                  <Input id="funderContactName" name="contactName" value={formData.contactName} onChange={handleChange} placeholder="Full name" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="funderEmail">Email Address *</Label>
                  <Input id="funderEmail" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funderPhone">Phone Number *</Label>
                  <Input id="funderPhone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="(012) 345-6789" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite" className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Company Website
                  </Label>
                  <Input id="companyWebsite" name="companyWebsite" type="url" value={formData.companyWebsite} onChange={handleChange} placeholder="https://www.example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsInBusiness">Years in Business</Label>
                  <Input id="yearsInBusiness" name="yearsInBusiness" type="number" min="0" value={formData.yearsInBusiness} onChange={handleChange} placeholder="e.g. 5" />
                </div>
              </div>

              {/* Funding Preferences Section */}
              <div className="space-y-1 pb-2 border-b border-border pt-2">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Funding Preferences</h4>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingCapacity">Total Funding Capacity (ZAR) *</Label>
                <Input id="fundingCapacity" name="fundingCapacity" value={formData.fundingCapacity} onChange={handleChange} placeholder="e.g. R5,000,000" required />
                <p className="text-xs text-muted-foreground">Total capital available for PO funding</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPoAmount">Minimum PO Amount (ZAR)</Label>
                  <Input id="minPoAmount" name="minPoAmount" type="number" min="0" value={formData.minPoAmount} onChange={handleChange} placeholder="e.g. 25000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPoAmount">Maximum PO Amount (ZAR)</Label>
                  <Input id="maxPoAmount" name="maxPoAmount" type="number" min="0" value={formData.maxPoAmount} onChange={handleChange} placeholder="e.g. 500000" />
                </div>
              </div>

              {/* Industries */}
              <div className="space-y-2">
                <Label>Preferred Industries</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((industry) => {
                    const isSelected = selectedIndustries.includes(industry);
                    return (
                      <Badge
                        key={industry}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-colors select-none ${
                          isSelected ? "" : "hover:bg-accent/10"
                        }`}
                        onClick={() => toggleIndustry(industry)}
                      >
                        {industry}
                        {isSelected && <X className="w-3 h-3 ml-1" />}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Click to select / deselect industries</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingDescription">Funding Preferences / Criteria</Label>
                <Textarea
                  id="fundingDescription"
                  name="fundingDescription"
                  value={formData.fundingDescription}
                  onChange={handleChange}
                  placeholder="Describe any specific requirements, preferred deal structures, or criteria you look for in PO funding opportunities..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Join Funder Network"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Registration is free. No obligation to fund any deals.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FunderRegistration;
