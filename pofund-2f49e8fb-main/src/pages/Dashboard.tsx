import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, FileText, Briefcase, Clock, CheckCircle, XCircle,
  Plus, Eye, Download, ChevronDown, ChevronUp, ClipboardCheck,
  MessageCircle
} from "lucide-react";
import logo from "@/assets/mypo-logo.png";
import ApplicationChat from "@/components/dashboard/ApplicationChat";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusConfig: Record<string, { label: string; icon: any; classes: string }> = {
  pending: { label: "Pending", icon: Clock, classes: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  reviewed: { label: "Under Review", icon: Eye, classes: "bg-blue-100 text-blue-800 border-blue-200" },
  funded: { label: "Funded", icon: CheckCircle, classes: "bg-green-100 text-green-800 border-green-200" },
  successful: { label: "Successful", icon: CheckCircle, classes: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Declined", icon: XCircle, classes: "bg-red-100 text-red-800 border-red-200" },
  declined: { label: "Declined", icon: XCircle, classes: "bg-red-100 text-red-800 border-red-200" },
};

const docTypeLabels: Record<string, string> = {
  purchase_order: "Purchase Order",
  company_registration: "Company Registration",
  bank_confirmation: "Bank Confirmation",
  director_id: "Director ID",
  company_proof_address: "Company Proof of Address",
  director_proof_address: "Director Proof of Address",
};

const StatusBadge = ({ status, overrideLabel, overrideClasses }: { status: string; overrideLabel?: string; overrideClasses?: string }) => {
  const config = statusConfig[status] || { label: status, icon: Clock, classes: "bg-muted text-muted-foreground border-border" };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${overrideClasses || config.classes}`}>
      <Icon className="w-3.5 h-3.5" />
      {overrideLabel || config.label}
    </span>
  );
};

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [claimingApp, setClaimingApp] = useState<string | null>(null);
  const [takingOffer, setTakingOffer] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openChatAppId, setOpenChatAppId] = useState<string | null>(null);
  const [myFunderId, setMyFunderId] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const primaryRole = profile?.role || "supplier";
  const [viewMode, setViewMode] = useState<"supplier" | "funder">(primaryRole === "funder" ? "funder" : "supplier");
  const hasBothRoles = userRoles.includes("supplier") && userRoles.includes("funder");

  // Sync viewMode when profile or roles load
  useEffect(() => {
    if (profile?.role === "funder") setViewMode("funder");
    else setViewMode("supplier");
  }, [profile?.role]);

  const isSupplier = viewMode === "supplier";
  const isFunder = viewMode === "funder";

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // Fetch current user's funder ID and roles
  useEffect(() => {
    if (!user) return;
    supabase.from("registered_funders").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setMyFunderId(data?.id ?? null));
    supabase.from("user_roles").select("role").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setUserRoles(data.map((r: any) => r.role));
      });
  }, [user]);

  const PAGE_SIZE = 50;

  const fetchApplications = useCallback(async () => {
    if (!user || !profile) return;
    setLoadingApps(true);

    let query = supabase
      .from("funding_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1); // pagination guardrail

    if (viewMode === "supplier") {
      query = query.eq("email", profile.email || user.email);
    }
    if (viewMode === "funder") {
      query = query.or("status.eq.pending,status.eq.reviewed,status.eq.successful");
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching applications:", error);
    } else {
      setApplications(data || []);
    }
    setLoadingApps(false);
  }, [user, profile, viewMode]);

  useEffect(() => {
    if (user && profile) fetchApplications();
  }, [user, profile, fetchApplications]);

  // Realtime subscription — patch local state instead of full refetch
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("po-app-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "funding_applications" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as any;
          setApplications((prev) => {
            if (prev.some((a) => a.id === row.id)) return prev;
            return [row, ...prev].slice(0, PAGE_SIZE);
          });
          if (isFunder) {
            toast({
              title: "New PO Funding Opportunity Available",
              description: `R${Number(row.po_amount).toLocaleString()} — ${row.customer_name}`,
            });
          }
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as any;
          setApplications((prev) => prev.map((a) => (a.id === row.id ? { ...a, ...row } : a)));
        } else if (payload.eventType === "DELETE") {
          const row = payload.old as any;
          setApplications((prev) => prev.filter((a) => a.id !== row.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isFunder, toast]);


  const fetchDocuments = async (applicationId: string) => {
    if (documents[applicationId]) return;
    const { data, error } = await supabase
      .from("application_documents")
      .select("*")
      .eq("application_id", applicationId);
    if (!error && data) {
      setDocuments((prev) => ({ ...prev, [applicationId]: data }));
    }
  };

  const handleToggleExpand = (appId: string) => {
    if (expandedApp === appId) {
      setExpandedApp(null);
    } else {
      setExpandedApp(appId);
      fetchDocuments(appId);
    }
  };

  const handleDownloadDoc = async (filePath: string) => {
    setSigningUrl(filePath);
    const { data, error } = await supabase.storage
      .from("funding-documents")
      .createSignedUrl(filePath, 3600);
    setSigningUrl(null);
    if (error || !data?.signedUrl) {
      toast({ title: "Download Failed", description: error?.message || "Could not generate download link.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleClaimApplication = async (appId: string) => {
    if (!user) return;
    setClaimingApp(appId);
    try {
      const { data: funder, error: funderErr } = await supabase
        .from("registered_funders").select("id").eq("user_id", user.id).single();
      if (funderErr || !funder) {
        toast({ title: "Not Registered", description: "Please register as a funder first.", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from("funding_applications")
        .update({ status: "reviewed", assigned_funder_id: funder.id })
        .eq("id", appId)
        .eq("status", "pending");
      if (error) throw error;
      toast({ title: "Application Claimed", description: "You are now reviewing this application." });
    } catch (error: any) {
      toast({ title: "Claim Failed", description: error.message || "Could not claim application.", variant: "destructive" });
    } finally {
      setClaimingApp(null);
    }
  };

  const handleTakeOffer = async (appId: string) => {
    if (!user) return;
    setTakingOffer(appId);
    try {
      const { data: funder, error: funderErr } = await supabase
        .from("registered_funders").select("id").eq("user_id", user.id).single();
      if (funderErr || !funder) {
        toast({ title: "Not Registered", description: "Please register as a funder first.", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from("funding_applications")
        .update({ status: "successful", assigned_funder_id: funder.id })
        .eq("id", appId);
      if (error) throw error;
      toast({ title: "Offer Taken!", description: "Application marked successful and assigned to you." });
    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Could not take offer.", variant: "destructive" });
    } finally {
      setTakingOffer(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Filter applications for supplier status filter
  const filteredApplications = isSupplier && statusFilter !== "all"
    ? applications.filter((app) => app.status === statusFilter)
    : applications;

  // Status counts for supplier filter tabs
  const statusCounts = isSupplier
    ? applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center" aria-label="MyPO home">
            <img src={logo} alt="MyPO logo" className="h-24 w-auto -my-4" width={256} height={256} />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.email} ({profile?.role})
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Mode Switcher — only show if user has both roles */}
        {hasBothRoles && (
          <div className="mb-6">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "supplier" | "funder")}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="supplier">Supplier Mode</TabsTrigger>
                <TabsTrigger value="funder">Funder Mode</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            {isSupplier ? "Supplier Dashboard" : "Funder Dashboard"}
            <Badge variant="outline" className="text-xs font-normal">
              Primary: {profile?.role === "funder" ? "Funder" : "Supplier"}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            {isSupplier
              ? "Track all your PO funding applications"
              : "Browse and fund pending opportunities"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {isSupplier && (
            <Button onClick={() => navigate("/apply")}>
              <Plus className="w-4 h-4 mr-1" /> New Application
            </Button>
          )}
        </div>

        {/* Supplier status filter tabs */}
        {isSupplier && applications.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All ({applications.length})
            </button>
            {Object.entries(statusConfig).map(([key, config]) => {
              const count = statusCounts[key] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Applications List */}
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-2">
            {isSupplier ? <FileText className="w-5 h-5 text-accent" /> : <Briefcase className="w-5 h-5 text-accent" />}
            <h2 className="text-lg font-semibold text-foreground">
              {isSupplier ? "Your Applications" : "Pending Opportunities"}
            </h2>
          </div>

          {loadingApps ? (
            <div className="p-8 text-center text-muted-foreground">Loading applications...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {isSupplier
                  ? statusFilter !== "all"
                    ? `No ${statusConfig[statusFilter]?.label.toLowerCase() || statusFilter} applications.`
                    : "You haven't submitted any applications yet."
                  : "No pending opportunities at the moment."}
              </p>
              {isSupplier && statusFilter === "all" && (
                <Button onClick={() => navigate("/apply")}>Submit Your First Application</Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredApplications.map((app) => {
                const isExpanded = expandedApp === app.id;
                const appDocs = documents[app.id] || [];

                // Determine expandability
                const isTakenByOther = isFunder && app.assigned_funder_id && app.assigned_funder_id !== myFunderId;
                // Suppliers can only expand successful applications
                const supplierCanExpand = isSupplier && app.status === "successful";
                const funderCanExpand = isFunder && !isTakenByOther;
                const canExpand = supplierCanExpand || funderCanExpand;

                return (
                  <div key={app.id}>
                    <div
                      onClick={() => canExpand && handleToggleExpand(app.id)}
                      className={`w-full p-6 transition-colors text-left ${canExpand ? "cursor-pointer hover:bg-muted/30" : "cursor-default"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            R{Number(app.po_amount).toLocaleString()} — {app.customer_name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {app.company_name} • {app.industry} • {app.payment_terms || "N/A"} • {new Date(app.created_at).toLocaleDateString()}
                          </p>
                          {/* Show supplier summary for funders on pending/own apps only */}
                          {isFunder && !isTakenByOther && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Contact: {app.contact_name} • Amount Needed: {app.amount_needed != null ? `R${Number(app.amount_needed).toLocaleString()}` : "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Chat button - only for the assigned funder or the supplier */}
                          {app.status === "successful" && (!isFunder || app.assigned_funder_id === myFunderId) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const isClosing = openChatAppId === app.id;
                                setOpenChatAppId(isClosing ? null : app.id);
                                if (!isClosing) {
                                  setExpandedApp(app.id);
                                  fetchDocuments(app.id);
                                }
                              }}
                              className="gap-1"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Chat
                            </Button>
                          )}
                          {isFunder && app.status === "successful" && app.assigned_funder_id === myFunderId ? (
                            <StatusBadge status="successful" overrideLabel="Funded by Me" overrideClasses="bg-green-100 text-green-800 border-green-200" />
                          ) : isFunder && app.status === "successful" && app.assigned_funder_id !== myFunderId ? (
                            <StatusBadge status="successful" overrideLabel="Taken" overrideClasses="bg-gray-100 text-gray-600 border-gray-200" />
                          ) : isFunder && app.status === "reviewed" && app.assigned_funder_id && app.assigned_funder_id !== myFunderId ? (
                            <StatusBadge status="reviewed" overrideLabel="Taken" overrideClasses="bg-gray-100 text-gray-600 border-gray-200" />
                          ) : (
                            <StatusBadge status={app.status} />
                          )}
                          {canExpand && (
                            isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && canExpand && (
                      <div className="px-6 pb-6 border-t border-border/50 bg-muted/20">
                        {/* Chat prominent for supplier on successful apps */}
                        {isSupplier && app.status === "successful" && (
                          <div className="mt-4 mb-4">
                            {openChatAppId === app.id ? (
                              <ApplicationChat
                                applicationId={app.id}
                                appEmail={app.email}
                                assignedFunderId={app.assigned_funder_id}
                                onClose={() => setOpenChatAppId(null)}
                              />
                            ) : (
                              <Button
                                variant="hero"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenChatAppId(app.id);
                                }}
                                className="gap-1"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Open Chat with Funder
                              </Button>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 mb-4">
                          <div className="p-3 rounded-lg bg-card border border-border">
                            <p className="text-xs text-muted-foreground">PO Amount</p>
                            <p className="text-sm font-semibold text-foreground">R{Number(app.po_amount).toLocaleString()}</p>
                          </div>
                          {app.cost_of_delivery != null && (
                            <div className="p-3 rounded-lg bg-card border border-border">
                              <p className="text-xs text-muted-foreground">Cost of Delivery</p>
                              <p className="text-sm font-semibold text-foreground">R{Number(app.cost_of_delivery).toLocaleString()}</p>
                            </div>
                          )}
                          {app.amount_needed != null && (
                            <div className="p-3 rounded-lg bg-card border border-border">
                              <p className="text-xs text-muted-foreground">Amount Needed</p>
                              <p className="text-sm font-semibold text-foreground">R{Number(app.amount_needed).toLocaleString()}</p>
                            </div>
                          )}
                        </div>

                        {/* Contact info - only for funder on successful apps */}
                        {isFunder && app.status === "successful" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="p-3 rounded-lg bg-card border border-border">
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-semibold text-foreground">{app.email}</p>
                            </div>
                            {app.phone && (
                              <div className="p-3 rounded-lg bg-card border border-border">
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="text-sm font-semibold text-foreground">{app.phone}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Contact info for supplier on non-successful (verify their details) */}
                        {isSupplier && app.status !== "successful" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="p-3 rounded-lg bg-card border border-border">
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-semibold text-foreground">{app.email}</p>
                            </div>
                            {app.phone && (
                              <div className="p-3 rounded-lg bg-card border border-border">
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="text-sm font-semibold text-foreground">{app.phone}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {app.description && (
                          <p className="text-sm text-muted-foreground mb-4">{app.description}</p>
                        )}

                        {/* Funder action buttons */}
                        {isFunder && app.status === "pending" && !app.assigned_funder_id && (
                          <div className="mt-4 mb-4 flex gap-3">
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleTakeOffer(app.id); }}
                              disabled={takingOffer === app.id}
                              size="sm"
                              variant="hero"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {takingOffer === app.id ? "Processing..." : "Take Offer"}
                            </Button>
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleClaimApplication(app.id); }}
                              disabled={claimingApp === app.id}
                              size="sm"
                              variant="outline"
                            >
                              <ClipboardCheck className="w-4 h-4 mr-1" />
                              {claimingApp === app.id ? "Claiming..." : "Claim & Review"}
                            </Button>
                          </div>
                        )}

                        {/* Documents - hide for supplier on successful apps */}
                        {!(isSupplier && app.status === "successful") && (
                          <>
                            <h4 className="text-sm font-semibold text-foreground mt-4 mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-accent" /> Documents
                            </h4>
                            {appDocs.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No documents found.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {appDocs.map((doc) => (
                                  <button
                                    key={doc.id}
                                    onClick={() => handleDownloadDoc(doc.file_path)}
                                    disabled={signingUrl === doc.file_path}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card transition-colors text-left"
                                  >
                                    <Download className="w-4 h-4 text-accent shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {docTypeLabels[doc.document_type] || doc.document_type}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">{doc.file_name || "Download"}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* Chat for funder on successful applications */}
                        {isFunder && app.status === "successful" && openChatAppId === app.id && (
                          <ApplicationChat
                            applicationId={app.id}
                            appEmail={app.email}
                            assignedFunderId={app.assigned_funder_id}
                            onClose={() => setOpenChatAppId(null)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
