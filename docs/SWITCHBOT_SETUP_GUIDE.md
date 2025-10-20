# SwitchBot Motion Sensor Setup Guide

## Overview

This guide walks you through setting up your SwitchBot Motion Sensor (Model W1101500) for fall detection with the Para system.

---

## What You'll Need

- ✅ SwitchBot Motion Sensor (Model W1101500)
- ✅ SwitchBot Hub (Hub Mini, Hub 2, or Hub Mini with Matter)
- ✅ SwitchBot mobile app (iOS or Android version ≥ V9.0)
- ✅ Active internet connection
- ✅ 20-30 minutes

---

## Part 1: Physical Setup

### Step 1: Set Up SwitchBot Hub

The Hub is **required** for the Motion Sensor to work with the API/webhooks.

1. **Unbox your SwitchBot Hub** and plug it into power
2. **Open the SwitchBot app** on your phone
3. Tap **"+"** → **"Add Device"** → Select your Hub model
4. Follow the in-app instructions to connect Hub to Wi-Fi
5. Wait for Hub LED to show solid (connected)

### Step 2: Pair Motion Sensor with Hub

1. **Remove the battery tab** from Motion Sensor (or insert batteries)
2. In the SwitchBot app, tap **"+"** → **"Add Device"**
3. Select **"Motion Sensor"**
4. Hold the sensor near your Hub
5. Press and hold the **button on the sensor** until LED blinks
6. Wait for pairing to complete (app will confirm)
7. **Give it a name** (e.g., "Bathroom Sensor", "Bedroom Sensor")

### Step 3: Place the Sensor

**For Fall Detection**, place the sensor in high-risk areas:

- 🚽 **Bathroom** (most common fall location)
- 🛏️ **Bedroom** (near bed)
- 🚪 **Hallway** (between rooms)
- 🪜 **Near stairs**

**Mounting Tips:**
- Mount **6-7 feet high** for best coverage
- Angle slightly **downward** to detect floor-level activity
- Avoid pointing at:
  - Windows (sunlight can cause false triggers)
  - Air vents (moving air)
  - Pets' usual paths (if false alarms are a concern)

---

## Part 2: Get SwitchBot API Credentials

### Step 1: Enable Developer Options

**For App Version ≥ V9.0:**

1. Open SwitchBot app
2. Go to **Profile** → **Preferences** → **About**
3. **Tap "App Version" 10 times rapidly**
4. A new option **"Developer Options"** will appear
5. Tap **"Developer Options"**
6. Tap **"Get Token"**

**For App Version < V9.0:**

1. Go to **Profile** → **Preferences**
2. **Tap "App Version" 10 times**
3. Developer Options will appear directly

### Step 2: Copy Your Credentials

You'll see two important values:

```
Token:  abc123def456...   (long string)
Secret: xyz789ghi012...   (long string)
```

**Save these securely!** You'll need them for the Para system.

⚠️ **Important**: These credentials are tied to your SwitchBot account. Keep them private!

---

## Part 3: Enable Cloud Services

The Motion Sensor must be connected to SwitchBot Cloud for webhooks to work.

1. In SwitchBot app, go to **Profile** → **Preferences**
2. Find **"Cloud Services"** option
3. **Enable** Cloud Services
4. Wait for sync (usually a few seconds)

**Verify it's working:**
- Go to the Motion Sensor device in the app
- Check that status updates appear in real-time
- Wave your hand in front of the sensor - app should show "Motion Detected"

---

## Part 4: Get Device MAC Address

You'll need the sensor's MAC address to register it in the Para system.

### Method 1: Via SwitchBot App

1. Open SwitchBot app
2. Go to your Motion Sensor device
3. Tap the **⚙️ settings icon** (top right)
4. Scroll down to find **"Device Info"** or **"MAC Address"**
5. It will look like: `AA:BB:CC:DD:EE:FF` or `AABBCCDDEEFF`

### Method 2: Via API (Advanced)

```bash
curl -X GET "https://api.switch-bot.com/v1.1/devices" \
  -H "Authorization: YOUR_TOKEN" \
  -H "sign: YOUR_SIGNATURE" \
  -H "t: TIMESTAMP" \
  -H "nonce: RANDOM_STRING"
```

Look for `"deviceType": "Motion Sensor"` in the response.

**Save this MAC address** - you'll enter it in the Para admin panel.

---

## Part 5: Configure Para System

