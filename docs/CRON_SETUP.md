# Cron Job Setup for Fall Detection System

This document explains how to set up the scheduled job that checks for inactivity thresholds and triggers escalations.

## Option 1: External Cron Service (Recommended for Development)

Use a service like cron-job.org, EasyCron, or GitHub Actions to call the Edge Function periodically.

### Setup Steps:

1. **Generate a Cron Secret**:
   ```bash
   # Generate a secure random string
   openssl rand -hex 32
   ```

2. **Add to Supabase Environment Variables**:
   - Go to Supabase Dashboard → Settings → Edge Functions
   - Add: `CRON_SECRET=<your-generated-secret>`

3. **Configure External Cron Service**:

   **URL**: `https://<your-project-ref>.supabase.co/functions/v1/check-escalation-timers`

   **Method**: POST

   **Headers**:
   ```
   X-Cron-Secret: <your-cron-secret>
   Content-Type: application/json
   ```

   **Schedule**: Every 30 seconds (or */30 * * * * if using cron syntax)

   **For faster response** (every 10 seconds): `*/10 * * * * *` (if supported by your cron service)

### Example using cURL (for testing):

```bash
curl -X POST \
  https://<your-project-ref>.supabase.co/functions/v1/check-escalation-timers \
  -H "X-Cron-Secret: <your-cron-secret>" \
  -H "Content-Type: application/json"
```

---

## Option 2: Supabase pg_cron (Production)

Use PostgreSQL's `pg_cron` extension for native database-level scheduling.

### Setup Steps:

1. **Enable pg_cron Extension**:

   Run this SQL in Supabase SQL Editor:

   ```sql
   -- Enable pg_cron extension
   CREATE EXTENSION IF NOT EXISTS pg_cron;

   -- Grant permissions
   GRANT USAGE ON SCHEMA cron TO postgres;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
   ```

2. **Create HTTP Request Function**:

   ```sql
   -- Function to call Edge Function from pg_cron
   CREATE OR REPLACE FUNCTION public.trigger_escalation_check()
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     v_supabase_url TEXT;
     v_service_key TEXT;
     v_response TEXT;
   BEGIN
     -- Get environment variables (set these as Supabase secrets)
     v_supabase_url := current_setting('app.settings.supabase_url', true);
     v_service_key := current_setting('app.settings.service_role_key', true);

     -- Alternative: Call check_inactivity_thresholds directly
     -- This is more efficient than calling the Edge Function
     PERFORM public.check_inactivity_thresholds();

     -- Note: To send WhatsApp notifications, you'll still need to call
     -- the send-whatsapp-notification Edge Function via HTTP
     -- This requires the http extension or pgsql-http
   END;
   $$;
   ```

3. **Schedule the Cron Job**:

   ```sql
   -- Run every 30 seconds
   SELECT cron.schedule(
     'check-fall-detection-escalations',
     '*/30 * * * * *',  -- Every 30 seconds
     $$SELECT public.trigger_escalation_check();$$
   );

   -- Verify the job was created
   SELECT * FROM cron.job;
   ```

4. **Monitor Cron Job Execution**:

   ```sql
   -- View recent job runs
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-fall-detection-escalations')
   ORDER BY start_time DESC
   LIMIT 10;
   ```

5. **Remove/Update Cron Job** (if needed):

   ```sql
   -- List all cron jobs
   SELECT * FROM cron.job;

   -- Unschedule a job
   SELECT cron.unschedule('check-fall-detection-escalations');

   -- Reschedule with different interval
   SELECT cron.schedule(
     'check-fall-detection-escalations',
     '*/10 * * * * *',  -- Every 10 seconds
     $$SELECT public.trigger_escalation_check();$$
   );
   ```

---

## Option 3: Supabase Realtime + Triggers (Advanced)

Use database triggers to immediately detect threshold breaches.

### Setup Steps:

1. **Create Trigger Function**:

   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_inactivity_alert()
   RETURNS TRIGGER
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     -- When a new inactivity alert is created, trigger WhatsApp notification
     -- This would require calling the send-whatsapp-notification Edge Function
     -- via pg_net or similar

     RAISE NOTICE 'New inactivity alert created: %', NEW.id;

     -- TODO: Call send-whatsapp-notification Edge Function

     RETURN NEW;
   END;
   $$;
   ```

2. **Create Trigger**:

   ```sql
   CREATE TRIGGER on_inactivity_alert_created
     AFTER INSERT ON public.alerts
     FOR EACH ROW
     WHEN (NEW.alert_type = 'motion_inactivity_detected')
     EXECUTE FUNCTION public.handle_new_inactivity_alert();
   ```

---

## Recommended Setup

**For Development/Testing**: Use **Option 1** (External Cron Service) - easier to set up and monitor.

**For Production**: Use **Option 2** (pg_cron) combined with **Option 3** (Triggers) for immediate responses and periodic checks.

---

## Testing the Cron Job

1. **Manual Test**:
   ```bash
   curl -X POST \
     https://<your-project-ref>.supabase.co/functions/v1/check-escalation-timers \
     -H "X-Cron-Secret: <your-cron-secret>" \
     -H "Content-Type: application/json"
   ```

2. **Check Logs**:
   - Supabase Dashboard → Edge Functions → check-escalation-timers → Logs

3. **Verify Database Changes**:
   ```sql
   -- Check for recent alerts
   SELECT * FROM public.alerts
   WHERE alert_type IN ('motion_inactivity_detected', 'fall_escalation_required')
   ORDER BY created_at DESC
   LIMIT 10;

   -- Check inactivity monitoring status
   SELECT * FROM public.inactivity_monitoring
   WHERE resolved_at IS NULL
   ORDER BY inactivity_started_at DESC;
   ```

---

## Troubleshooting

### Cron Job Not Running

- Verify cron secret matches environment variable
- Check Edge Function logs for errors
- Ensure pg_cron extension is enabled (Option 2)
- Verify cron service is active and configured correctly

### WhatsApp Notifications Not Sending

- Check Evolution API credentials are configured
- Verify patient/caregiver WhatsApp phone numbers are set
- Check send-whatsapp-notification Edge Function logs
- Test Evolution API directly with curl

### Alerts Not Being Created

- Run `check_inactivity_thresholds()` manually in SQL Editor
- Verify motion sensor events are being recorded
- Check switchbot_devices table has active devices
- Ensure inactivity_monitoring records exist

---

## Environment Variables Required

Add these to Supabase Dashboard → Settings → Edge Functions:

```
CRON_SECRET=<your-generated-secret>
EVOLUTION_API_URL=<evolution-api-base-url>
EVOLUTION_API_KEY=<evolution-api-key>
EVOLUTION_INSTANCE_NAME=<whatsapp-instance-name>
SWITCHBOT_WEBHOOK_SECRET=<optional-webhook-secret>
```
