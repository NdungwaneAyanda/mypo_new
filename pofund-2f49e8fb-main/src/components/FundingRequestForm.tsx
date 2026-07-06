import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Building2, FileText, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DocumentUpload, { DocumentFile, REQUIRED_DOCUMENTS, validateFile } from "./DocumentUpload";

const FundingRequestForm = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const applicationIdRef = useRef<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    poAmount: "",
    costOfDelivery: "",
    amountNeeded: "",
    customerName: "",
    industry: "",
    paymentTerms: "",
    description: "",
  });

  const [documents, setDocuments] = useState<DocumentFile[]>(
    REQUIRED_DOCUMENTS.map((d) => ({ ...d, file: null, status: "idle", progress: 0 }))
  );

  // Pre-fill from profile and supplier data
  useEffect(() => {
    if (!user) return;

    const prefill = async () => {
      // Start with profile data
      const updates: Partial<typeof formData> = {};
      if (profile?.company_name) updates.companyName = profile.company_name;
      if (profile?.contact_name) updates.contactName = profile.contact_name;
      if (profile?.email) updates.email = profile.email;
      if (profile?.phone) updates.phone = profile.phone;

      // Override with supplier data if exists
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (supplier) {
        if (supplier.company_name) updates.companyName = supplier.company_name;
        if (supplier.contact_name) updates.contactName = supplier.contact_name;
        if (supplier.email) updates.email = supplier.email;
        if (supplier.phone) updates.phone = supplier.phone;
        if (supplier.industry) updates.industry = supplier.industry;
      }

      // Fill email from auth if still empty
      if (!updates.email && user.email) updates.email = user.email;

      setFormData((prev) => ({ ...prev, ...updates }));
    };

    prefill();
  }, [user, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const allDocsAttached = documents.every((d) => d.file !== null);
  const hasFailedUploads = documents.some((d) => d.status === "error");

  // Update a single document's upload state by type (uses functional setState
  // so concurrent updates from parallel uploads don't clobber each other)
  const updateDocState = (docType: string, patch: Partial<DocumentFile>) => {
    setDocuments((prev) =>
      prev.map((d) => (d.type === docType ? { ...d, ...patch } : d))
    );
  };

  // Animate progress bar with a fake ramp while the upload promise is pending.
  // Supabase JS doesn't currently expose true upload progress for the storage
  // SDK, so this gives the user feedback that something is happening.
  const uploadOneDocument = async (
    doc: DocumentFile,
    applicationId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!doc.file) return { ok: false, error: "No file selected" };

    // Defense-in-depth client check (the bucket policy is the real guard).
    const validationError = validateFile(doc.file);
    if (validationError) {
      updateDocState(doc.type, { status: "error", progress: 0, errorMessage: validationError });
      return { ok: false, error: validationError };
    }

    updateDocState(doc.type, { status: "uploading", progress: 10, errorMessage: undefined });

    // Simulated progress ramp — caps at 90% until the real promise resolves.
    let progress = 10;
    const ticker = setInterval(() => {
      progress = Math.min(90, progress + 8);
      updateDocState(doc.type, { progress });
    }, 250);

    try {
      // Path MUST be `applications/{applicationId}/...` — storage RLS casts the
      // 2nd path segment to UUID to verify ownership. Adding a company slug
      // segment breaks that cast and triggers an "invalid uuid" error.
      const safeName = doc.file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const filePath = `applications/${applicationId}/${doc.type}/${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("funding-documents")
        .upload(filePath, doc.file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: docError } = await supabase
        .from("application_documents")
        .insert({
          application_id: applicationId,
          document_type: doc.type,
          file_path: filePath,
          file_name: doc.file.name,
          file_size: doc.file.size,
        });

      if (docError) throw docError;

      clearInterval(ticker);
      updateDocState(doc.type, { status: "uploaded", progress: 100, errorMessage: undefined });
      return { ok: true };
    } catch (err: any) {
      clearInterval(ticker);
      const message = err?.message || "Upload failed";
      updateDocState(doc.type, { status: "error", progress: 0, errorMessage: message });
      return { ok: false, error: message };
    }
  };

  // Retry a single failed document without re-creating the application
  const handleRetryDocument = async (docType: string) => {
    const appId = applicationIdRef.current;
    const doc = documents.find((d) => d.type === docType);
    if (!appId || !doc) return;
    await uploadOneDocument(doc, appId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Please log in", description: "You need to be signed in to submit an application.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!allDocsAttached) {
      const missing = documents.filter((d) => !d.file);
      toast({
        title: "Missing Documents",
        description: `Please upload: ${missing.map((d) => d.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the application once (reused across retries).
      // We generate the id client-side so we don't depend on a SELECT policy
      // matching at insert time — RETURNING via .select() can otherwise surface
      // as a misleading "row-level security policy" error when the form email
      // differs from the user's profile email.
      let applicationId = applicationIdRef.current;
      if (!applicationId) {
        const newId = crypto.randomUUID();
        const { error: appError } = await supabase
          .from("funding_applications")
          .insert({
            id: newId,
            company_name: formData.companyName,
            contact_name: formData.contactName,
            email: formData.email,
            phone: formData.phone || null,
            industry: formData.industry,
            po_amount: parseFloat(formData.poAmount),
            cost_of_delivery: formData.costOfDelivery ? parseFloat(formData.costOfDelivery) : null,
            amount_needed: formData.amountNeeded ? parseFloat(formData.amountNeeded) : null,
            customer_name: formData.customerName,
            payment_terms: formData.paymentTerms,
            description: formData.description || null,
          } as any);

        if (appError) throw appError;
        applicationId = newId;
        applicationIdRef.current = applicationId;
      }

      // 2. Upload all docs in parallel (skip already-uploaded on retry)
      const pending = documents.filter((d) => d.file && d.status !== "uploaded");
      const results = await Promise.all(
        pending.map((doc) => uploadOneDocument(doc, applicationId!))
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast({
          title: `${failed.length} document${failed.length > 1 ? "s" : ""} failed to upload`,
          description: "Click the retry icon next to each failed document to try again.",
          variant: "destructive",
        });
        return;
      }

      // 3. Update profile (best-effort)
      await supabase
        .from("profiles")
        .update({
          company_name: formData.companyName,
          contact_name: formData.contactName,
          phone: formData.phone || null,
        })
        .eq("id", user.id);

      toast({
        title: "Application Submitted!",
        description: "Your PO funding request has been submitted. You'll hear back within 24-48 hours.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="apply" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Apply for PO Funding
            </h2>
            <p className="text-lg text-muted-foreground">
              Complete the form below and get connected with funders ready to finance your purchase orders
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-elevated">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Information */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Company Information</h3>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Your company name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={formData.industry} onValueChange={(v) => handleSelectChange("industry", v)}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="wholesale">Wholesale & Distribution</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} placeholder="Full name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="(012) 345-6789" />
              </div>

              {/* PO Details */}
              <div className="md:col-span-2 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Purchase Order Details</h3>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poAmount">PO Amount (ZAR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">R</span>
                  <Input id="poAmount" name="poAmount" type="number" value={formData.poAmount} onChange={handleChange} placeholder="50,000" className="pl-8" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costOfDelivery">Cost of Delivery (ZAR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">R</span>
                  <Input id="costOfDelivery" name="costOfDelivery" type="number" value={formData.costOfDelivery} onChange={handleChange} placeholder="10,000" className="pl-8" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountNeeded">Amount Needed from Funder (ZAR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">R</span>
                  <Input id="amountNeeded" name="amountNeeded" type="number" value={formData.amountNeeded} onChange={handleChange} placeholder="40,000" className="pl-8" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Who issued the PO" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms *</Label>
                <Select value={formData.paymentTerms} onValueChange={(v) => handleSelectChange("paymentTerms", v)}>
                  <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30 days">30 Days</SelectItem>
                    <SelectItem value="45 days">45 Days</SelectItem>
                    <SelectItem value="60 days">60 Days</SelectItem>
                    <SelectItem value="90 days">90 Days</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Additional Details</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Tell us more about this purchase order, your business history, or any relevant information..." rows={4} />
              </div>

              {/* Document Upload Section */}
              <div className="md:col-span-2 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Required Documents</h3>
                </div>
                <DocumentUpload
                  documents={documents}
                  onDocumentsChange={setDocuments}
                  disabled={isSubmitting}
                  onValidationError={(message) =>
                    toast({ title: "File rejected", description: message, variant: "destructive" })
                  }
                  onRetry={handleRetryDocument}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button type="submit" variant="hero" size="lg" disabled={isSubmitting || !allDocsAttached}>
                {isSubmitting
                  ? "Uploading documents..."
                  : hasFailedUploads
                  ? (<>Retry Submission<Send className="w-4 h-4" /></>)
                  : (<>Submit Application<Send className="w-4 h-4" /></>)}
              </Button>
            </div>

            {!allDocsAttached && (
              <p className="text-center text-sm text-destructive mt-2">
                Please attach all required documents before submitting.
              </p>
            )}

            <p className="text-center text-sm text-muted-foreground mt-4">
              By submitting, you agree to our terms and authorize us to share your information with our funder network.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default FundingRequestForm;
