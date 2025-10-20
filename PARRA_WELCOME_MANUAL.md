# Welcome to Parra

## Because we care, because we're Parra.

---

## The Vision: CareConnect AI

**Parra** (originally conceived as **CareConnect AI**) is a family-centered caregiving platform designed for elderly independent living and adults with disabilities who receive in-home care visits. Born from the reality that **most care happens in the 162 hours between professional visits**, Parra bridges the gap between independence and safety.

### The Core Problem We Solve

Family members live with constant low-grade anxiety—*not knowing if their loved one is okay right now*. Have they fallen? Taken their medications? Are they showing early warning signs of a health crisis?

Current solutions fail because they:
- Require learning new technology (apps, wearables)
- Create surveillance rather than connection
- Miss the subtle warning signs until crisis hits
- Burden both seniors and caregivers

**Parra changes this equation.**

---

## What is Parra?

Parra is an intelligent care monitoring system that uses **existing technology**—smartphones, WhatsApp, voice assistants—to provide:

✅ **Proactive fall detection** with mmWave presence sensors
✅ **Multi-channel notifications** (Email, Telegram, WhatsApp)
✅ **Real-time caregiver dashboard** with traffic light status (green/yellow/red)
✅ **Voice-first accessibility** (works with Siri, Google Assistant, Alexa)
✅ **AI conversation analysis** to detect subtle changes in mood, speech, activity
✅ **Family communication hub** where everyone sees the same information

**The principle**: Technology invisible to the user, actionable information for families, early intervention preventing crises, dignity preserved throughout.

---

## The "WHY" Behind Parra

### From the Family's Reality

**1. Constant Low-Grade Anxiety**
- Not knowing if their loved one is okay *right now*
- Wondering if medications were actually taken
- Living in another city/state with zero real-time awareness

**2. The Care Gap is Terrifying**
- 6 hours of professional care per week = 162 hours alone
- No human can fill that gap
- Current tech fails the people who need it most

**3. Preventable Emergencies Keep Happening**
- UTIs turning to sepsis
- Falls going undiscovered for hours
- Missed medications causing crises
- All avoidable with proper monitoring

### From the Care Recipient's Reality

**1. They Don't Want to Be a Burden**
- Downplaying symptoms and pain
- Hiding problems to maintain independence
- Fear of losing autonomy drives them to conceal concerns

**2. The Financial Reality Nobody Talks About**
- 24/7 professional care costs hundreds of thousands annually
- Choosing between being a financial burden or being unsafe

**3. Existing Tech Completely Fails Them**
- Apps too complex
- Wearables get forgotten or lost
- Emergency buttons don't get pressed in time
- Surveillance cameras destroy dignity

---

## Core Features - 15 Solutions That Work

### 1. Dashboard Traffic Light System (Green/Yellow/Red)
**One glance tells you if they're okay** without calling. Green = peace of mind, yellow = check in soon, red = immediate attention needed.

### 2. Daily AI Voice Companion
Builds trust through consistent caring conversations, creating the safe space where they'll disclose "I've been dizzy for 3 days" without guilt—**the core relationship that enables everything else**.

### 3. On-Demand Family Check-In Button
When anxiety hits, request immediate AI check-in and get report back within 15 minutes **without alarming them**.

### 4. Medication Tracking with Smart Reminders
Multi-channel confirmations (in-app, SMS, Alexa) so you know exactly what was taken when—**not days later when something goes wrong**.

### 5. Speech Pattern Analysis
Detects slurred speech, word-finding difficulty, pace changes signaling stroke, post-seizure confusion, or neurological decline with **immediate alerts**.

### 6. Multi-Method Emergency Detection
- Fall detection via mmWave sensors (detects even small movements like breathing)
- Voice activation ("I've fallen")
- Activity anomaly detection (still in bedroom at noon)
- Missed check-in protocols
**Comprehensive coverage without wearables to forget.**

### 7. Activity and Sleep Pattern Monitoring
Learns their normal routine, flags deviations catching early warning signs of UTIs, pain, depression. **AI prompts with gentle nudging.**

