# Health Connect Integration - Quick Start Guide

This guide helps you get started with implementing Android Health Connect integration in 30 minutes.

## Prerequisites

- Node.js 18+ installed
- Android Studio installed (latest version)
- An Android device or emulator with Android 9+ (Android 14+ recommended)
- Supabase project setup (you already have this)

## Step 1: Run Database Migration (5 minutes)

1. Open your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20251016000001_health_connect_integration.sql`
4. Paste and run the migration
5. Verify success message appears

**Verify:**
```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('health_metrics', 'health_sync_status', 'health_metric_aggregates');
```

## Step 2: Install Capacitor (10 minutes)

```bash
# Navigate to project directory
cd /workspace/para-kind-connect-local

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor (replace with your app details)
npx cap init "Para Kind Connect" "com.parakind.connect" --web-dir=dist

# Add Android platform
npx cap add android

# Install Health Connect plugin
npm install capacitor-health-connect

# Sync project
npx cap sync android
```

## Step 3: Configure Android Permissions (5 minutes)

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Add Health Connect permissions BEFORE <application> tag -->
    <uses-permission android:name="android.permission.health.READ_HEART_RATE" />
    <uses-permission android:name="android.permission.health.READ_BLOOD_PRESSURE" />
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.health.READ_SLEEP" />
    <uses-permission android:name="android.permission.health.READ_WEIGHT" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application>
        <!-- Your existing configuration -->

        <activity android:name=".MainActivity">
            <!-- Your existing intent filters -->

            <!-- Add Health Connect privacy policy intent filter -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE"/>
                <category android:name="android.intent.category.HEALTH_PERMISSIONS"/>
            </intent-filter>
        </activity>
    </application>

    <!-- Declare Health Connect app -->
    <queries>
        <package android:name="com.google.android.apps.healthdata" />
    </queries>
</manifest>
```

## Step 4: Create Health Connect Service (10 minutes)

Create `src/services/healthConnect/HealthConnectService.ts`:

```typescript
import { CapacitorHealthConnect } from 'capacitor-health-connect';
import { supabase } from '@/integrations/supabase/client';

export class HealthConnectService {
  private static instance: HealthConnectService;

  static getInstance(): HealthConnectService {
    if (!HealthConnectService.instance) {
      HealthConnectService.instance = new HealthConnectService();
    }
    return HealthConnectService.instance;
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const result = await CapacitorHealthConnect.checkAvailability();
      return result.available;
    } catch (error) {
      console.error('Health Connect not available:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<any> {
    const permissions = [
      'android.permission.health.READ_HEART_RATE',
      'android.permission.health.READ_BLOOD_PRESSURE',
      'android.permission.health.READ_STEPS',
      'android.permission.health.READ_SLEEP',
    ];

    return await CapacitorHealthConnect.requestHealthPermissions({
      read: permissions,
    });
  }

  async syncHealthData(userId: string): Promise<any> {
    // Get data from last 24 hours
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endTime = new Date();

    try {
      // Read heart rate
      const heartRateData = await CapacitorHealthConnect.readRecords({
        recordType: 'HeartRate',
        timeRangeFilter: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });

      // Transform and save to Supabase
      const records = heartRateData.records.map((record: any) => ({
        patient_id: userId,
        metric_type: 'heart_rate',
        recorded_at: record.time,
        value_numeric: record.beatsPerMinute,
        unit: 'bpm',
        health_connect_id: record.metadata?.id || `hr-${Date.now()}`,
        data_source: record.metadata?.dataOrigin?.packageName || 'unknown',
        recording_method: 'automatic',
      }));

      if (records.length > 0) {
        const { error } = await supabase
          .from('health_metrics')
          .upsert(records);

        if (error) throw error;
      }

      return { success: true, recordsSynced: records.length };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default HealthConnectService.getInstance();
```

## Step 5: Test on Device

### Build and Run

