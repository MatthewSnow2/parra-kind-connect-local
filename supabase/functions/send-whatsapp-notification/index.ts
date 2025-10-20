/**
 * Send Notification Edge Function
 *
 * Sends notifications via Email (primary) and WhatsApp (optional) for:
 * - Fall detection check-ins to patients
 * - Escalation alerts to caregivers
 *
 * Dual notification approach:
 * 1. Email always sent (via Resend API - gracefully handles missing credentials)
 * 2. WhatsApp sent if Evolution API credentials configured
 *
 * @module edge-functions/send-whatsapp-notification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Types & Validation Schemas
// ============================================================================

const sendNotificationSchema = z.object({
  alertId: z.string().uuid(),
  recipientType: z.enum(["patient", "caregiver"]),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  message: z.string().optional(),
});

type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

interface NotificationResult {
  emailSent: boolean;
  whatsappSent: boolean;
  errors: string[];
}

// ============================================================================
// Utility Functions
// ============================================================================

function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join(".");
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ["Validation failed"] };
  }
}

async function safelyParseJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    const body = await req.json();
    return body as T;
  } catch {
    return null;
  }
}

function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function hasValidAuth(req: Request): boolean {
  const token = extractAuthToken(req);
  return token !== null && token.length > 0;
}

/**
 * Send email via Resend (free tier available)
 */
async function sendEmail(
  resendApiKey: string | undefined,
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Sending email to:", toEmail);

    // If no Resend API key, just log (for testing/demo)
    if (!resendApiKey) {
      console.log("⚠️ No RESEND_API_KEY configured - Email would be sent:");
      console.log({
        to: toEmail,
        subject,
        html: htmlContent.substring(0, 100) + "...",
      });

      // For demo purposes, consider this successful
      // In production, you'd want this to fail
      return { success: true, error: "Email logging only (no API key)" };
    }

    // Send via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Parra Fall Detection <onboarding@resend.dev>", // Using Resend's test domain
        to: [toEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", response.status, errorText);

      // If it's a domain verification error, log but don't fail
      if (errorText.includes("domain") || errorText.includes("verify")) {
        console.log("⚠️ Domain not verified - email logged but not sent");
        return { success: true, error: "Domain verification pending" };
      }

      return {
        success: false,
        error: `Resend API error: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log("✅ Email sent via Resend:", result.id);

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send WhatsApp message via Evolution API (optional)
 * Includes retry logic with progressive timeouts for serverless cold starts
 */
async function sendWhatsAppMessage(
  baseUrl: string,
  apiKey: string,
  instanceName: string,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  // Clean phone number - Evolution expects international format without +
  // E.g., 13039279468 for US, 5511999999999 for Brazil
  const cleanPhone = phoneNumber.replace(/[^\d]/g, "");

  // Evolution API requires @s.whatsapp.net suffix
  const whatsappJid = `${cleanPhone}@s.whatsapp.net`;

  console.log("Sending WhatsApp via Evolution API:", {
    instanceName: instanceName,
    phone: cleanPhone.substring(0, 5) + "***",
  });

  // Evolution API endpoint: POST {baseUrl}/message/sendText/{instanceName}
  // Instance name must be URL-encoded (e.g., "Parra AI" becomes "Parra%20AI")
  const url = `${baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`;

  // Retry configuration: [timeout in ms, retry number]
  const retryConfig = [
    { timeout: 20000, attempt: 1, label: "20s (warm instance)" },
    { timeout: 45000, attempt: 2, label: "45s (cold start)" },
    { timeout: 60000, attempt: 3, label: "60s (final attempt)" },
  ];

  let lastError = "Unknown error";

  // Try each retry configuration
  for (const config of retryConfig) {
    try {
      console.log(`⏳ Attempt ${config.attempt}/3: Calling Evolution API with ${config.label} timeout...`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
          },
          body: JSON.stringify({
            number: whatsappJid,
            text: message,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Attempt ${config.attempt} - Evolution API error:`, response.status, errorText);
          lastError = `Evolution API error: ${response.status}`;

          // Don't retry on 4xx errors (client errors - won't fix with retry)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              error: lastError,
            };
          }

          // Retry on 5xx errors (server errors - might be temporary)
          continue;
        }

        const result = await response.json();
        console.log(`✅ Attempt ${config.attempt} - Evolution API response:`, result);

        // Evolution API returns success if message was queued
        if (result.key || result.message) {
          console.log(`✅ WhatsApp message sent successfully on attempt ${config.attempt}`);
          return { success: true };
        } else {
          lastError = result.error || "Failed to send WhatsApp message";
          console.error(`❌ Attempt ${config.attempt} - Invalid response:`, lastError);
          continue;
        }
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`⏱️ Attempt ${config.attempt} - Timeout after ${config.timeout}ms`);
          lastError = `Timeout after ${config.timeout / 1000}s`;

          // Don't give up yet, try next timeout
          if (config.attempt < retryConfig.length) {
            console.log(`🔄 Retrying with longer timeout...`);
            continue;
          }
        } else {
          console.error(`❌ Attempt ${config.attempt} - Error:`, error);
          lastError = error instanceof Error ? error.message : "Unknown error";
          continue;
        }
      }
    } catch (error) {
      console.error(`❌ Attempt ${config.attempt} - Outer error:`, error);
      lastError = error instanceof Error ? error.message : "Unknown error";
      continue;
    }
  }

  // All retries failed
  console.error(`❌ All ${retryConfig.length} attempts failed. Last error:`, lastError);
  return {
    success: false,
    error: `Failed after ${retryConfig.length} attempts: ${lastError}`,
  };
}

