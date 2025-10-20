# Parra - Intelligent Elderly Care Monitoring

**Because we care, because we're Parra.**

---

## 🎯 Project Overview

**Parra** (originally conceived as **CareConnect AI**) is a family-centered caregiving platform designed for elderly independent living and adults with disabilities. Built as a capstone project demonstrating full-stack development capabilities while solving a real-world problem: keeping elderly loved ones safe and independent at home.

### The Problem

Family members caring for aging parents live with constant anxiety: *Is mom okay right now? Did dad take his medications? Did grandma fall and nobody knows?*

**The Reality**: Most care happens in the **162 hours between professional visits**. Current solutions all fail:
- Medical alert buttons don't get pressed in time
- Video cameras destroy dignity
- Apps are too complex
- Wearables get forgotten or lost
- 24/7 professional care costs $100,000+/year

### The Solution

Parra uses **existing technology** (smartphones, WhatsApp, voice assistants) to provide:
- ✅ **Automatic fall detection** with mmWave presence sensors
- ✅ **Multi-channel notifications** (Email, Telegram, WhatsApp)
- ✅ **Real-time caregiver dashboard** with traffic light status
- ✅ **Voice-first accessibility** (no apps to learn)
- ✅ **Privacy-first** (no cameras, presence detection only)

---

## 🚀 Live Demo