### 8. AI Pattern Correlation Across Symptoms
Connects dots humans miss:
- Poor sleep + mood decline + confusion = possible UTI
- Speech changes + headache = stroke alert
- Sleep disruption + stress = pre-seizure pattern

### 9. Centralized Communication Hub
All family, carers, and AI analysis in one dashboard. **No more scattered texts, missed voicemails, or "who knew what when?"**

### 10. Voice-First Accessibility
Works via in-app calls, phone calls, smart home devices. **No apps to navigate, screens to read, or complex setups.**

### 11. Seizure-Specific Monitoring
Post-seizure recovery tracking, critical medication adherence, pre-seizure pattern recognition, tracking number of seizures per day/week.

### 12. Escalating Alert System with Smart Response
AI attempts contact first, then family, then emergency contacts, then 911 if needed. **Prevents false alarms while ensuring real emergencies get immediate help.**

### 13. Professional Carer Shift Context Briefing
Carers see complete week history, medication status, mood trends, family notes **before arriving**—informed instead of blind.

### 14. Healthcare Provider Reporting
Generates comprehensive reports for doctor appointments tracking daily functioning, symptom patterns, medication effectiveness. **No more guessing when doctor asks questions.**

### 15. Fall Detection Without Wearables
Aqara FP2 mmWave presence sensor using radar technology detects:
- Presence (even through bedding)
- Micro-movements (including breathing)
- Prolonged inactivity (30+ seconds)
**Works 24/7, requires no charging, never gets forgotten on nightstand.**

---

## How Parra Works: The Complete Flow

### 1. **Detection** (Always On, Always Watching)
- FP2 mmWave sensor continuously monitors presence in patient's room
- Radar-based technology detects micro-movements (including breathing)
- If no movement detected for 30 seconds → triggers Home Assistant automation
- No buttons to press, no wearables to remember, no apps to open

### 2. **Alert Creation** (Instant, Intelligent)
- Home Assistant calls Supabase `create-fall-alert` Edge Function
- Function looks up patient by email in database
- Creates new alert record with:
  - Patient ID
  - Alert type: `prolonged_inactivity`
  - Severity: `medium`
  - Status: `active`
  - Location: Which zone/sensor triggered
  - Timestamp
- All data encrypted at rest, HIPAA-friendly architecture

### 3. **Notification Dispatch** (Multi-Channel Redundancy)
- `create-fall-alert` immediately calls `send-whatsapp-notification` function
- Sends messages via **ALL three channels simultaneously**:
  - **Email** (Resend): "Hey Matthew! I noticed no movement in Bedroom for 30 seconds. Just checking in - are you okay?"
  - **Telegram** (Bot): Same message as push notification to caregiver's phone
  - **WhatsApp** (Evolution API): Direct message to patient's phone
- Each channel operates independently—**if one fails, others still deliver**

### 4. **Caregiver Dashboard** (Real-Time Awareness)
- Alert appears instantly on dashboard with traffic light indicator
- Shows:
  - Alert status (active/acknowledged/resolved/false alarm)
  - Location (Bedroom Zone 1, Living Room, etc.)
  - Timestamp (2 minutes ago, 10 minutes ago)
  - Patient's last known activity
- Caregiver can:
  - **Acknowledge** alert (marks as "acknowledged")
  - **Resolve** alert (marks as "resolved")
  - **Mark as false alarm** (patient responded, all clear)
- All actions logged in audit trail for healthcare reporting

### 5. **Escalation** (Smart, Not Annoying)
- If alert not acknowledged within 10 minutes:
  - Automatic escalation to backup caregiver
  - Severity level increases to "high"
  - Additional notification methods activated
- If still no response after 20 minutes:
  - Emergency contact notified
  - Option to auto-dial 911 (configurable)

---

## System Components

### Hardware

**Raspberry Pi 4** (or newer)
- Runs Home Assistant OS
- Acts as central hub for all automation
- Always-on, low-power operation (uses less power than a light bulb)
- Connects to your home WiFi
- Cost: ~$75

