# WhatsApp Integration with n8n - Implementation Plan

## Overview
Enable seniors to chat with Parra via WhatsApp using n8n workflow automation to bridge WhatsApp messages to the Parra backend.

## Architecture

```
Senior's Phone (WhatsApp)
    ↓
Twilio WhatsApp API / WhatsApp Business Cloud API
    ↓
n8n Workflow (webhook trigger)
    ↓
Parra API Endpoint (Supabase Edge Function)
    ↓
LLM Processing
    ↓
n8n Workflow
    ↓
Twilio/WhatsApp API
    ↓
Senior's Phone (WhatsApp)
```

## Option 1: Twilio WhatsApp API (Recommended for Start)

### Pros:
- Easy setup and testing
- Good documentation
- Free sandbox for development
- Pay-as-you-go pricing

### Cons:
- Requires business verification for production
- $0.005-0.08 per message depending on country
- Message templates required for business-initiated conversations

### Setup Steps:

1. **Create Twilio Account**
   - Sign up at https://www.twilio.com
   - Get WhatsApp sandbox number for testing
   - Note credentials: Account SID, Auth Token, WhatsApp number

2. **Configure Twilio Webhook**
   - In Twilio Console → WhatsApp Sandbox Settings
   - Set webhook URL to: `https://your-n8n-instance.com/webhook/whatsapp-parra`
   - Method: POST

## Option 2: WhatsApp Business Cloud API (Recommended for Scale)

### Pros:
- Free (only pay for business-initiated conversations)
- Direct integration with Meta
- Better features and reliability

### Cons:
- More complex setup
- Requires Facebook Business account
- Stricter verification process

### Setup Steps:

1. **Create Meta Business Account**
   - Go to https://business.facebook.com
   - Create business account
   - Add WhatsApp product

2. **Get API Credentials**
   - Phone Number ID
   - WhatsApp Business Account ID
   - Access Token

## n8n Workflow Setup