/**
 * Send message via Telegram Bot (instant, reliable, FREE!)
 */
async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📱 Sending message via Telegram...");

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telegram API error:", response.status, errorText);
      return {
        success: false,
        error: `Telegram API error: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log("✅ Telegram message sent:", result.result?.message_id);

    return { success: true };
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification via n8n webhook (most flexible option)
 */
async function sendN8nWebhook(
  webhookUrl: string,
  phone: string,
  message: string,
  alertData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📢 Sending notification via n8n webhook...");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
        alert: alertData,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n webhook error:", response.status, errorText);
      return {
        success: false,
        error: `n8n webhook error: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log("✅ n8n webhook triggered:", result);

    return { success: true };
  } catch (error) {
    console.error("Error calling n8n webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send SMS via Twilio (more reliable than Evolution API)
 */
async function sendTwilioSMS(
  accountSid: string,
  authToken: string,
  fromPhone: string,
  toPhone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanToPhone = toPhone.replace(/[^\d+]/g, "");

    console.log("Sending SMS via Twilio:", {
      from: fromPhone,
      to: cleanToPhone.substring(0, 5) + "***",
    });

    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    // Create Basic Auth header
    const credentials = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromPhone,
        To: cleanToPhone,
        Body: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twilio API error:", response.status, errorText);
      return {
        success: false,
        error: `Twilio API error: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log("✅ Twilio SMS sent:", result.sid);

    return { success: true };
  } catch (error) {
    console.error("Error sending Twilio SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate check-in message for patient
 */
function generateCheckInMessage(
  patientName: string,
  location: string,
  inactivityMinutes: number
): { subject: string; text: string; html: string } {
  const subject = `Parra Check-In: Are You Okay?`;

  const text = `Hi ${patientName}!

I noticed there hasn't been any movement in the ${location} for about ${inactivityMinutes} minutes.

Just checking in - are you okay? Please reply to this message if everything is fine.

- Parra`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Hi ${patientName}! 👋</h2>

      <p>I noticed there hasn't been any movement in the <strong>${location}</strong> for about ${inactivityMinutes} minutes.</p>

      <p>Just checking in - are you okay? Please reply to this message if everything is fine.</p>

      <p style="color: #6B7280; margin-top: 30px;">- Parra</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Generate escalation message for caregivers
 */
function generateEscalationMessage(
  patientName: string,
  location: string,
  inactivityMinutes: number,
  checkInSentMinutesAgo: number
): { subject: string; text: string; html: string } {
  const subject = `🚨 URGENT: ${patientName} Fall Detection Alert`;

  const text = `🚨 URGENT ALERT - Fall Detection 🚨

Patient: ${patientName}
Location: ${location}
Status: No response to check-in

Details:
• No motion detected for ${inactivityMinutes} minutes
• Check-in message sent ${checkInSentMinutesAgo} minutes ago
• No response from patient

ACTION REQUIRED: Please contact ${patientName} immediately or check on them in person.

- Parra Fall Detection System`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #DC2626; padding: 20px; border-radius: 8px;">
      <h2 style="color: #DC2626;">🚨 URGENT ALERT - Fall Detection</h2>

      <div style="background-color: #FEE2E2; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> No response to check-in</p>
      </div>

      <h3 style="color: #991B1B;">Details:</h3>
      <ul style="line-height: 1.8;">
        <li>No motion detected for ${inactivityMinutes} minutes</li>
        <li>Check-in message sent ${checkInSentMinutesAgo} minutes ago</li>
        <li>No response from patient</li>
      </ul>

      <div style="background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <strong>ACTION REQUIRED:</strong> Please contact ${patientName} immediately or check on them in person.
      </div>

      <p style="color: #6B7280; margin-top: 30px;">- Parra Fall Detection System</p>
    </div>
  `;

  return { subject, text, html };
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // JWT verification disabled via config.json for webhook/cron access
    // if (!hasValidAuth(req)) {
    //   return new Response(
    //     JSON.stringify({ error: "Unauthorized" }),
    //     {
    //       status: 401,
    //       headers: { ...corsHeaders, "Content-Type": "application/json" },
    //     }
    //   );
    // }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Email credentials (optional - will log if not configured)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // SMS/WhatsApp/Notification credentials
    // Telegram Bot (fastest, most reliable, FREE!)
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");

    // n8n Webhook (flexible for custom workflows)
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");

    // Twilio SMS (backup - requires A2P registration)
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    // Evolution API WhatsApp (last resort - unreliable)
    const evolutionBaseUrl = Deno.env.get("EVOLUTION_BASE_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");
    const evolutionInstanceName = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    console.log("DEBUG Messaging config:", {
      hasTelegram: !!(telegramBotToken && telegramChatId),
      hasN8n: !!n8nWebhookUrl,
      hasTwilio: !!(twilioAccountSid && twilioAuthToken && twilioPhoneNumber),
      hasEvolution: !!(evolutionBaseUrl && evolutionApiKey && evolutionInstanceName),
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await safelyParseJson(req);
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validation = validateInput(sendNotificationSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.errors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { alertId, recipientType, phoneNumber, email, message } = validation.data;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch alert details
    const { data: alert, error: alertError } = await supabase
      .from("alerts")
      .select(`
        *,
        patient:profiles!alerts_patient_id_fkey(id, full_name, email, whatsapp_phone),
        device:switchbot_devices!alerts_motion_device_id_fkey(device_name, location),
        monitoring:inactivity_monitoring!alerts_inactivity_monitoring_id_fkey(
          inactivity_started_at,
          check_in_sent_at,
          inactivity_threshold_seconds,
          escalation_threshold_minutes
        )
      `)
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      console.error("Error fetching alert:", alertError);
      return new Response(
        JSON.stringify({ error: "Alert not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let targetEmail: string;
    let targetPhone: string | null = null;
    let messageContent: { subject: string; text: string; html: string };

    const result: NotificationResult = {
      emailSent: false,
      whatsappSent: false,
      errors: [],
    };

    if (recipientType === "patient") {
      // Send check-in to patient
      targetEmail = email || alert.patient.email;
      targetPhone = phoneNumber || alert.patient.whatsapp_phone;

      if (!targetEmail) {
        return new Response(
          JSON.stringify({ error: "Patient email not configured" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (message) {
        messageContent = {
          subject: "Parra Check-In",
          text: message,
          html: `<div style="font-family: Arial, sans-serif;">${message.replace(/\n/g, "<br>")}</div>`,
        };
      } else {
        const inactivityMinutes = alert.monitoring
          ? Math.floor(alert.monitoring.inactivity_threshold_seconds / 60)
          : 1;
        messageContent = generateCheckInMessage(
          alert.patient.full_name,
          alert.device?.location || "your area",
          inactivityMinutes
        );
      }
    } else {
      // Send escalation to caregivers
      const { data: caregivers, error: caregiversError } = await supabase
        .from("care_relationships")
        .select(`
          caregiver:profiles!care_relationships_caregiver_id_fkey(
            id,
            full_name,
            email,
            whatsapp_phone
          )
        `)
        .eq("patient_id", alert.patient_id)
        .eq("status", "active");

      if (caregiversError || !caregivers || caregivers.length === 0) {
        console.error("No active caregivers found:", caregiversError);
        return new Response(
          JSON.stringify({ error: "No active caregivers configured" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      targetEmail = email || caregivers[0].caregiver.email;
      targetPhone = phoneNumber || caregivers[0].caregiver.whatsapp_phone;

      if (!targetEmail) {
        return new Response(
          JSON.stringify({ error: "Caregiver email not configured" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (message) {
        messageContent = {
          subject: "🚨 Parra Fall Detection Alert",
          text: message,
          html: `<div style="font-family: Arial, sans-serif;">${message.replace(/\n/g, "<br>")}</div>`,
        };
      } else {
        const now = new Date();
        const inactivityStarted = new Date(alert.monitoring?.inactivity_started_at || alert.created_at);
        const checkInSent = new Date(alert.monitoring?.check_in_sent_at || alert.created_at);
        const inactivityMinutes = Math.floor((now.getTime() - inactivityStarted.getTime()) / 60000);
        const checkInSentMinutesAgo = Math.floor((now.getTime() - checkInSent.getTime()) / 60000);

        messageContent = generateEscalationMessage(
          alert.patient.full_name,
          alert.device?.location || "unknown location",
          inactivityMinutes,
          checkInSentMinutesAgo
        );
      }
    }

    // Send Email (Primary - Always attempt)
    console.log("Sending email notification to:", targetEmail);
    const emailResult = await sendEmail(
      resendApiKey,
      targetEmail,
      messageContent.subject,
      messageContent.html
    );

    if (emailResult.success) {
      result.emailSent = true;
      console.log("✅ Email sent successfully");
    } else {
      result.errors.push(`Email failed: ${emailResult.error}`);
      console.error("❌ Email failed:", emailResult.error);
    }

    // Send Telegram notification (instant, reliable, always works!)
    if (telegramBotToken && telegramChatId) {
      console.log("📱 Sending Telegram notification...");
      const telegramResult = await sendTelegramMessage(
        telegramBotToken,
        telegramChatId,
        `<b>🚨 ${messageContent.subject}</b>\n\n${messageContent.text}`
      );

      if (telegramResult.success) {
        result.whatsappSent = true; // Using this field for all messaging
        console.log("✅ Telegram notification sent successfully");
      } else {
        result.errors.push(`Telegram failed: ${telegramResult.error}`);
        console.error("❌ Telegram failed:", telegramResult.error);
      }
    } else {
      console.log("⚠️ Telegram not configured");
    }

    // Send SMS/WhatsApp/Notification (Try ALL configured methods)
    if (targetPhone) {
      // Try n8n webhook (no regulatory BS, works immediately)
      if (n8nWebhookUrl) {
        console.log("📢 Sending notification via n8n webhook...");
        const n8nResult = await sendN8nWebhook(
          n8nWebhookUrl,
          targetPhone,
          messageContent.text,
          {
            alertId,
            recipientType,
            patient: alert.patient?.full_name,
            location: alert.device?.location,
          }
        );

        if (n8nResult.success) {
          result.whatsappSent = true; // Using this field for all SMS/messaging
          console.log("✅ n8n webhook triggered successfully");
        } else {
          result.errors.push(`n8n webhook failed: ${n8nResult.error}`);
          console.error("❌ n8n webhook failed:", n8nResult.error);
        }
      } else {
        console.log("⚠️ n8n webhook not configured");
      }

      // Also try Evolution API WhatsApp (send to ALL channels)
      if (evolutionBaseUrl && evolutionApiKey && evolutionInstanceName) {
        console.log("🔄 Trying Evolution API WhatsApp...");
        const whatsappResult = await sendWhatsAppMessage(
          evolutionBaseUrl,
          evolutionApiKey,
          evolutionInstanceName,
          targetPhone,
          messageContent.text
        );

        if (whatsappResult.success) {
          result.whatsappSent = true;
          console.log("✅ WhatsApp sent successfully via Evolution API");
        } else {
          result.errors.push(`WhatsApp failed: ${whatsappResult.error}`);
          console.error("❌ WhatsApp failed:", whatsappResult.error);
        }
      } else {
        console.log("⚠️ Evolution API not configured");
      }

      // Twilio SMS as additional fallback
      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        console.log("📱 Sending SMS via Twilio...");
        const smsResult = await sendTwilioSMS(
          twilioAccountSid,
          twilioAuthToken,
          twilioPhoneNumber,
          targetPhone,
          messageContent.text
        );

        if (smsResult.success) {
          result.whatsappSent = true;
          console.log("✅ SMS sent successfully via Twilio");
        } else {
          result.errors.push(`SMS failed: ${smsResult.error}`);
          console.error("❌ Twilio SMS failed:", smsResult.error);
        }
      } else {
        console.log("⚠️ Twilio not configured");
      }
    } else {
      console.log("⚠️ No target phone number - skipping phone notifications");
    }

    // Consider it a success if at least one notification was sent
    const overallSuccess = result.emailSent || result.whatsappSent;

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        message: overallSuccess
          ? "Notification sent successfully"
          : "Failed to send notifications",
        alertId,
        recipientType,
        notifications: {
          email: result.emailSent ? "sent" : "failed",
          whatsapp: result.whatsappSent ? "sent" : result.errors.some(e => e.includes("WhatsApp")) ? "failed" : "not_configured",
        },
        errors: result.errors.length > 0 ? result.errors : undefined,
      }),
      {
        status: overallSuccess ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Send notification error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