```bash
# Build the web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### In Android Studio:

1. Connect your Android device (or start emulator)
2. Enable USB debugging on device
3. Click Run (green play button)
4. App will install and launch on device

### Test Health Connect:

```typescript
// In browser console or add to a test button
import HealthConnectService from './services/healthConnect/HealthConnectService';

// Check availability
const available = await HealthConnectService.checkAvailability();
console.log('Available:', available);

// Request permissions
const permissions = await HealthConnectService.requestPermissions();
console.log('Permissions:', permissions);

// Sync data (replace with actual user ID)
const result = await HealthConnectService.syncHealthData('user-id-here');
console.log('Sync result:', result);
```

## Step 6: Add UI Components (Optional)

Create a simple Health Connect settings page:

```tsx
// src/pages/HealthSettings.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import HealthConnectService from '@/services/healthConnect/HealthConnectService';
import { useAuth } from '@/contexts/AuthContext';

export default function HealthSettings() {
  const { user } = useAuth();
  const [status, setStatus] = useState({
    available: false,
    permissionsGranted: false,
  });

  const checkAvailability = async () => {
    const available = await HealthConnectService.checkAvailability();
    setStatus(prev => ({ ...prev, available }));
  };

  const requestPermissions = async () => {
    const result = await HealthConnectService.requestPermissions();
    setStatus(prev => ({
      ...prev,
      permissionsGranted: result.granted.length > 0
    }));
  };

  const syncData = async () => {
    if (!user) return;
    const result = await HealthConnectService.syncHealthData(user.id);
    alert(`Synced ${result.recordsSynced} records`);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Health Connect Settings</h1>

      <Card className="p-4">
        <h2 className="font-semibold mb-2">Status</h2>
        <p>Available: {status.available ? '✓' : '✗'}</p>
        <p>Permissions: {status.permissionsGranted ? '✓' : '✗'}</p>
      </Card>

      <div className="space-y-2">
        <Button onClick={checkAvailability} className="w-full">
          Check Availability
        </Button>
        <Button onClick={requestPermissions} className="w-full">
          Request Permissions
        </Button>
        <Button onClick={syncData} className="w-full">
          Sync Health Data
        </Button>
      </div>
    </div>
  );
}
```

## Troubleshooting

### "Health Connect not available"
- **Android 9-13**: Install Health Connect app from Play Store
- **Android 14+**: Health Connect is built-in, should work automatically
- Check if device has screen lock enabled (required by Health Connect)

### "Permission denied"
- Explain to users why permissions are needed
- Users can manually enable in: Settings > Apps > Health Connect > App permissions

### "No data syncing"
- Make sure test data exists in Health Connect
- Install Google Fit or Samsung Health to populate test data
- Check Supabase logs for errors

### Build errors
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
```

## Next Steps

1. **Add more health metrics**: Extend `syncHealthData()` to include blood pressure, steps, sleep
2. **Background sync**: Implement WorkManager for automatic syncing
3. **Dashboard integration**: Display health data on caregiver dashboard
4. **Alerts**: Implement threshold-based alerts
5. **Testing**: Test with real health data from wearables

## Quick Reference Commands

```bash
# Development workflow
npm run dev              # Start web dev server
npm run build           # Build for production
npx cap sync android    # Sync web assets to Android
npx cap open android    # Open in Android Studio

# Database
# Run migrations in Supabase SQL Editor

# Testing
npx cap run android     # Build and run on device
```

## Resources

- [Full Design Document](./HEALTH_CONNECT_INTEGRATION_DESIGN.md)
- [Executive Summary](./HEALTH_CONNECT_SUMMARY.md)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Health Connect Docs](https://developer.android.com/health-and-fitness/guides/health-connect)
- [Plugin Docs](https://github.com/ubie-oss/capacitor-health-connect)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the full design document for detailed explanations
3. Check plugin GitHub issues
4. Review Android Studio logcat for detailed error messages

---

**Time to first working prototype: ~30-45 minutes**

Good luck! 🚀
