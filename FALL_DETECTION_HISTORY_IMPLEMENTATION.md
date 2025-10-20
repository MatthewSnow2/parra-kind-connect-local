# Adding Fall Detection Events to History Logs

## Current State

**What Exists:**
- ✅ `activity_log` table (with activity types like 'alert_sent', 'alert_acknowledged')
- ✅ `HistoryView` page (currently shows `daily_summaries` only)
- ✅ Fall detection creates `alerts` in database
- ❌ Fall detection does NOT log to `activity_log`
- ❌ Fall detection does NOT appear in HistoryView

**What You Want:**
- Simple fall detection events in history: "Fall detection triggered → responded → cleared"

---

## Implementation Options

### Option 1: Add to activity_log + Show in HistoryView (Recommended)

**Changes Required:**
1. Update `create-fall-alert` Edge Function to log to `activity_log`
2. Expand `activity_log` activity types to include fall detection events
3. Update `HistoryView` to show activity_log entries alongside daily_summaries

**Time Estimate:** 2-3 hours

---

### Option 2: Show Alerts in HistoryView (Simpler)

**Changes Required:**
1. Update `HistoryView` to fetch and display recent alerts
2. No Edge Function changes needed

**Time Estimate:** 1 hour

---

## Recommended Implementation (Option 1)

### Step 1: Expand activity_log Activity Types

**File:** `supabase/migrations/20251020_add_fall_detection_activity_types.sql`

```sql
-- Drop existing CHECK constraint
ALTER TABLE public.activity_log
DROP CONSTRAINT IF EXISTS activity_log_activity_type_check;

-- Add new CHECK constraint with fall detection types
ALTER TABLE public.activity_log
ADD CONSTRAINT activity_log_activity_type_check
CHECK (activity_type IN (
  'login',
  'logout',
  'profile_update',
  'check_in',
  'alert_sent',
  'alert_acknowledged',
  'note_created',
  'settings_changed',
  'export_data',
  -- NEW: Fall Detection Types
  'fall_detection_triggered',
  'fall_detection_patient_responded',
  'fall_detection_caregiver_notified',
  'fall_detection_cleared',
  'fall_detection_false_alarm'
));
```

### Step 2: Update create-fall-alert Edge Function

**File:** `supabase/functions/create-fall-alert/index.ts`

Add activity logging after creating the alert:

```typescript
// After line 93: console.log("Alert created:", alert.id);

// Log to activity_log
await supabase.from("activity_log").insert({
  user_id: patient.id,
  activity_type: "fall_detection_triggered",
  activity_description: `Fall detection alert: ${message || 'No movement detected'}`,
  activity_metadata: {
    alert_id: alert.id,
    location: location,
    severity: "medium",
    alert_type: "prolonged_inactivity",
  },
});

console.log("Activity logged: fall_detection_triggered");
```

### Step 3: Add Activity Logging When Patient Responds

**Option A: Manual Response (from Dashboard)**

Create a new function or update existing alert acknowledgement:

```typescript
// When patient clicks "I'm OK" button
async function acknowledgeAlert(alertId: string) {
  // Update alert status
  await supabase
    .from("alerts")
    .update({ status: "resolved" })
    .eq("id", alertId);

  // Log activity
  await supabase
    .from("activity_log")
    .insert({
      user_id: currentUser.id,
      activity_type: "fall_detection_patient_responded",
      activity_description: "Patient confirmed they are okay",
      activity_metadata: { alert_id: alertId },
    });
}
```

**Option B: WhatsApp Response (from webhook)**

In your future `whatsapp-webhook` function:

```typescript
// When patient replies to WhatsApp check-in
await supabase.from("activity_log").insert({
  user_id: patient.id,
  activity_type: "fall_detection_patient_responded",
  activity_description: `Patient responded: "${transcript}"`,
  activity_metadata: {
    alert_id: alertId,
    response_method: "whatsapp_voice",
  },
});
```

### Step 4: Log When Caregiver is Notified

**File:** `supabase/functions/send-whatsapp-notification/index.ts`

After line 786 (when WhatsApp/Telegram sent successfully):

```typescript
// After successful notification
if (recipientType === "caregiver" && result.whatsappSent) {
  await supabase.from("activity_log").insert({
    user_id: alert.patient_id, // Log under patient's activity
    activity_type: "fall_detection_caregiver_notified",
    activity_description: `Escalation alert sent to caregiver`,
    activity_metadata: {
      alert_id: alertId,
      notification_channels: {
        email: result.emailSent,
        whatsapp: result.whatsappSent,
      },
    },
  });
}
```

### Step 5: Update HistoryView to Show Fall Detection Events

**File:** `src/pages/HistoryView.tsx`

Add a second query to fetch activity_log entries:

```typescript
// After line 56 (daily summaries query)

// Fetch activity log entries
const { data: activityLogs } = useQuery({
  queryKey: ["activity-logs", patientId, timePeriod],
  queryFn: async () => {
    if (!patientId) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timePeriod);

    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", patientId)
      .in("activity_type", [
        "fall_detection_triggered",
        "fall_detection_patient_responded",
        "fall_detection_caregiver_notified",
        "fall_detection_cleared",
        "fall_detection_false_alarm",
      ])
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
  enabled: !!patientId,
});
```

### Step 6: Display Fall Detection Events in Timeline

Update the `HistoryDetailModal` or create a new section in `HistoryView`:

```typescript
// In HistoryDetailModal component
const fallDetectionEvents = activityLogs?.filter(log =>
  log.activity_type.startsWith("fall_detection_")
);

// Render in modal
<div className="space-y-3">
  <h3 className="font-semibold text-lg">Fall Detection Events</h3>
  {fallDetectionEvents?.map((event) => (
    <div key={event.id} className="border-l-4 border-yellow-500 pl-4 py-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {formatEventType(event.activity_type)}
        </span>
        <span className="text-sm text-muted-foreground">
          {new Date(event.created_at).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {event.activity_description}
      </p>
    </div>
  ))}
</div>

// Helper function
function formatEventType(activityType: string): string {
  const types = {
    fall_detection_triggered: "⚠️ Fall Detection Triggered",
    fall_detection_patient_responded: "✅ Patient Responded",
    fall_detection_caregiver_notified: "📱 Caregiver Notified",
    fall_detection_cleared: "✅ Cleared",
    fall_detection_false_alarm: "ℹ️ False Alarm",
  };
  return types[activityType] || activityType;
}
```

---

## Alternative: Simpler Implementation (Just Show Alerts)

If you want something quicker, just show alerts in HistoryView without activity_log:

### Quick Implementation (30 minutes)

**File:** `src/pages/HistoryView.tsx`

```typescript
// Add alert query
const { data: alerts } = useQuery({
  queryKey: ["alerts", patientId, timePeriod],
  queryFn: async () => {
    if (!patientId) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timePeriod);

    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("patient_id", patientId)
      .eq("alert_type", "prolonged_inactivity")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
  enabled: !!patientId,
});

// Display in HistoryDetailModal
<div className="mt-4">
  <h3 className="font-semibold text-lg mb-2">Fall Detection Alerts</h3>
  {alerts?.filter(a => {
    const alertDate = new Date(a.created_at).toLocaleDateString();
    return alertDate === selectedEntry?.date;
  }).map((alert) => (
    <div key={alert.id} className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-2">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium">Fall Detection Alert</span>
          <p className="text-sm text-muted-foreground">{alert.alert_message}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${
          alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
          alert.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {alert.status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {new Date(alert.created_at).toLocaleString()}
      </p>
    </div>
  ))}
</div>
```

---

## Visual Mockup

```
┌────────────────────────────────────────────────────────────┐
│  Independent History - October 20, 2025                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Daily Summary:                                            │
│  • 3 check-ins completed                                   │
│  • Overall mood: Happy                                     │
│  • Status: All good                                        │
│                                                            │
│  ─────────────────────────────────────────────────────     │
│                                                            │
│  Fall Detection Events:                                    │
│                                                            │
│  ⚠️  2:30 PM - Fall Detection Triggered                   │
│      No movement detected in Living Room for 30 seconds   │
│                                                            │
│  ✅  2:31 PM - Patient Responded                          │
│      Patient confirmed they are okay                       │
│                                                            │
│  ✅  2:31 PM - Cleared                                     │
│      Alert resolved - false alarm                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Time Breakdown

| Task | Time | Priority |
|------|------|----------|
| Database migration (add activity types) | 15 min | High |
| Update create-fall-alert function | 30 min | High |
| Add response logging | 30 min | Medium |
| Update HistoryView query | 30 min | High |
| Update HistoryDetailModal UI | 45 min | Medium |
| Testing | 30 min | High |
| **TOTAL** | **3 hours** | |

**Simplified version (just show alerts):** 1 hour

---

## Recommendation

Given your 12-hour window:

### If You Have 3 Hours:
✅ Implement full activity_log integration
- More professional
- Better audit trail
- Shows complete fall detection lifecycle

### If You Have 1 Hour:
✅ Implement simplified alert display
- Still shows fall detection in history
- Less code changes
- Lower risk of bugs

### If You Have 30 Minutes:
✅ Just add a comment in code showing where you'd add it
- Include this document in your submission
- Shows architectural thinking
- Demonstrates planning skills

---

## Which Would You Prefer?

1. **Full implementation (3 hours)** - Complete activity logging
2. **Quick implementation (1 hour)** - Just display alerts
3. **Documentation only (30 min)** - Show you've thought it through

Let me know and I can start implementing!