**Dashboard**: [https://xoygyimwkmepwjqmnfxh.supabase.co](https://xoygyimwkmepwjqmnfxh.supabase.co)

**Demo Credentials**:
- Caregiver: (Request access)
- Patient: (Request access)

---

## ✨ Features

### Implemented (MVP)
- ✅ **Fall Detection**: Aqara FP2 mmWave sensor detects prolonged inactivity (30+ seconds)
- ✅ **Multi-Channel Alerts**: Email (Resend), Telegram (Bot), WhatsApp (Evolution API)
- ✅ **Caregiver Dashboard**: Real-time alerts, device status, patient history
- ✅ **Home Assistant Integration**: Automation with Raspberry Pi
- ✅ **Database Backend**: PostgreSQL with Supabase (RLS enabled)
- ✅ **Edge Functions**: Deno serverless for notifications
- ✅ **Alert Management**: Create, acknowledge, resolve, mark false alarms

### Planned Enhancements
- ⏳ Automatic caregiver escalation (10-minute timer)
- ⏳ Voice check-ins via Alexa integration
- ⏳ Pattern recognition (unusual activity detection)
- ⏳ Health metrics integration (heart rate, BP from wearables)
- ⏳ Mobile app for caregivers

---

## 🛠️ Tech Stack

### Frontend
- **React** 18 with TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **shadcn/ui** (component library)
- **React Query** (data fetching)

### Backend
- **Supabase**
  - PostgreSQL database
  - Edge Functions (Deno)
  - Row-Level Security (RLS)
  - Realtime subscriptions
- **Resend** (email API)
- **Telegram Bot API** (messaging)
- **Evolution API** (WhatsApp gateway)

### Hardware & Automation
- **Raspberry Pi 4** (Home Assistant host)
- **Home Assistant** (automation platform)
- **Aqara Hub M2** (Zigbee hub)
- **Aqara FP2** (mmWave presence sensor)
- **SwitchBot Motion** (PIR sensors)

### Development Tools
- **Claude Code** (AI pair programming)
- **Lovable.dev** (initial prototyping)
- **Git** + GitHub (version control)
- **npm** (package management)

---

## 📁 Project Structure

```
parra-kind-connect-local/
├── src/                          # React frontend source
│   ├── components/              # Reusable UI components
│   ├── pages/                   # Route pages (Dashboard, History, etc.)
│   ├── integrations/supabase/  # Supabase client & types
│   └── lib/                     # Utilities
├── supabase/
│   ├── functions/               # Edge Functions (Deno)
│   │   ├── create-fall-alert/
│   │   ├── send-whatsapp-notification/
│   │   └── switchbot-webhook/
│   └── migrations/              # Database migrations
├── public/                      # Static assets
├── docs/                        # Documentation
├── PARRA_WELCOME_MANUAL.md     # User guide (comprehensive)
├── PARRA_BUILD_JOURNEY.md      # Development story (every challenge)
├── GITHUB_SECURITY_AUDIT.md    # Security review
└── README.md                    # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/MatthewSnow2/parra-kind-connect-local.git
cd parra-kind-connect-local
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL="your-project-url"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

### 4. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:5173

---

## 🔧 Supabase Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Copy project URL and anon key to `.env`

### 2. Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push
```

### 3. Deploy Edge Functions
```bash
# Deploy all functions
npx supabase functions deploy create-fall-alert
npx supabase functions deploy send-whatsapp-notification
npx supabase functions deploy switchbot-webhook
```

### 4. Set Environment Secrets
```bash
npx supabase secrets set RESEND_API_KEY="your-resend-key"
npx supabase secrets set TELEGRAM_BOT_TOKEN="your-bot-token"
npx supabase secrets set TELEGRAM_CHAT_ID="your-chat-id"
npx supabase secrets set EVOLUTION_BASE_URL="your-evolution-url"
npx supabase secrets set EVOLUTION_API_KEY="your-evolution-key"
npx supabase secrets set EVOLUTION_INSTANCE_NAME="your-instance-name"
```

---

## 🏠 Home Assistant Setup

### 1. Install Home Assistant
```bash
# On Raspberry Pi (Recommended)
# Download: https://www.home-assistant.io/installation/raspberrypi
# Flash to SD card, boot Pi
```

### 2. Add Aqara FP2 Sensor
1. Open Aqara app → Add FP2 to HomeKit
2. Home Assistant → Settings → Devices → Add Integration
3. Select "HomeKit"
4. Scan QR code on FP2 sensor
5. Sensor appears as `binary_sensor.presence_sensor_fp2_*`

### 3. Configure REST Command
Edit `configuration.yaml`:
```yaml
rest_command:
  parra_fall_alert:
    url: https://your-project.supabase.co/functions/v1/create-fall-alert
    method: POST
    headers:
      Content-Type: application/json
    payload: >
      {
        "patient_email": "patient@example.com",
        "patient_phone": "+15550100",
        "location": "{{ location }}",
        "message": "No movement detected for 30 seconds"
      }
```

### 4. Create Automation
```yaml
alias: Parra Fall Detection
trigger:
  - platform: state
    entity_id: binary_sensor.presence_sensor_fp2_*
    to: "off"
    for:
      seconds: 30
action:
  - service: rest_command.parra_fall_alert
    data:
      location: "{{ trigger.to_state.attributes.friendly_name if trigger.to_state is defined else 'Home' }}"
```

---

## 📖 Documentation

- **[PARRA_WELCOME_MANUAL.md](./PARRA_WELCOME_MANUAL.md)** - Complete user guide (features, setup, troubleshooting)
- **[PARRA_BUILD_JOURNEY.md](./PARRA_BUILD_JOURNEY.md)** - Full development story (every challenge, solution, lesson)
- **[GITHUB_SECURITY_AUDIT.md](./GITHUB_SECURITY_AUDIT.md)** - Security review before public release
- **[docs/](./docs/)** - Additional technical documentation

---

## 🎥 Video Walkthrough

**For Judges**: A comprehensive video walkthrough covering:
- Every problem faced during development
- How each was solved (or not)
- What would be done differently if restarting
- Live demo of end-to-end flow

*(Video link to be added)*

---

## 🧪 Testing

### Manual Testing
```bash
# Test notification flow
./test-notification.sh

# Check database constraints
psql $DATABASE_URL -f test_constraints.sql
```

### End-to-End Test
1. Place FP2 sensor in drawer (blocks presence)
2. Wait 30 seconds
3. Verify all three notifications received:
   - ✅ Email (check inbox)
   - ✅ Telegram (check bot chat)
   - ✅ WhatsApp (check phone)
4. Check dashboard shows new alert

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend (Supabase)
Already hosted! Edge Functions deploy via:
```bash
npx supabase functions deploy
```

### Home Assistant
Runs on Raspberry Pi (always-on local network).

---

## 🔐 Security & Privacy

- ✅ **No service role keys** committed to repo
- ✅ **Environment variables** for all secrets
- ✅ **Row-Level Security** (RLS) enabled on all tables
- ✅ **JWT authentication** (disabled for webhook endpoints)
- ✅ **Data encryption** at rest (AES-256) and in transit (TLS 1.3)
- ✅ **HIPAA-friendly architecture**
- ✅ **No cameras or audio recording** (presence detection only)

See [GITHUB_SECURITY_AUDIT.md](./GITHUB_SECURITY_AUDIT.md) for full security review.

---

## 📊 Database Schema

### Core Tables
- `profiles` - Users (patients, caregivers, admins)
- `care_relationships` - Who cares for whom
- `alerts` - Fall detection events
- `daily_summaries` - AI-generated health summaries
- `health_metrics` - Steps, heart rate, BP, etc.
- `switchbot_devices` - Motion sensors
- `inactivity_monitoring` - Real-time tracking

### Migrations
All migrations in `supabase/migrations/` with proper:
- Foreign key cascades
- Check constraints
- RLS policies
- Indexes

---

## 🤝 Contributing

This is a capstone project for educational purposes. While not actively seeking contributions, feedback and suggestions are welcome!

**If you're building something similar**:
1. Read [PARRA_BUILD_JOURNEY.md](./PARRA_BUILD_JOURNEY.md) - Learn from our mistakes!
2. Check [GITHUB_SECURITY_AUDIT.md](./GITHUB_SECURITY_AUDIT.md) - Avoid security pitfalls
3. Review commit history - See the evolution

---

## 📝 License

MIT License - See [LICENSE](./LICENSE) file for details.

**TL;DR**: Free to use, modify, distribute. Share freely, learn openly.

---

## 🙏 Acknowledgments

**Technologies Used:**
- React ecosystem (React, TypeScript, Vite, Tailwind)
- Supabase (PostgreSQL, Edge Functions, Auth)
- Home Assistant community
- Aqara & SwitchBot hardware
- Resend, Telegram, Evolution API

**Built With:**
- Claude Code (Anthropic) - AI pair programming
- Lovable.dev - Initial prototyping
- Countless hours of debugging
- Determination to solve a real problem

**Special Thanks:**
- Zak - For Evolution API working example
- Home Assistant Community - For sensor integration help
- Every developer who documented their struggles

---

## 📧 Contact

**Matthew Snow**
- GitHub: [@MatthewSnow2](https://github.com/MatthewSnow2)
- Project: [parra-kind-connect-local](https://github.com/MatthewSnow2/parra-kind-connect-local)

---

## Because we care, because we're Parra. 🚀

**Built**: October 2025
**Purpose**: Capstone Project + Real-World Solution
**Mission**: Enable aging adults to live independently at home with dignity

---

*If you're building something and think "I could never do that"—yes, you can. Start small. Expect errors. Debug systematically. Pivot when needed. The magic happens in the messy middle.*
