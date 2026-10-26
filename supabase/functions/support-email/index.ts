
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const sender = Deno.env.get("EMAIL_FROM");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendKey || !sender || !supabaseUrl || !serviceKey) {
      throw new Error("Missing required server secrets");
    }

    const { messageId } = await req.json();

    if (!messageId || typeof messageId !== "string") {
      return Response.json(
        { error: "A valid messageId is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const resend = new Resend(resendKey);

    const { data: message, error: messageError } = await supabase
      .from("support_messages")
      .select("id, ticket_id, sender, message, created_at")
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      return Response.json(
        { error: "Message not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("id, customer_name, customer_email, subject")
      .eq("id", message.ticket_id)
      .single();

    if (ticketError || !ticket) {
      throw new Error("Support ticket not found");
    }

    const { data: settings } = await supabase
      .from("settings")
      .select("business_email, site_name")
      .limit(1)
      .maybeSingle();

    const adminEmail = settings?.business_email ||
      "support.thepodcastlibrary@gmail.com";
    const siteName = settings?.site_name || "PodcastLibrary";

    const customerSent = ["customer", "user"].includes(
      String(message.sender).toLowerCase(),
    );

    const recipients = customerSent
      ? [{
          to: adminEmail,
          subject: `New support message: ${ticket.subject || "Support request"}`,
          text: `A customer sent a message.\n\nCustomer: ${ticket.customer_name || "Customer"}\nEmail: ${ticket.customer_email || "Not provided"}\nSubject: ${ticket.subject || "Support"}\n\nMessage:\n${message.message}`,
        }]
      : ticket.customer_email
      ? [{
          to: ticket.customer_email,
          subject: `A reply from ${siteName}`,
          text: `Hello ${ticket.customer_name || "there"},\n\nWe've replied to your support request.\n\nSubject: ${ticket.subject || "Support"}\n\nReply:\n${message.message}\n\nRegards,\n${siteName}`,
        }]
      : [];

    const results = [];

    for (const email of recipients) {
      const { data, error } = await resend.emails.send({
        from: sender,
        to: [email.to],
        subject: email.subject,
        text: email.text,
      });

      if (error) {
        console.error("Email sending failed:", error);
        throw new Error("Resend could not send the email");
      }

      results.push({ id: data?.id, to: email.to });
    }

    return Response.json(
      { success: true, sent: results.length },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("support-email error:", error);
    return Response.json(
      { error: "Unable to process email notification" },
      { status: 500, headers: corsHeaders },
    );
  }
});