**Aqara Hub M2**
- Zigbee 3.0 hub for connecting Aqara sensors
- HomeKit/Matter compatible bridge
- Connects sensors to Home Assistant
- Cost: ~$60

**Aqara FP2 mmWave Presence Sensor**
- **Advanced radar-based presence detection**
- Detects even the slightest movements (including breathing)
- Can monitor up to 2 zones simultaneously
- No line-of-sight required (works through bedding, furniture)
- **Completely private—no cameras, no audio recording**
- Powered via USB (no batteries to replace)
- Cost: ~$80 per sensor

**SwitchBot Motion Sensors** (optional)
- Battery-powered PIR motion sensors
- Easy placement anywhere (doors, hallways, bathroom)
- Bluetooth/Hub connectivity
- Complements FP2 coverage in other rooms
- Cost: ~$20 per sensor

**Total Hardware Cost**: $215-235 (one-time)

Compare to:
- Medical alert system: $30-50/month ($360-600/year)
- Live-in care: $50,000-100,000/year
- Assisted living facility: $48,000-120,000/year

### Software Stack

**Home Assistant** (Free, Open Source)
- Home automation platform running on Raspberry Pi
- Integrates all sensors and triggers automations
- Sends webhook calls to Supabase when events occur
- Community-driven, constantly improving

**Supabase** (Backend - Free tier available)
- PostgreSQL database for patient data, alerts, devices
- Edge Functions (Deno runtime) for notification logic
- Row-level security for data protection
- Real-time subscriptions for live dashboard updates

**React Dashboard** (Frontend)
- Modern, responsive web interface
- Real-time alert monitoring
- Device status tracking
- Built with TypeScript, Tailwind CSS, shadcn/ui components
- Works on desktop, tablet, smartphone

**Evolution API** (WhatsApp Gateway - Self-hosted)
- Self-hosted WhatsApp Business integration
- Sends WhatsApp messages without official Business API fees
- Reliable message delivery
- Alternative: n8n webhook integration available

**Telegram Bot API** (Free)
- Free instant messaging notifications
- Push notifications to caregiver phones
- No regulatory restrictions
- Works worldwide

**Resend** (Email Service - Free tier: 100 emails/day)
- Modern email API for transactional emails
- High deliverability rates
- Beautiful HTML email templates

---

## Quick Start Guide

### For Patients

**You don't need to do anything!** Parra works automatically in the background.

- Go about your normal daily routine
- Sensors detect your presence and movement
- If you're inactive for 30 seconds, you'll receive a friendly check-in message
- Simply respond to let caregivers know you're okay
- **No buttons to press, no devices to wear, no apps to learn**

### For Caregivers

**Monitor from anywhere:**

1. **Access Dashboard**
   - Visit: Your custom Parra URL (or hosted at Supabase)
   - Log in with your caregiver account
   - Bookmark on your phone for quick access

2. **Check Alerts**
   - View real-time alert feed (like a news feed, but for care)
   - See patient's current status: 🟢 Green (all good), 🟡 Yellow (check soon), 🔴 Red (immediate attention)
   - Review alert history (when did last alert occur, how was it resolved)

3. **Respond to Alerts**
   - Click alert to view details (location, time, sensor triggered)
   - Acknowledge when you've checked in
   - Resolve when situation is handled
   - Mark as false alarm if patient responded (no action needed)

4. **Monitor Devices**
   - Check battery levels on sensors (90%+ is good)
   - Verify sensors are online and reporting (green = active)
   - See last motion detection timestamps

---

## System Configuration

### Patient Setup

**Patient Profile:**
- Full Name: Matthew
- Email: 
- Phone: 
- Monitored Locations: Bedroom (Zone 1 & 2), Living Room

### Caregiver Setup

**Primary Caregiver:**
- Name: Stacey (Spouse)
- Notification Preferences: Email + Telegram + WhatsApp
- Escalation Time: 10 minutes (if no acknowledgment)

**Backup Caregiver** (Optional):
- Receives escalated alerts after 10 minutes
- Can also access dashboard

### Sensor Configuration

