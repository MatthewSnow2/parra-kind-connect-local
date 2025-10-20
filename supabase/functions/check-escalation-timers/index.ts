/**
 * Check Escalation Timers Edge Function
 *
 * Scheduled function that runs periodically to:
 * - Check for inactivity threshold breaches
 * - Send check-in messages to patients
 * - Send escalation alerts to caregivers
 * - Trigger WhatsApp notifications
 *
 * Should be invoked via cron job every 10-30 seconds.
 *
 * Security Features:
 * - Service role authentication (cron jobs only)
 * - Idempotent operations
 * - Error handling
 *
 * @module edge-functions/check-escalation-timers
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Types
// ============================================================================

interface CheckResult {
  success: boolean;
  alerts_created: number;
  check_ins_sent: number;
  escalations_sent: number;
  errors: string[];
  checked_at: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Invoke send-whatsapp-notification Edge Function
 */
async function sendWhatsAppNotification(
  supabaseUrl: string,
  supabaseServiceKey: string,
  alertId: string,
  recipientType: "patient" | "caregiver"
): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        alertId,
        recipientType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send WhatsApp notification:", response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log("WhatsApp notification sent:", result);
    return true;
  } catch (error) {
    console.error("Error invoking send-whatsapp-notification:", error);
    return false;
  }
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const cronSecret = Deno.env.get("CRON_SECRET");

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

    // Verify cron secret if configured (for external cron services)
    if (cronSecret) {
      const providedSecret = req.headers.get("X-Cron-Secret") || req.headers.get("Authorization")?.replace("Bearer ", "");
      if (providedSecret !== cronSecret) {
        console.error("Invalid cron secret");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting escalation timer check...");

    // Call database function to check thresholds
    const { data: checkResult, error: checkError } = await supabase.rpc("check_inactivity_thresholds");

    if (checkError) {
      console.error("Error checking inactivity thresholds:", checkError);
      return new Response(
        JSON.stringify({
          error: "Failed to check inactivity thresholds",
          details: checkError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = checkResult as CheckResult;
    console.log("Check result:", result);

    const errors: string[] = [];
    let whatsappNotificationsSent = 0;

    // If check-ins were sent, trigger WhatsApp notifications to patients
    if (result.check_ins_sent > 0) {
      // Fetch alerts that need check-in notifications
      const { data: checkInAlerts, error: checkInAlertsError } = await supabase
        .from("alerts")
        .select("id")
        .eq("alert_type", "prolonged_inactivity")
        .is("resolved_at", null)
        .gte("created_at", new Date(Date.now() - 60000).toISOString()) // Created in last minute
        .limit(10);

      if (checkInAlertsError) {
        console.error("Error fetching check-in alerts:", checkInAlertsError);
        errors.push(`Failed to fetch check-in alerts: ${checkInAlertsError.message}`);
      } else if (checkInAlerts && checkInAlerts.length > 0) {
        // Send WhatsApp notifications for each alert
        for (const alert of checkInAlerts) {
          const sent = await sendWhatsAppNotification(supabaseUrl, supabaseServiceKey, alert.id, "patient");
          if (sent) {
            whatsappNotificationsSent++;
          } else {
            errors.push(`Failed to send check-in WhatsApp for alert ${alert.id}`);
          }
        }
      }
    }

    // If escalations were sent, trigger WhatsApp notifications to caregivers
    if (result.escalations_sent > 0) {
      // Fetch alerts that need escalation notifications
      const { data: escalationAlerts, error: escalationAlertsError } = await supabase
        .from("alerts")
        .select("id")
        .eq("alert_type", "fall_detected")
        .is("resolved_at", null)
        .gte("created_at", new Date(Date.now() - 60000).toISOString()) // Created in last minute
        .limit(10);

      if (escalationAlertsError) {
        console.error("Error fetching escalation alerts:", escalationAlertsError);
        errors.push(`Failed to fetch escalation alerts: ${escalationAlertsError.message}`);
      } else if (escalationAlerts && escalationAlerts.length > 0) {
        // Send WhatsApp notifications for each alert
        for (const alert of escalationAlerts) {
          const sent = await sendWhatsAppNotification(supabaseUrl, supabaseServiceKey, alert.id, "caregiver");
          if (sent) {
            whatsappNotificationsSent++;
          } else {
            errors.push(`Failed to send escalation WhatsApp for alert ${alert.id}`);
          }
        }
      }
    }

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          alerts_created: result.alerts_created,
          check_ins_sent: result.check_ins_sent,
          escalations_sent: result.escalations_sent,
          whatsapp_notifications_sent: whatsappNotificationsSent,
          errors: errors,
        },
        checked_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Check escalation timers error:", error);
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
