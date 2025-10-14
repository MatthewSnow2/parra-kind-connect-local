# UI/UX Update Implementation Plan

## Phase 1: Dashboard Redesign (Page 4)
- [ ] Create 2x2 grid layout for Status, Interactions, Mood, Notes
- [ ] Replace current status indicator with simple green circle
- [ ] Update Interactions timeline to show speech bubble icons
- [ ] Update Mood to show single smiley face icon (with image support)
- [ ] Add Notes section with microphone icon and text input
- [ ] Move Analysis section below grid
- [ ] Replace action buttons with large coral "Chat" and "Recap" buttons
- [ ] Remove Navigation component, add custom header

## Phase 2: History Page Redesign (Page 11)
- [ ] Change background to light green (#C9EBC0)
- [ ] Add custom header (parra logo + hamburger)
- [ ] Create date list on left side
- [ ] Add time period selector (7 | 14 | 30 days)
- [ ] Add image display area on right
- [ ] Remove current card-based layout

## Phase 3: History Detail/Popup (Page 12)
- [ ] Create modal/page for individual date details
- [ ] Add date selector with upload icon
- [ ] Create progress bar components for:
  - Status (green circle icon)
  - Mood (smiley icon with happy.jpg/meh.jpg/sad.jpg)
  - Interactions (speech bubble icon)
- [ ] Add Summary section with text lines

## Phase 4: Mood Icons
- [ ] Add happy.jpg, meh.jpg, sad.jpg to assets
- [ ] Update MoodIndicator component to use images
- [ ] Map mood states: happy → happy.jpg, neutral → meh.jpg, sad/concerned → sad.jpg

## Phase 5: Fix Audit Log 404
- [ ] Check admin routes
- [ ] Create or fix /admin/audit-log route
- [ ] Ensure AdminAuditLog component exists

## Phase 6: Voice Chat Planning
**Technical Requirements:**
- Web Speech API (browser-based, free)
- OR OpenAI Whisper API (transcription)
- OR Deepgram API (real-time transcription)
- Text-to-Speech for Parra's responses
- WebRTC for audio streaming

**Architecture:**
1. Frontend: Audio capture → Send to backend
2. Backend: Speech-to-text → LLM → Text-to-speech
3. Frontend: Play audio response

## Phase 7: WhatsApp n8n Integration Planning
**Components Needed:**
- Twilio WhatsApp Business API or WhatsApp Business Cloud API
- n8n workflow automation
- Webhook endpoints in Parra backend
- Message queue for async processing

**Flow:**
1. User sends WhatsApp message → Twilio/WhatsApp webhook
2. n8n receives webhook → Process message
3. n8n calls Parra API endpoint
4. Parra processes with LLM → Returns response
5. n8n sends response back via Twilio/WhatsApp API

## Implementation Order:
1. Fix Audit Log 404 (quick win)
2. Add mood icon images
3. Redesign Dashboard (Page 4)
4. Redesign History Page (Page 11)
5. Create History Detail Modal (Page 12)
6. Document Voice Chat plan
7. Document WhatsApp integration plan