### Prerequisites:
- n8n instance running (self-hosted or cloud: https://n8n.io)
- Access to n8n workflow editor
- Webhook URL from n8n

### Workflow Design

```
[Webhook Node] → [Parse WhatsApp Message] → [Call Parra API] → [Format Response] → [Send WhatsApp Reply]
```

### Detailed n8n Workflow

#### 1. Webhook Trigger Node
```json
{
  "name": "WhatsApp Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "whatsapp-parra",
    "method": "POST",
    "responseMode": "responseNode",
    "options": {}
  }
}
```

#### 2. Function Node: Parse Incoming Message
```javascript
// Extract message data from Twilio webhook
const body = $input.item.json.body;

return {
  json: {
    from: body.From.replace('whatsapp:', ''), // +1234567890
    to: body.To.replace('whatsapp:', ''),
    message: body.Body,
    messageId: body.MessageSid,
    timestamp: new Date().toISOString()
  }
};
```

#### 3. HTTP Request Node: Call Parra API
```json
{
  "name": "Send to Parra LLM",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://xoygyimwkmepwjqmnfxh.supabase.co/functions/v1/whatsapp-chat",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "supabaseApi",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"phone_number\": \"{{$json.from}}\",\n  \"message\": \"{{$json.message}}\",\n  \"platform\": \"whatsapp\"\n}",
    "options": {}
  }
}
```

#### 4. Function Node: Format Response
```javascript
// Format response for WhatsApp
const parraResponse = $input.item.json.response;
const phoneNumber = $input.item.json.phone_number;

return {
  json: {
    to: phoneNumber,
    message: parraResponse,
    // Twilio formatting
    Body: parraResponse,
    From: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
    To: `whatsapp:${phoneNumber}`
  }
};
```

#### 5. HTTP Request Node: Send WhatsApp Reply (Twilio)
```json
{
  "name": "Send WhatsApp Reply",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.twilio.com/2010-04-01/Accounts/{{$credentials.accountSid}}/Messages.json",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpBasicAuth",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "From",
          "value": "={{$json.From}}"
        },
        {
          "name": "To",
          "value": "={{$json.To}}"
        },
        {
          "name": "Body",
          "value": "={{$json.Body}}"
        }
      ]
    }
  }
}
```

#### 6. Respond to Webhook Node
```json
{
  "name": "Respond to Webhook",
  "type": "n8n-nodes-base.respondToWebhook",
  "parameters": {
    "respondWith": "text",
    "responseBody": "Message processed"
  }
}
```

## Parra Backend - WhatsApp Endpoint

Create new Supabase Edge Function:

```typescript
// supabase/functions/whatsapp-chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { phone_number, message, platform } = await req.json();

    // 1. Find or create user profile by phone number
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (!profile) {
      // Create anonymous profile for new WhatsApp user
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          phone_number,
          full_name: `WhatsApp User ${phone_number.slice(-4)}`,
          role: 'senior',
          display_name: `WhatsApp User`,
        })
        .select()
        .single();

      profile = newProfile;
    }

    // 2. Get conversation history
    const { data: recentMessages } = await supabase
      .from('check_ins')
      .select('messages')
      .eq('patient_id', profile.id)
      .eq('interaction_type', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const conversationHistory = recentMessages?.messages || [];

    // 3. Call LLM with message + history
    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are Parra, a friendly AI companion for seniors. Be warm, patient, and helpful.'
          },
          ...conversationHistory,
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150, // Keep WhatsApp messages concise
      }),
    });

    const llmData = await llmResponse.json();
    const response = llmData.choices[0].message.content;

    // 4. Save conversation to database
    const updatedMessages = [
      ...conversationHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response, timestamp: new Date().toISOString() }
    ];

    await supabase
      .from('check_ins')
      .insert({
        patient_id: profile.id,
        interaction_type: 'whatsapp',
        started_at: new Date().toISOString(),
        messages: updatedMessages,
      });

    // 5. Return response to n8n
    return new Response(
      JSON.stringify({
        response,
        phone_number,
        user_id: profile.id,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('WhatsApp chat error:', error);
    return new Response(
      JSON.stringify({
        response: "I'm sorry, I'm having trouble right now. Please try again later.",
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

## Database Schema Updates

Add WhatsApp interaction type to check_ins table:

```sql
-- Update check_ins table to support WhatsApp
ALTER TABLE public.check_ins
ALTER COLUMN interaction_type TYPE TEXT;

-- Update constraint to include 'whatsapp'
ALTER TABLE public.check_ins
DROP CONSTRAINT IF EXISTS check_ins_interaction_type_check;

ALTER TABLE public.check_ins
ADD CONSTRAINT check_ins_interaction_type_check
CHECK (interaction_type IN ('voice', 'text', 'whatsapp', 'scheduled'));
```

## n8n Deployment Options

### Option A: Self-Hosted (Recommended for Control)
```bash
# Docker Compose
version: "3.7"
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_password
      - N8N_HOST=your-domain.com
      - WEBHOOK_URL=https://your-domain.com/
    volumes:
      - ~/.n8n:/home/node/.n8n
```

Deploy on:
- AWS EC2 / Lightsail
- Digital Ocean Droplet
- Heroku
- Your own VPS

### Option B: n8n Cloud (Easiest)
- Sign up at https://n8n.io/cloud
- $20/month starter plan
- Managed hosting, automatic updates
- Built-in SSL certificates

## Cost Analysis

### Twilio WhatsApp (US numbers):
- Incoming message: $0.005
- Outgoing message: $0.01
- 1000 messages/month = $15

### WhatsApp Business Cloud API:
- User-initiated conversations: FREE
- Business-initiated conversations: $0.009-0.05 per conversation (24-hour window)
- 1000 messages/month ≈ $0 (if users initiate)

### n8n:
- Self-hosted: ~$5-20/month (VPS costs)
- n8n Cloud: $20/month

### Total Monthly Cost:
- **Twilio option:** $35-40/month
- **Meta API option:** $20-25/month (mostly n8n hosting)

## Implementation Timeline

### Week 1: Setup & Testing
- Day 1: Create Twilio/Meta accounts
- Day 2: Set up n8n instance
- Day 3: Build n8n workflow
- Day 4: Create Parra WhatsApp endpoint
- Day 5: End-to-end testing
- **Deliverable:** Working WhatsApp bot in sandbox

### Week 2: Production Deployment
- Day 1-2: Apply for WhatsApp Business verification
- Day 3: Configure production webhooks
- Day 4: Database schema updates
- Day 5: Load testing and optimization
- **Deliverable:** Production-ready WhatsApp integration

### Week 3: Features & Monitoring
- Day 1: Add rich message formatting
- Day 2: Add media support (images, audio)
- Day 3: Set up monitoring and alerts
- Day 4: Create admin dashboard for WhatsApp metrics
- Day 5: User testing and bug fixes
- **Deliverable:** Polished WhatsApp experience

## Advanced Features (Future)

1. **Rich Messages:**
   - Send images, voice notes
   - Interactive buttons
   - List messages
   - Location sharing

2. **Conversation Memory:**
   - Long-term memory across sessions
   - Personalized responses
   - Scheduled check-ins via WhatsApp

3. **Multi-lingual Support:**
   - Detect language from message
   - Respond in user's language
   - Translation layer

4. **Emergency Detection:**
   - Detect distress keywords
   - Alert caregivers via SMS/email
   - Auto-escalation to emergency services

## Security & Privacy

1. **Phone Number Verification:**
   - Implement one-time passcode (OTP) verification
   - Link WhatsApp number to existing accounts

2. **Rate Limiting:**
   - Limit messages per phone number (e.g., 50/day)
   - Detect and block spam/abuse

3. **Data Privacy:**
   - Encrypt messages at rest
   - Comply with GDPR/CCPA
   - Clear opt-out mechanism

4. **Content Moderation:**
   - Filter inappropriate content
   - Block offensive messages
   - Human review queue for edge cases

## Testing Checklist

- [ ] Message sent from WhatsApp reaches n8n webhook
- [ ] n8n successfully calls Parra API
- [ ] LLM response is returned to WhatsApp
- [ ] Conversation history is maintained
- [ ] New users are auto-created
- [ ] Error handling works (API failures, timeouts)
- [ ] Rate limiting prevents abuse
- [ ] Messages are logged in database
- [ ] Caregivers can see WhatsApp conversations in dashboard

## Next Steps

1. **Choose Provider:** Twilio (quick start) or Meta API (long-term)
2. **Set up n8n:** Cloud or self-hosted
3. **Create Accounts:** Get API credentials
4. **Build Workflow:** Import n8n workflow template
5. **Deploy Backend:** Create whatsapp-chat edge function
6. **Test:** Send test messages
7. **Go Live:** Switch to production numbers
8. **Monitor:** Track usage and costs

## Resources

- Twilio WhatsApp Docs: https://www.twilio.com/docs/whatsapp
- Meta WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- n8n Documentation: https://docs.n8n.io
- n8n WhatsApp Node: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.whatsapp/
