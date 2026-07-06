import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    const record = payload.record || payload;
    const eventType = payload.event_type || "INSERT";

    const appUrl = "https://www.mypo.co.za";
    const dashboardUrl = `${appUrl}/dashboard`;

    // Helper: enqueue a branded transactional email via the Lovable email queue.
    const sendBranded = async (params: {
      templateName: string;
      recipientEmail: string;
      idempotencyKey: string;
      templateData: Record<string, unknown>;
    }) => {
      const { error } = await supabase.functions.invoke(
        "send-transactional-email",
        { body: params },
      );
      if (error) throw new Error(error.message ?? String(error));
    };

    // CASE 1: New application (INSERT) → notify all active funders
    if (eventType === "INSERT") {
      const {
        id: applicationId,
        company_name,
        po_amount,
        amount_needed,
        ref_code,
      } = record;
      console.log(
        `[INSERT] New application ${ref_code ?? applicationId} from ${company_name}`,
      );

      const { data: funders, error: fetchError } = await supabase
        .from("registered_funders")
        .select("email, contact_name")
        .eq("is_active", true);

      if (fetchError) {
        console.error("Error fetching funders:", fetchError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch funders" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (!funders || funders.length === 0) {
        return new Response(JSON.stringify({ message: "No active funders" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Enqueuing emails to ${funders.length} funders`);

      const results = await Promise.allSettled(
        funders.map(async (funder) => {
          try {
            await sendBranded({
              templateName: "funder-new-opportunity",
              recipientEmail: funder.email,
              idempotencyKey: `funder-opp-${applicationId}-${funder.email}`,
              templateData: {
                funderName: funder.contact_name || "Funder",
                companyName: company_name,
                poAmount: po_amount,
                amountNeeded: amount_needed,
                refCode: ref_code,
                dashboardUrl,
              },
            });
            return { email: funder.email, ok: true };
          } catch (e) {
            console.error(`Failed to enqueue email to ${funder.email}: ${e}`);
            return { email: funder.email, ok: false, error: String(e) };
          }
        }),
      );

      return new Response(
        JSON.stringify({ event: "INSERT", sent: results.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // CASE 2: Status changed to 'successful' (UPDATE) → notify the supplier
    if (eventType === "UPDATE" && record.status === "successful") {
      const {
        id: applicationId,
        company_name,
        email: supplierEmail,
        contact_name,
        po_amount,
        ref_code,
        assigned_funder_id,
      } = record;
      console.log(`[UPDATE] Application ${ref_code ?? applicationId} marked successful`);

      if (!supplierEmail) {
        return new Response(JSON.stringify({ error: "No supplier email" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let funderName = "A verified funder";
      if (assigned_funder_id) {
        const { data: funder } = await supabase
          .from("registered_funders")
          .select("company_name")
          .eq("id", assigned_funder_id)
          .maybeSingle();
        if (funder?.company_name) funderName = funder.company_name;
      }

      try {
        await sendBranded({
          templateName: "supplier-application-accepted",
          recipientEmail: supplierEmail,
          idempotencyKey: `supplier-accepted-${applicationId}`,
          templateData: {
            supplierName: contact_name || "there",
            companyName: company_name,
            funderName,
            poAmount: po_amount,
            refCode: ref_code,
            dashboardUrl,
          },
        });
        console.log(`Supplier notification enqueued to ${supplierEmail}`);
        return new Response(
          JSON.stringify({ event: "UPDATE", supplier: supplierEmail, ok: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (e) {
        console.error(`Failed to enqueue supplier email ${supplierEmail}: ${e}`);
        return new Response(
          JSON.stringify({
            event: "UPDATE",
            supplier: supplierEmail,
            ok: false,
            error: String(e),
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    console.log(`Ignoring event: ${eventType}, status: ${record.status}`);
    return new Response(
      JSON.stringify({
        message: "No action taken",
        event: eventType,
        status: record.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