### Step 1: Add SwitchBot Credentials to Supabase

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **Edge Functions**
2. Add these environment variables:

```
SWITCHBOT_TOKEN=your_token_from_step2
SWITCHBOT_SECRET=your_secret_from_step2
SWITCHBOT_WEBHOOK_SECRET=generate_random_string (optional for security)
```

To generate a webhook secret:
```bash
openssl rand -hex 32
```

### Step 2: Get Your Webhook URL

Your Supabase webhook URL will be:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/switchbot-webhook
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID.

**Example**: `https://abcdefghijklmno.supabase.co/functions/v1/switchbot-webhook`

### Step 3: Register Webhook with SwitchBot

⚠️ **Note**: As of SwitchBot API v1.1, webhook registration must be done via API (not in the app).

```bash
curl -X POST "https://api.switch-bot.com/v1.1/webhook/setupWebhook" \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_TOKEN" \
  -d '{
    "action": "setupWebhook",
    "url": "https://YOUR_PROJECT_REF.supabase.co/functions/v1/switchbot-webhook",
    "deviceList": "ALL"
  }'
```

**Verify webhook is set:**

```bash
curl -X GET "https://api.switch-bot.com/v1.1/webhook/queryWebhook" \
  -H "Authorization: YOUR_TOKEN"
```

You should see your webhook URL in the response.

### Step 4: Register Sensor in Para Admin Panel

1. Log in to Para as **Admin**
2. Go to **Admin Dashboard** → **Motion Sensors**
3. Click **"Register New Sensor"**
4. Fill in:
   - **Device MAC**: `AA:BB:CC:DD:EE:FF` (from Part 4)
   - **Device Name**: "Bathroom Sensor" (or your chosen name)
   - **Patient**: Select the patient this sensor monitors
   - **Location**: "Bathroom" (or room name)
   - **Inactivity Threshold**: 30 seconds (default for testing)
   - **Escalation Time**: 10 minutes (default)
5. Click **"Save"**

---

## Part 6: Configure Patient WhatsApp Number

For fall detection alerts to work, patients need WhatsApp numbers configured.

1. In Para Admin Panel, go to **Users** or **Patients**
2. Select the patient
3. Find **"WhatsApp Phone"** field
4. Enter phone number in international format: `14694502967` (no + or spaces)
5. Click **"Save"**

**Test the number:**
- Send a test WhatsApp message to verify it's correct
- Make sure the patient has WhatsApp installed and active

---

## Part 7: Test the System

### Test 1: Motion Detection

1. **Wave your hand** in front of the sensor
2. Check **Supabase logs**:
   - Go to Dashboard → Edge Functions → `switchbot-webhook` → Logs
   - You should see: `"Motion event processed successfully"`

3. Check **Para database**:
   ```sql
   SELECT * FROM motion_sensor_events
   ORDER BY recorded_at DESC
   LIMIT 5;
   ```
   You should see `"DETECTED"` events

### Test 2: Inactivity Detection

1. **Leave the sensor area** (no motion for 30+ seconds)
2. After 30 seconds, check logs - should see `"inactivity_monitoring_started"`
3. Check database:
   ```sql
   SELECT * FROM inactivity_monitoring
   WHERE resolved_at IS NULL;
   ```

### Test 3: Check-In Message

1. Wait 30 seconds of inactivity
2. Check patient's WhatsApp - should receive check-in message
3. **Respond to the message** (any text)
4. System should mark monitoring as resolved

### Test 4: Escalation (Optional)

1. Start inactivity (leave the area)
2. DO NOT respond to the check-in WhatsApp message
3. Wait 10 minutes
4. Caregivers should receive escalation alert via WhatsApp

### Test 5: Motion Resumes (Auto-Resolve)

1. Start inactivity
2. Before check-in is sent, **move in front of sensor**
3. System should automatically resolve monitoring
4. No WhatsApp messages should be sent

---

## Troubleshooting

### Motion Sensor Not Detecting

**Problem**: Sensor doesn't detect motion in the app

**Solutions**:
- Check battery level (in app)
- Sensor might be in "sleep mode" - press button to wake
- Ensure sensor is within 30-50 feet of Hub
- Check Hub is online (LED should be solid)
- Restart Hub by unplugging for 10 seconds

### Webhook Not Receiving Events

**Problem**: No events showing up in Supabase logs