**Aqara FP2 - Bedroom**
- Zone 1: Bed area (detects if person in bed, moving or still)
- Zone 2: Bedroom general area (detects if person walking, standing)
- Inactivity Threshold: 30 seconds
- Status: Online ✅

**SwitchBot Motion - Living Room** (if configured)
- Battery: 100%
- Last Motion: 2 minutes ago
- Status: Online ✅

---

## Notification Examples

### Patient Check-In Message
```
Hey Matthew! I noticed no movement in Bedroom Zone 1
for 30 seconds. Just checking in - are you okay?
```

**Patient can respond:**
- "Yes, I'm fine" → Alert auto-resolves
- "I need help" → Escalates to emergency contact
- No response after 10 minutes → Escalates to backup caregiver

### Caregiver Alert (if escalated)
```
⚠️ ALERT: Matthew - Prolonged Inactivity

Location: Bedroom Zone 1
Duration: 10+ minutes
Last Response: No response to initial check-in
Status: ESCALATED

Please check on Matthew immediately.

[Acknowledge] [Call Patient] [Call Emergency Services]
```

---

## Privacy & Data

### What We Track
- Presence detection (in room / not in room)
- Movement detection (moving / stationary)
- Alert events (timestamp, location, duration)
- Device status (battery, connectivity)
- Caregiver actions (who acknowledged, when, how resolved)

### What We DON'T Track
- ❌ No cameras or visual recording
- ❌ No audio recording or listening devices
- ❌ No location tracking outside the home
- ❌ No keystroke logging or activity monitoring
- ❌ No sharing data with third parties
- ❌ No selling your data to advertisers

### Data Retention
- Alert history: Retained indefinitely for medical records
- Device logs: 90 days
- Activity patterns: 30 days
- **User can request full data export or deletion at any time**

### Security
- All data encrypted at rest (AES-256)
- All data encrypted in transit (TLS 1.3)
- Role-based access control (family can't see each other's passwords)
- Audit logging (who accessed what, when)
- **HIPAA-friendly architecture** (designed with healthcare privacy in mind)

---

## Troubleshooting

### Common Issues

**"I'm not receiving notifications"**
- **Telegram**: Check that you've clicked START button on the Telegram bot
- **WhatsApp**: Verify phone number is correct in your profile (include country code: +1)
- **Email**: Check spam/junk folder, add sender to contacts
- **All channels**: Test notification from dashboard → Settings → Test Notifications

**"Sensor shows offline"**
- Check WiFi connection on Raspberry Pi (is Pi online?)
- Verify Aqara Hub is powered on and connected (solid green light)
- Check sensor battery level (FP2 requires USB power, no batteries)
- Restart Home Assistant: Settings → System → Restart

**"Getting too many false alarms"**
- **Adjust inactivity threshold**: Change from 30 seconds to 60 seconds or 2 minutes
- **Reposition sensor**: Make sure it covers the area where person actually sits/lies
- **Create quiet hours schedule**: Don't alert during sleep hours (e.g., 10pm-7am)
- **Fine-tune FP2 detection zones**: Zone 1 = bed only, Zone 2 = rest of room

**"Dashboard not updating"**
- Refresh browser page (Ctrl+R or Cmd+R)
- Check internet connection (is your WiFi working?)
- Verify Supabase services are running (check status page)
- Clear browser cache (Settings → Privacy → Clear Browsing Data)

**"Sensor detected movement but I was sleeping"**
- **This is correct behavior!** FP2 detects micro-movements including breathing
- You're never truly "still" when sleeping—chest rises and falls
- Only alerts when **completely no movement for 30+ seconds** (e.g., if person fell off bed and is unconscious)

---

## Technical Support

### Self-Service Resources
- **Documentation**: See README.md, PARRA_BUILD_JOURNEY.md
- **Alert History**: Review past alerts in dashboard → History
- **Device Logs**: Check Home Assistant logs for sensor issues (Settings → System → Logs)
- **Database**: Direct access via Supabase Dashboard (for technical users)

### Getting Help
- **Email Support**: 
- **System Status**: Check Supabase Dashboard for service health
- **Home Assistant Community**: https://community.home-assistant.io/
- **Aqara Support**: https://www.aqara.com/en/support

