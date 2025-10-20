/**
 * Create Fall Alert Edge Function
 *
 * Called by Home Assistant when FP2 sensor detects prolonged inactivity.
 * Creates an alert in the database and triggers notifications.
 *
 * @module edge-functions/create-fall-alert
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { patient_email, patient_phone, location, message } = body;

    console.log("Received fall alert from Home Assistant:", {
      email: patient_email,
      phone: patient_phone?.substring(0, 5) + "***",
      location,
    });

    // Get patient ID from email
    const { data: patient, error: patientError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", patient_email)
      .single();

    if (patientError || !patient) {
      console.error("Patient not found:", patient_email, patientError);
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create alert in database
    const { data: alert, error: alertError } = await supabase
      .from("alerts")
      .insert({
        patient_id: patient.id,
        alert_type: "prolonged_inactivity",
        severity: "medium",
        status: "active",
        alert_message: message || `No movement detected in ${location} for 30+ seconds`,
      })
      .select("id")
      .single();

    if (alertError || !alert) {
      console.error("Error creating alert:", alertError);
      return new Response(
        JSON.stringify({ error: "Failed to create alert" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Alert created:", alert.id);

    // Call send-whatsapp-notification function
    const notificationUrl = `${supabaseUrl}/functions/v1/send-whatsapp-notification`;

    const notificationResponse = await fetch(notificationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        alertId: alert.id,
        recipientType: "patient",
        email: patient_email,
        phoneNumber: patient_phone,
        message: message || `Hey ${patient.full_name}! I noticed no movement in ${location} for 30 seconds. Just checking in - are you okay?`,
      }),
    });

    const notificationResult = await notificationResponse.json();

    if (!notificationResponse.ok) {
      console.error("Notification failed:", notificationResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Notifications failed",
          alertId: alert.id,
          details: notificationResult,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Notifications sent successfully:", notificationResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Alert created and notifications sent",
        alertId: alert.id,
        notifications: notificationResult.notifications,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-fall-alert:", error);
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