**Solutions**:
1. Verify webhook is registered:
   ```bash
   curl -X GET "https://api.switch-bot.com/v1.1/webhook/queryWebhook" \
     -H "Authorization: YOUR_TOKEN"
   ```
2. Check Cloud Services is enabled in app
3. Verify webhook URL is correct (no typos)
4. Check Supabase Edge Function is deployed
5. Look for errors in Supabase function logs

### WhatsApp Messages Not Sending

**Problem**: Patient/caregiver not receiving alerts

**Solutions**:
- Verify phone number format (no + or spaces): `14694502967`
- Check Evolution API credentials in Supabase environment variables
- Verify Evolution API instance is running
- Check send-whatsapp-notification function logs
- Test Evolution API directly with a manual message

### False Alarms (Pets, Shadows)

**Problem**: Too many false inactivity alerts

**Solutions**:
- Increase **Inactivity Threshold** to 60-120 seconds
- Reposition sensor away from pet areas
- Mount higher (7-8 feet) to avoid pets
- Adjust sensor angle away from windows
- Consider adding "quiet hours" (future feature)

### API Rate Limit Errors

**Problem**: "Rate limit exceeded" errors

**Solutions**:
- SwitchBot allows 10,000 API calls per day
- Webhook events don't count toward this limit
- If polling, reduce frequency
- Check for infinite loops in code

---

## API Limits & Best Practices

**SwitchBot API Limits**:
- ✅ 10,000 API calls per day (webhook events don't count)
- ✅ Webhooks are unlimited
- ✅ Motion Sensor sends events immediately (no polling needed)

**Best Practices**:
- ✨ Use webhooks exclusively (don't poll for motion status)
- ✨ Keep webhook endpoint responsive (<5 seconds)
- ✨ Log all events for debugging
- ✨ Test inactivity thresholds per-patient (some move more than others)
- ✨ Adjust escalation times based on patient risk level
- ✨ Place sensors strategically (focus on fall-risk areas)

---

## Advanced Configuration

### Multiple Sensors per Patient

You can register multiple sensors for one patient:

1. Bathroom Sensor → 30 second threshold
2. Bedroom Sensor → 2 hour threshold (sleep)
3. Hallway Sensor → 60 second threshold

Each sensor can have different inactivity settings.

### Time-Based Rules (Future Feature)

Planned: Different thresholds by time of day:
- 8am-10pm: 30 second threshold (active hours)
- 10pm-8am: 2 hour threshold (sleep hours)

### Integration with Health Metrics

Future: Combine motion data with:
- Heart rate (from wearables)
- Sleep patterns
- Activity trends

---

## Security & Privacy

**Data Collected**:
- ✅ Motion detected / not detected (binary)
- ✅ Timestamp of events
- ✅ Device MAC address
- ❌ No video
- ❌ No audio
- ❌ No images

**Data Retention**:
- Motion events: Kept for 90 days
- Alerts: Kept indefinitely (for caregiver records)
- Inactivity monitoring: Kept for 30 days

**Access Control**:
- Patients can view their own data
- Caregivers can view assigned patients' data
- Admins can view all data

---

## Support & Resources

**SwitchBot Resources**:
- Official API Docs: https://github.com/OpenWonderLabs/SwitchBotAPI
- Support: https://support.switch-bot.com

**Para System**:
- Check Edge Function logs in Supabase
- Review database tables for event history
- Contact development team for issues

---

## Quick Reference

### Key URLs

```
SwitchBot API Base: https://api.switch-bot.com/v1.1
Your Webhook URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/switchbot-webhook
n8n Alert Webhook: https://n8n.srv831361.hstgr.cloud/webhook/para-fall-alerts
```

### Important Tables

```
switchbot_devices - Registered sensors
motion_sensor_events - All motion events
inactivity_monitoring - Active monitoring sessions
alerts - Fall detection alerts
```

### Test Commands

```bash
# Check webhook status
curl -X GET "https://api.switch-bot.com/v1.1/webhook/queryWebhook" \
  -H "Authorization: YOUR_TOKEN"

# Test inactivity check manually
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-escalation-timers" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET"

# View recent motion events
SELECT * FROM motion_sensor_events ORDER BY recorded_at DESC LIMIT 10;

# View active monitoring
SELECT * FROM inactivity_monitoring WHERE resolved_at IS NULL;
```

---

**You're all set! The SwitchBot Motion Sensor is now integrated with Para's fall detection system.** 🎉