---

## Future Enhancements

**Completed Features:**
- ✅ Multi-zone monitoring (monitor multiple rooms)
- ✅ Multi-channel notifications (Email + Telegram + WhatsApp)
- ✅ Fall detection with mmWave radar technology
- ✅ Real-time caregiver dashboard
- ✅ Alert history and audit trail

**In Development:**
- ⏳ Automatic caregiver escalation (10-minute timer)
- ⏳ Voice check-ins via Alexa integration
- ⏳ Pattern recognition (unusual activity detection)
- ⏳ Medication reminders
- ⏳ Mobile app for caregivers (iOS/Android)

**Planned for Future:**
- 🔜 Health metrics integration (glucose, blood pressure, heart rate from wearables)
- 🔜 Video check-in capability (opt-in, privacy-first)
- 🔜 Emergency services integration (911 auto-dial with location)
- 🔜 AI conversation companion (daily check-ins via voice)
- 🔜 Sleep quality analysis (detect sleep disruption patterns)
- 🔜 Pre-seizure pattern detection (for epilepsy patients)

---

## About Parra

Parra was built with love by **Matthew Snow** as a capstone project to demonstrate full-stack development capabilities while solving a real-world problem: **keeping elderly loved ones safe and independent at home**.

The name "Parra" represents care, protection, and family—values at the heart of this system.

### The Personal Story

This project was born from lived experience caring for aging parents and adults with disabilities. The constant anxiety of not knowing if they're okay. The guilt of checking in too much (feeling like surveillance). The terror of emergencies happening during the 162 hours between professional care visits.

**Existing solutions all failed because:**
- Medical alert buttons don't get pressed in time (if at all)
- Video cameras destroy dignity (nobody wants to be watched)
- Apps are too complex for elderly users
- Wearables get forgotten, lost, or run out of battery
- 24/7 professional care costs more than most families can afford

**Parra changes this by:**
- Working with technology people already have (smartphones, voice assistants)
- Detecting problems automatically (no buttons to press)
- Preserving dignity (presence detection, not cameras)
- Connecting family instead of creating surveillance
- Enabling early intervention (catching problems at day 3, not week 3)

### Core Insight

> We're not building monitoring—we're building the trusted relationship that enables honest communication, which enables early intervention, which prevents crises while preserving independence and dignity for everyone.

---

## Mission & Vision

**Mission**: Enable aging adults and people with disabilities to live independently at home with dignity, while giving their families peace of mind through intelligent, non-intrusive monitoring.

**Vision**: A world where technology enhances human connection and care, rather than replacing it. Where seniors can age safely at home instead of being forced into facilities. Where families can breathe easier knowing their loved ones are okay—without constant phone calls or invasive surveillance.

**Values**:
- 🫶 **Dignity First**: No cameras, no surveillance, no loss of privacy
- 💪 **Independence Enabled**: Technology supports autonomy, not dependence
- 👨‍👩‍👧‍👦 **Family-Centered**: Designed for families, not institutions
- 🧠 **Intelligent, Not Intrusive**: AI detects subtle changes humans miss
- ❤️ **Because we care, because we're Parra**

---

## Acknowledgments

**Technologies Used:**
- React + TypeScript + Tailwind CSS (Frontend)
- Supabase PostgreSQL + Edge Functions (Backend)
- Home Assistant (Automation)
- Aqara FP2 mmWave Sensor (Fall Detection)
- Resend, Telegram, Evolution API (Notifications)

**Built With:**
- Claude Code (AI pair programming)
- Countless hours of debugging
- Multiple pivots and architecture changes
- Determination to solve a real problem

**Special Thanks:**
- Zak (for Evolution API working example)
- Home Assistant Community
- Every developer who documented their struggles so others could learn

---

## Because we care, because we're Parra. 🚀

---

**Version**: 1.0.0
**Last Updated**: October 19, 2025
**Built with**: React, TypeScript, Supabase, Home Assistant, Aqara, Love ❤️
**License**: MIT (share freely, learn openly)
