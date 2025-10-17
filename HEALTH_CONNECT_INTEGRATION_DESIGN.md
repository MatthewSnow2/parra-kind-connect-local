# Android Health Connect Integration - Technical Design Document

**Project:** Para Kind Connect Local
**Document Version:** 1.0
**Date:** October 16, 2025
**Author:** Technical Architecture Team

---

## Executive Summary

This document outlines the comprehensive technical design for integrating Android Health Connect into the Para Kind Connect application to enable automatic synchronization of senior health data. The integration will allow caregivers to monitor vital health metrics (heart rate, blood pressure, steps, sleep, etc.) in real-time through the existing dashboard interface.

### Critical Finding

**Android Health Connect does NOT support web browsers or Progressive Web Apps (PWAs).** The current React web application built with Vite will require a companion native Android application to access Health Connect APIs.

---

## Table of Contents

1. [Android Health Connect Overview](#1-android-health-connect-overview)
2. [Architecture Options Analysis](#2-architecture-options-analysis)
3. [Recommended Architecture](#3-recommended-architecture)
4. [Health Data Types for Senior Care](#4-health-data-types-for-senior-care)
5. [Database Schema Design](#5-database-schema-design)
6. [API Endpoints Design](#6-api-endpoints-design)
7. [Mobile Application Requirements](#7-mobile-application-requirements)
8. [Security & Privacy Considerations](#8-security--privacy-considerations)
9. [Implementation Phases](#9-implementation-phases)
10. [Technical Requirements & Dependencies](#10-technical-requirements--dependencies)
11. [Alternative Solutions](#11-alternative-solutions)
12. [Risk Assessment](#12-risk-assessment)

---

## 1. Android Health Connect Overview

### 1.1 What is Health Connect?

Android Health Connect is a health data platform that provides a unified interface for accessing users' health and fitness data from multiple sources. Starting with Android 14 (API Level 34), Health Connect is integrated into the Android framework.

### 1.2 Key Capabilities

- **50+ Health Data Types** across 6 categories:
  - Activity (steps, exercise, calories, distance)
  - Body Measurements (weight, height, BMI, body fat)
  - Cycle Tracking (menstruation, temperature)
  - Nutrition (hydration, meals)
  - Sleep (sessions, stages, duration)
  - Vitals (heart rate, blood pressure, oxygen saturation, blood glucose)

- **On-Device Storage**: All data is encrypted and stored locally on the device
- **Aggregated Data**: Combines data from multiple health apps
- **Historical Access**: 30-day default history, extended access with special permissions
- **Background Sync**: New 2025 feature for background data reads

### 1.3 Critical Limitations

- **No Web API**: Health Connect APIs are exclusively for native Android applications
- **No PWA Support**: Cannot be accessed from Progressive Web Apps or browser contexts
- **Requires Play Console Approval**: Apps must be approved by Google to access Health Connect data
- **Device Requirements**: Android 9+ (API 28+) for Health Connect app, Android 14+ has it built-in
- **Screen Lock Required**: Device must have PIN/pattern/password enabled

### 1.4 Google Fit API Deprecation

Google Fit APIs (including REST API) will remain available until June 30, 2025. Starting in 2026, Google is transitioning completely to Health Connect. This integration positions the application for the future health data ecosystem on Android.

---

## 2. Architecture Options Analysis

### Option 1: Native Android App with Capacitor Bridge (RECOMMENDED)

**Description**: Build a companion native Android app using Capacitor (Ionic framework) that wraps the existing React web application and provides Health Connect integration.

**Pros:**
- Reuses 95% of existing React codebase
- Single TypeScript/JavaScript codebase for web and mobile logic
- Capacitor provides ready-made plugins for Health Connect
- Can deploy both web app and mobile app from same codebase
- Familiar development experience for React developers
- Access to all native Android capabilities when needed

**Cons:**
- Requires Play Store deployment and approval process
- Adds mobile app build/deployment to CI/CD pipeline
- Small learning curve for Capacitor-specific APIs
- Need to maintain both web and mobile deployment targets

**Complexity:** Medium
**Development Time:** 4-6 weeks
**Ongoing Maintenance:** Low-Medium

### Option 2: React Native with Shared Backend

**Description**: Create a separate React Native mobile application that communicates with the same Supabase backend.

**Pros:**
- Full native mobile capabilities
- Excellent performance
- Large ecosystem of libraries
- Familiar React patterns

**Cons:**
- Requires maintaining two separate frontends
- Cannot reuse existing React web components directly
- More complex code sharing between web and mobile
- Longer development time
- Requires React Native expertise

**Complexity:** High
**Development Time:** 8-12 weeks
**Ongoing Maintenance:** High

### Option 3: Hybrid Approach with WebView Bridge

**Description**: Create a minimal native Android app that uses WebView to display the existing web app, with a custom bridge for Health Connect data.

**Pros:**
- Minimal native code required
- Reuses entire existing web application
- Quick to implement

**Cons:**
- WebView performance limitations
- Complex JavaScript bridge development
- Difficult debugging
- Limited native UI capabilities
- Poor user experience for mobile-first features
- Not recommended by modern mobile development best practices

**Complexity:** Medium-High
**Development Time:** 3-4 weeks
**Ongoing Maintenance:** High (bridge maintenance is complex)

### Option 4: Backend Sync Service

**Description**: Users install a separate lightweight Android app that only syncs Health Connect data to the backend, while they continue to use the web application.

**Pros:**
- Web application remains unchanged
- Clear separation of concerns
- Lightweight native app

**Cons:**
- Poor user experience (two separate apps)
- Users may forget to install sync app
- Complex permission/authentication flow
- Data sync delays
- Limited real-time capabilities

**Complexity:** Medium
**Development Time:** 3-4 weeks
**Ongoing Maintenance:** Medium

---

## 3. Recommended Architecture

### 3.1 Architecture Decision

**Selected Approach: Option 1 - Native Android App with Capacitor Bridge**

This approach provides the best balance of code reuse, development speed, user experience, and maintainability.

### 3.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser (Desktop/Mobile)  │  Android Native App (Capacitor) │
│  - Caregiver Dashboard         │  - Senior Mobile App            │
│  - Admin Panel                 │  - Health Connect Integration   │
│  - Public Pages                │  - Background Sync              │
└───────────────┬────────────────┴─────────────┬──────────────────┘
                │                               │
                │         HTTPS/WSS            │
                │                               │
┌───────────────▼───────────────────────────────▼──────────────────┐
│                    Application Layer (React + TypeScript)         │
├───────────────────────────────────────────────────────────────────┤
│  - Shared React Components                                        │
│  - Supabase Client                                                │
│  - React Query for Data Management                                │
│  - Health Connect Service (Mobile Only)                           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                         Backend Layer                              │
├───────────────────────────────────────────────────────────────────┤
│                        Supabase Backend                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Authentication (Auth.users)                                 │ │
│  │  - JWT Token Management                                      │ │
│  │  - Row Level Security                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                         │ │
│  │  - Profiles, Care Relationships                              │ │
│  │  - Check-ins, Daily Summaries                                │ │
│  │  - Health Metrics (NEW)                                      │ │
│  │  - Health Sync Status (NEW)                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Edge Functions (Future)                                     │ │
│  │  - Health Data Aggregation                                   │ │
│  │  - Alert Processing                                          │ │
│  │  - Trend Analysis                                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Realtime Subscriptions                                      │ │
│  │  - Live Health Metric Updates                                │ │
│  │  - Alert Notifications                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                    External Services Layer                         │
├───────────────────────────────────────────────────────────────────┤
│  Android Health Connect (On-Device)                                │
│  - 50+ Health Data Types                                           │
│  - Encrypted Local Storage                                         │
│  - Multi-App Data Aggregation                                      │
└───────────────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow

#### Scenario 1: Health Data Sync (Background)

```
1. Android Health Connect
   └─> Capacitor Health Connect Plugin
       └─> Health Sync Service (TypeScript)
           └─> Supabase Client
               └─> health_metrics table (PostgreSQL)
                   └─> Realtime Subscription
                       └─> Caregiver Dashboard (Auto-update)
```

#### Scenario 2: Caregiver Views Health Data

```
1. Caregiver Dashboard (Web/Mobile)
   └─> React Query
       └─> Supabase Client
           └─> Query health_metrics table
               └─> Display in UI (Charts, Metrics, Trends)
```

#### Scenario 3: Health Alert Triggered

```
1. Health Sync Service detects anomaly
   └─> Insert into alerts table
       └─> Database Trigger
           └─> Check alert rules
               └─> Supabase Realtime notification
                   └─> Caregiver receives alert (Push/In-app)
```

### 3.4 Technology Stack

**Frontend (Shared):**
- React 18.3+
- TypeScript 5.8+
- Vite 5.4+
- TanStack React Query 5.8+
- Supabase JS Client 2.75+
- Recharts 2.15+ (for health data visualization)

**Mobile Application:**
- Capacitor 6+ (Ionic framework)
- `capacitor-health-connect` plugin (by ubie-oss) v0.7+
- OR `capacitor-health` plugin (by mley) for future iOS support
- Android SDK 28+ (Android 9+)

**Backend:**
- Supabase (PostgreSQL 15+)
- Row Level Security (RLS) policies
- Realtime subscriptions
- Supabase Edge Functions (for complex processing)

**Development Tools:**
- Android Studio (for native debugging)
- Xcode (for future iOS development)
- Capacitor CLI

---

## 4. Health Data Types for Senior Care

### 4.1 Priority Health Metrics for Seniors

The following Health Connect data types are most relevant for senior health monitoring:

#### High Priority (Phase 1)

| Data Type | Health Connect Field | Frequency | Clinical Importance |
|-----------|---------------------|-----------|---------------------|
| **Heart Rate** | `HeartRateRecord` | Continuous/Hourly | Critical - AFib detection, cardiovascular health |
| **Blood Pressure** | `BloodPressureRecord` | Daily/Multiple | Critical - Hypertension monitoring |
| **Steps** | `StepsRecord` | Daily | High - Activity level, fall risk |
| **Sleep Duration** | `SleepSessionRecord` | Daily | High - Sleep quality, cognitive health |
| **Weight** | `WeightRecord` | Weekly | High - Nutritional status, fluid retention |
| **Blood Glucose** | `BloodGlucoseRecord` | Variable | Critical - Diabetes management |
| **Oxygen Saturation** | `OxygenSaturationRecord` | As needed | Critical - Respiratory issues |

#### Medium Priority (Phase 2)

| Data Type | Health Connect Field | Frequency | Clinical Importance |
|-----------|---------------------|-----------|---------------------|
| **Heart Rate Variability** | `HeartRateVariabilityRecord` | Daily | Medium - Stress, autonomic function |
| **Respiratory Rate** | `RespiratoryRateRecord` | Daily | Medium - Respiratory health |
| **Body Temperature** | `BodyTemperatureRecord` | As needed | Medium - Infection detection |
| **Hydration** | `HydrationRecord` | Daily | Medium - Dehydration prevention |
| **Distance Walked** | `DistanceRecord` | Daily | Medium - Mobility tracking |
| **Floors Climbed** | `FloorsClimbedRecord` | Daily | Medium - Activity level |
| **Active Calories** | `ActiveCaloriesBurnedRecord` | Daily | Medium - Energy expenditure |

#### Low Priority (Phase 3)

| Data Type | Health Connect Field | Frequency | Clinical Importance |
|-----------|---------------------|-----------|---------------------|
| **Resting Heart Rate** | `RestingHeartRateRecord` | Daily | Low - Fitness indicator |
| **VO2 Max** | `Vo2MaxRecord` | Monthly | Low - Cardio fitness |
| **Sleep Stages** | `SleepStageRecord` | Daily | Low - Sleep quality details |
| **Exercise Sessions** | `ExerciseSessionRecord` | Variable | Low - Activity tracking |
| **Nutrition** | `NutritionRecord` | Daily | Low - Diet monitoring |

### 4.2 Health Connect Data Structures

Example data structures from Health Connect:

```typescript
// Blood Pressure Record
interface BloodPressureRecord {
  systolic: Pressure;      // mmHg
  diastolic: Pressure;     // mmHg
  bodyPosition: string;    // 'sitting', 'standing', 'lying_down'
  measurementLocation: string; // 'left_wrist', 'right_upper_arm'
  time: Instant;
  zoneOffset: ZoneOffset;
  metadata: Metadata;
}

// Heart Rate Record
interface HeartRateRecord {
  beatsPerMinute: number;
  time: Instant;
  zoneOffset: ZoneOffset;
  metadata: Metadata;
}

// Steps Record
interface StepsRecord {
  count: number;
  startTime: Instant;
  endTime: Instant;
  startZoneOffset: ZoneOffset;
  endZoneOffset: ZoneOffset;
  metadata: Metadata;
}

// Sleep Session Record
interface SleepSessionRecord {
  title: string;
  notes: string;
  startTime: Instant;
  endTime: Instant;
  startZoneOffset: ZoneOffset;
  endZoneOffset: ZoneOffset;
  duration: Duration;      // Calculated
  stages: SleepStageRecord[];
  metadata: Metadata;
}

// Metadata (included in all records)
interface Metadata {
  id: string;              // Unique Health Connect ID
  dataOrigin: DataOrigin;  // Source app
  lastModifiedTime: Instant;
  clientRecordId: string;
  clientRecordVersion: number;
  device: Device;
  recordingMethod: string; // 'automatic' or 'manual'
}
```

### 4.3 Alert Thresholds for Seniors

Define clinical thresholds that trigger alerts:

| Metric | Normal Range | Warning Threshold | Critical Threshold |
|--------|--------------|-------------------|-------------------|
| Blood Pressure (Systolic) | 110-130 mmHg | >140 or <100 | >180 or <90 |
| Blood Pressure (Diastolic) | 70-85 mmHg | >90 or <60 | >110 or <50 |
| Heart Rate (Resting) | 60-100 bpm | >100 or <50 | >120 or <40 |
| Oxygen Saturation | >95% | 90-95% | <90% |
| Blood Glucose (Fasting) | 70-100 mg/dL | >125 or <70 | >180 or <54 |
| Steps (Daily) | >3000 | <2000 | <500 |
| Sleep Duration | 7-9 hours | <6 or >10 hours | <4 hours |
| Weight Change | Stable | ±5 lbs/week | ±10 lbs/week |

---

## 5. Database Schema Design

### 5.1 New Tables

#### Table: `health_metrics`

Primary table for storing all health data synchronized from Health Connect.

```sql
-- =====================================================
-- HEALTH METRICS TABLE
-- Stores all health data synced from Android Health Connect
-- =====================================================
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User reference
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Metric identification
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'heart_rate', 'blood_pressure', 'blood_glucose', 'oxygen_saturation',
    'steps', 'distance', 'floors_climbed', 'active_calories', 'total_calories',
    'weight', 'height', 'body_temperature', 'respiratory_rate',
    'sleep_session', 'sleep_stage', 'heart_rate_variability',
    'hydration', 'nutrition', 'exercise_session',
    'resting_heart_rate', 'vo2_max'
  )),

  -- Time information
  recorded_at TIMESTAMPTZ NOT NULL,
  recorded_date DATE NOT NULL GENERATED ALWAYS AS (DATE(recorded_at)) STORED,

  -- Value storage (flexible JSON for different metric types)
  value_numeric DECIMAL(10,2),           -- For single numeric values (heart rate, weight, etc.)
  value_json JSONB,                       -- For complex values (blood pressure, sleep stages)

  -- Units and context
  unit TEXT,                              -- 'bpm', 'mmHg', 'mg/dL', '%', 'steps', 'kg', etc.
  measurement_context TEXT,               -- 'resting', 'active', 'post_exercise', 'fasting'
  body_position TEXT,                     -- For blood pressure: 'sitting', 'standing', 'lying_down'
  measurement_location TEXT,              -- For blood pressure: 'left_wrist', 'right_upper_arm'

  -- Data quality and metadata
  data_source TEXT,                       -- Source app name (e.g., 'Samsung Health', 'Google Fit')
  health_connect_id TEXT,                 -- Original Health Connect record ID
  recording_method TEXT CHECK (recording_method IN ('automatic', 'manual')),
  device_info JSONB,                      -- Device details from Health Connect

  -- Sync tracking
  synced_from_device_at TIMESTAMPTZ,     -- When data was on device
  synced_to_server_at TIMESTAMPTZ DEFAULT NOW(),

  -- Alert flagging
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_reason TEXT,
  alert_generated BOOLEAN DEFAULT false,

  -- Indexing and tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate records
  UNIQUE(patient_id, metric_type, recorded_at, health_connect_id)
);

-- Indexes for performance
CREATE INDEX idx_health_metrics_patient ON public.health_metrics(patient_id);
CREATE INDEX idx_health_metrics_type ON public.health_metrics(metric_type);
CREATE INDEX idx_health_metrics_recorded_at ON public.health_metrics(recorded_at DESC);
CREATE INDEX idx_health_metrics_recorded_date ON public.health_metrics(recorded_date DESC);
CREATE INDEX idx_health_metrics_patient_type_date ON public.health_metrics(patient_id, metric_type, recorded_date);
CREATE INDEX idx_health_metrics_anomaly ON public.health_metrics(is_anomaly) WHERE is_anomaly = true;

-- Composite index for common queries
CREATE INDEX idx_health_metrics_patient_recent ON public.health_metrics(patient_id, metric_type, recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own health metrics"
  ON public.health_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own health metrics"
  ON public.health_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Caregivers can view their patients' health metrics"
  ON public.health_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE patient_id = health_metrics.patient_id
      AND caregiver_id = auth.uid()
      AND status = 'active'
      AND can_view_health_data = true
    )
  );

-- Comments
COMMENT ON TABLE public.health_metrics IS 'Stores health data synced from Android Health Connect';
COMMENT ON COLUMN public.health_metrics.value_numeric IS 'Single numeric value (heart rate: 72, weight: 75.5)';
COMMENT ON COLUMN public.health_metrics.value_json IS 'Complex values like blood_pressure: {"systolic": 120, "diastolic": 80}';
```

#### Table: `health_sync_status`

Track synchronization status and history for each user's device.

```sql
-- =====================================================
-- HEALTH SYNC STATUS TABLE
-- Tracks sync status for each patient's Android device
-- =====================================================
CREATE TABLE IF NOT EXISTS public.health_sync_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User and device identification
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,                -- Unique device identifier
  device_name TEXT,                       -- User-friendly device name

  -- Health Connect status
  health_connect_available BOOLEAN DEFAULT true,
  health_connect_version TEXT,

  -- Sync configuration
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 60,
  background_sync_enabled BOOLEAN DEFAULT true,

  -- Enabled metric types
  enabled_metrics TEXT[] DEFAULT ARRAY[
    'heart_rate', 'blood_pressure', 'blood_glucose', 'oxygen_saturation',
    'steps', 'weight', 'sleep_session'
  ],

  -- Sync status
  last_successful_sync_at TIMESTAMPTZ,
  last_sync_attempt_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed', 'never')),
  last_sync_error TEXT,
  consecutive_failures INTEGER DEFAULT 0,

  -- Statistics
  total_syncs INTEGER DEFAULT 0,
  total_records_synced INTEGER DEFAULT 0,
  last_records_count INTEGER DEFAULT 0,

  -- Permissions
  permissions_granted TEXT[],             -- Array of granted Health Connect permissions
  permissions_denied TEXT[],
  last_permission_request_at TIMESTAMPTZ,

  -- Battery optimization
  battery_optimization_disabled BOOLEAN,  -- Critical for background sync

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One sync status per patient-device combination
  UNIQUE(patient_id, device_id)
);

-- Indexes
CREATE INDEX idx_health_sync_patient ON public.health_sync_status(patient_id);
CREATE INDEX idx_health_sync_enabled ON public.health_sync_status(sync_enabled) WHERE sync_enabled = true;
CREATE INDEX idx_health_sync_last_sync ON public.health_sync_status(last_successful_sync_at DESC);

-- RLS Policies
ALTER TABLE public.health_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own sync status"
  ON public.health_sync_status FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can manage their own sync status"
  ON public.health_sync_status FOR ALL
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Caregivers can view their patients' sync status"
  ON public.health_sync_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE patient_id = health_sync_status.patient_id
      AND caregiver_id = auth.uid()
      AND status = 'active'
    )
  );

-- Comments
COMMENT ON TABLE public.health_sync_status IS 'Tracks Health Connect sync status for each patient device';
```

#### Table: `health_metric_aggregates`

Pre-computed daily/weekly aggregates for fast dashboard loading.

```sql
-- =====================================================
-- HEALTH METRIC AGGREGATES TABLE
-- Pre-computed aggregates for fast dashboard queries
-- =====================================================
CREATE TABLE IF NOT EXISTS public.health_metric_aggregates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User and time
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL,
  aggregation_period TEXT NOT NULL CHECK (aggregation_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Aggregate statistics
  count INTEGER DEFAULT 0,                -- Number of measurements
  min_value DECIMAL(10,2),
  max_value DECIMAL(10,2),
  avg_value DECIMAL(10,2),
  sum_value DECIMAL(10,2),                -- For metrics like steps, calories
  median_value DECIMAL(10,2),
  std_dev DECIMAL(10,2),

  -- Complex aggregates (stored as JSON)
  percentiles JSONB,                      -- p25, p50, p75, p90, p95
  time_in_range JSONB,                    -- For metrics with target ranges
  distribution JSONB,                     -- Histogram data

  -- Trend indicators
  trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable', 'volatile')),
  trend_percentage DECIMAL(5,2),          -- % change from previous period

  -- Alert indicators
  anomaly_count INTEGER DEFAULT 0,
  alert_count INTEGER DEFAULT 0,

  -- Metadata
  data_quality_score DECIMAL(3,2),        -- 0-1 score based on data completeness
  missing_data_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(patient_id, metric_type, aggregation_period, period_start)
);

-- Indexes
CREATE INDEX idx_health_aggregates_patient ON public.health_metric_aggregates(patient_id);
CREATE INDEX idx_health_aggregates_type ON public.health_metric_aggregates(metric_type);
CREATE INDEX idx_health_aggregates_period ON public.health_metric_aggregates(aggregation_period, period_start DESC);
CREATE INDEX idx_health_aggregates_composite ON public.health_metric_aggregates(
  patient_id, metric_type, aggregation_period, period_start DESC
);

-- RLS Policies
ALTER TABLE public.health_metric_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own aggregates"
  ON public.health_metric_aggregates FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Caregivers can view their patients' aggregates"
  ON public.health_metric_aggregates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE patient_id = health_metric_aggregates.patient_id
      AND caregiver_id = auth.uid()
      AND status = 'active'
      AND can_view_health_data = true
    )
  );

-- Comments
COMMENT ON TABLE public.health_metric_aggregates IS 'Pre-computed health metric aggregates for dashboard performance';
```

### 5.2 Schema Updates to Existing Tables

#### Update `daily_summaries` table

Add health metric summary fields:

```sql
-- Add health metric columns to daily_summaries
ALTER TABLE public.daily_summaries
ADD COLUMN IF NOT EXISTS health_metrics_synced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS health_metrics_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS avg_systolic_bp INTEGER,
ADD COLUMN IF NOT EXISTS avg_diastolic_bp INTEGER,
ADD COLUMN IF NOT EXISTS total_steps INTEGER,
ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS health_data_completeness DECIMAL(3,2); -- 0-1 score

COMMENT ON COLUMN public.daily_summaries.health_data_completeness IS 'Percentage of expected health metrics received for the day (0.0-1.0)';
```

#### Update `alerts` table

Add health metric alert types:

```sql
-- Add health-related alert types
ALTER TABLE public.alerts
DROP CONSTRAINT IF EXISTS alerts_alert_type_check;

ALTER TABLE public.alerts
ADD CONSTRAINT alerts_alert_type_check
CHECK (alert_type IN (
  'fall_detected', 'distress_signal', 'missed_checkin', 'medication_missed',
  'prolonged_inactivity', 'health_concern', 'manual',
  -- New health metric alerts
  'high_blood_pressure', 'low_blood_pressure', 'high_heart_rate', 'low_heart_rate',
  'low_oxygen_saturation', 'high_blood_glucose', 'low_blood_glucose',
  'insufficient_steps', 'insufficient_sleep', 'rapid_weight_change',
  'health_sync_failure', 'missing_health_data'
));

-- Add reference to health metric
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS health_metric_id UUID REFERENCES public.health_metrics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_health_metric ON public.alerts(health_metric_id);
```

#### Update `profiles` table

Add Health Connect preferences:

```sql
-- Add Health Connect settings to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS health_connect_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS health_connect_device_id TEXT,
ADD COLUMN IF NOT EXISTS health_alert_preferences JSONB DEFAULT '{
  "enabled": true,
  "email_alerts": true,
  "push_alerts": true,
  "quiet_hours": {"start": "22:00", "end": "07:00"},
  "thresholds": {
    "blood_pressure_systolic_high": 140,
    "blood_pressure_systolic_critical": 180,
    "blood_pressure_diastolic_high": 90,
    "heart_rate_high": 100,
    "heart_rate_low": 50,
    "steps_low": 2000,
    "sleep_hours_low": 6
  }
}'::jsonb;

COMMENT ON COLUMN public.profiles.health_alert_preferences IS 'User-specific alert thresholds and notification preferences';
```

### 5.3 Database Functions

#### Function: Auto-detect anomalies

```sql
-- =====================================================
-- FUNCTION: Detect health metric anomalies
-- =====================================================
CREATE OR REPLACE FUNCTION detect_health_anomaly(
  p_patient_id UUID,
  p_metric_type TEXT,
  p_value_numeric DECIMAL,
  p_value_json JSONB
)
RETURNS TABLE (
  is_anomaly BOOLEAN,
  severity TEXT,
  reason TEXT
) AS $$
DECLARE
  v_thresholds JSONB;
  v_systolic INTEGER;
  v_diastolic INTEGER;
BEGIN
  -- Get user's alert preferences
  SELECT health_alert_preferences
  INTO v_thresholds
  FROM public.profiles
  WHERE id = p_patient_id;

  -- Default to standard thresholds if not set
  IF v_thresholds IS NULL THEN
    v_thresholds := '{
      "thresholds": {
        "blood_pressure_systolic_high": 140,
        "blood_pressure_systolic_critical": 180,
        "blood_pressure_diastolic_high": 90,
        "heart_rate_high": 100,
        "heart_rate_low": 50
      }
    }'::jsonb;
  END IF;

  -- Check thresholds based on metric type
  CASE p_metric_type
    WHEN 'blood_pressure' THEN
      v_systolic := (p_value_json->>'systolic')::INTEGER;
      v_diastolic := (p_value_json->>'diastolic')::INTEGER;

      IF v_systolic >= (v_thresholds->'thresholds'->>'blood_pressure_systolic_critical')::INTEGER THEN
        RETURN QUERY SELECT true, 'critical'::TEXT, 'Systolic BP critically high'::TEXT;
      ELSIF v_systolic >= (v_thresholds->'thresholds'->>'blood_pressure_systolic_high')::INTEGER THEN
        RETURN QUERY SELECT true, 'high'::TEXT, 'Systolic BP elevated'::TEXT;
      ELSIF v_diastolic >= (v_thresholds->'thresholds'->>'blood_pressure_diastolic_high')::INTEGER THEN
        RETURN QUERY SELECT true, 'high'::TEXT, 'Diastolic BP elevated'::TEXT;
      END IF;

    WHEN 'heart_rate' THEN
      IF p_value_numeric >= (v_thresholds->'thresholds'->>'heart_rate_high')::INTEGER THEN
        RETURN QUERY SELECT true, 'medium'::TEXT, 'Heart rate elevated'::TEXT;
      ELSIF p_value_numeric <= (v_thresholds->'thresholds'->>'heart_rate_low')::INTEGER THEN
        RETURN QUERY SELECT true, 'medium'::TEXT, 'Heart rate low'::TEXT;
      END IF;

    WHEN 'oxygen_saturation' THEN
      IF p_value_numeric < 90 THEN
        RETURN QUERY SELECT true, 'critical'::TEXT, 'Oxygen saturation critically low'::TEXT;
      ELSIF p_value_numeric < 95 THEN
        RETURN QUERY SELECT true, 'medium'::TEXT, 'Oxygen saturation low'::TEXT;
      END IF;

    WHEN 'blood_glucose' THEN
      IF p_value_numeric > 180 THEN
        RETURN QUERY SELECT true, 'high'::TEXT, 'Blood glucose very high'::TEXT;
      ELSIF p_value_numeric < 70 THEN
        RETURN QUERY SELECT true, 'high'::TEXT, 'Blood glucose low'::TEXT;
      END IF;

    ELSE
      -- No anomaly detected
      RETURN QUERY SELECT false, 'normal'::TEXT, NULL::TEXT;
  END CASE;

  -- If we reach here, no anomaly detected
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'normal'::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

#### Function: Auto-create alerts from anomalies

```sql
-- =====================================================
-- FUNCTION: Create alert from health anomaly
-- =====================================================
CREATE OR REPLACE FUNCTION create_health_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_anomaly RECORD;
  v_alert_type TEXT;
  v_alert_message TEXT;
  v_caregivers UUID[];
BEGIN
  -- Only proceed if anomaly detected
  IF NOT NEW.is_anomaly THEN
    RETURN NEW;
  END IF;

  -- Map metric type to alert type
  CASE NEW.metric_type
    WHEN 'blood_pressure' THEN
      v_alert_type := 'high_blood_pressure';
      v_alert_message := format('Blood pressure reading: %s/%s mmHg',
        NEW.value_json->>'systolic', NEW.value_json->>'diastolic');
    WHEN 'heart_rate' THEN
      v_alert_type := CASE
        WHEN NEW.value_numeric > 100 THEN 'high_heart_rate'
        ELSE 'low_heart_rate'
      END;
      v_alert_message := format('Heart rate: %s bpm', NEW.value_numeric);
    WHEN 'oxygen_saturation' THEN
      v_alert_type := 'low_oxygen_saturation';
      v_alert_message := format('Oxygen saturation: %s%%', NEW.value_numeric);
    WHEN 'blood_glucose' THEN
      v_alert_type := CASE
        WHEN NEW.value_numeric > 180 THEN 'high_blood_glucose'
        ELSE 'low_blood_glucose'
      END;
      v_alert_message := format('Blood glucose: %s mg/dL', NEW.value_numeric);
    ELSE
      v_alert_type := 'health_concern';
      v_alert_message := format('%s anomaly detected', NEW.metric_type);
  END CASE;

  -- Get list of caregivers to notify
  SELECT ARRAY_AGG(caregiver_id)
  INTO v_caregivers
  FROM public.care_relationships
  WHERE patient_id = NEW.patient_id
  AND status = 'active'
  AND can_receive_alerts = true;

  -- Insert alert
  INSERT INTO public.alerts (
    patient_id,
    alert_type,
    severity,
    alert_message,
    alert_details,
    health_metric_id,
    notified_caregivers
  ) VALUES (
    NEW.patient_id,
    v_alert_type,
    CASE NEW.anomaly_reason
      WHEN 'critically high' THEN 'critical'
      WHEN 'critically low' THEN 'critical'
      ELSE 'high'
    END,
    v_alert_message,
    jsonb_build_object(
      'metric_type', NEW.metric_type,
      'recorded_at', NEW.recorded_at,
      'anomaly_reason', NEW.anomaly_reason,
      'value', COALESCE(NEW.value_json, to_jsonb(NEW.value_numeric))
    ),
    NEW.id,
    v_caregivers
  );

  -- Mark alert as generated
  NEW.alert_generated := true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create alerts
CREATE TRIGGER create_alert_on_health_anomaly
  BEFORE INSERT OR UPDATE ON public.health_metrics
  FOR EACH ROW
  WHEN (NEW.is_anomaly = true AND NEW.alert_generated = false)
  EXECUTE FUNCTION create_health_alert();
```

#### Function: Update aggregates

```sql
-- =====================================================
-- FUNCTION: Update daily aggregates
-- =====================================================
CREATE OR REPLACE FUNCTION update_health_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily aggregate
  INSERT INTO public.health_metric_aggregates (
    patient_id,
    metric_type,
    aggregation_period,
    period_start,
    period_end,
    count,
    min_value,
    max_value,
    avg_value,
    sum_value
  )
  SELECT
    NEW.patient_id,
    NEW.metric_type,
    'daily',
    DATE_TRUNC('day', NEW.recorded_at),
    DATE_TRUNC('day', NEW.recorded_at) + INTERVAL '1 day',
    COUNT(*),
    MIN(value_numeric),
    MAX(value_numeric),
    AVG(value_numeric),
    SUM(value_numeric)
  FROM public.health_metrics
  WHERE patient_id = NEW.patient_id
  AND metric_type = NEW.metric_type
  AND recorded_date = NEW.recorded_date
  GROUP BY patient_id, metric_type
  ON CONFLICT (patient_id, metric_type, aggregation_period, period_start)
  DO UPDATE SET
    count = EXCLUDED.count,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    avg_value = EXCLUDED.avg_value,
    sum_value = EXCLUDED.sum_value,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for aggregate updates
CREATE TRIGGER update_aggregates_on_metric_insert
  AFTER INSERT ON public.health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_health_aggregates();
```

### 5.4 Migration Script

```sql
-- =====================================================
-- COMPLETE MIGRATION SCRIPT
-- Android Health Connect Integration
-- =====================================================

-- Create health_metrics table
-- (See section 5.1 for complete definition)

-- Create health_sync_status table
-- (See section 5.1 for complete definition)

-- Create health_metric_aggregates table
-- (See section 5.1 for complete definition)

-- Update existing tables
-- (See section 5.2 for alterations)

-- Create functions and triggers
-- (See section 5.3 for complete definitions)

-- Update triggers for updated_at
CREATE TRIGGER set_health_metrics_updated_at
  BEFORE UPDATE ON public.health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_health_sync_status_updated_at
  BEFORE UPDATE ON public.health_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_health_aggregates_updated_at
  BEFORE UPDATE ON public.health_metric_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.health_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_sync_status TO authenticated;
GRANT SELECT ON public.health_metric_aggregates TO authenticated;
```

---

## 6. API Endpoints Design

### 6.1 Backend API Endpoints (Supabase)

All API interactions will use Supabase client SDK with automatic authentication and RLS enforcement. No custom backend endpoints are initially required due to Supabase's built-in features.

#### Queries via Supabase Client

```typescript
// Get patient's recent health metrics
const { data, error } = await supabase
  .from('health_metrics')
  .select('*')
  .eq('patient_id', patientId)
  .eq('metric_type', 'heart_rate')
  .gte('recorded_at', startDate)
  .order('recorded_at', { ascending: false })
  .limit(100);

// Get daily aggregates
const { data, error } = await supabase
  .from('health_metric_aggregates')
  .select('*')
  .eq('patient_id', patientId)
  .eq('metric_type', 'blood_pressure')
  .eq('aggregation_period', 'daily')
  .gte('period_start', startDate)
  .order('period_start', { ascending: false });

// Get sync status
const { data, error } = await supabase
  .from('health_sync_status')
  .select('*')
  .eq('patient_id', patientId)
  .single();

// Insert health metrics (bulk)
const { data, error } = await supabase
  .from('health_metrics')
  .insert(healthRecords);
```

### 6.2 Future Edge Functions (Optional)

For complex operations that can't be handled by client-side logic:

#### 1. `analyze-health-trends`

**Purpose**: Analyze health metric trends and generate insights

```typescript
// Edge Function: /functions/analyze-health-trends

interface Request {
  patientId: string;
  metricType: string;
  daysBack: number;
}

interface Response {
  trend: 'improving' | 'stable' | 'declining' | 'concerning';
  insights: string[];
  recommendations: string[];
  chartData: ChartDataPoint[];
}

// Example usage:
POST /functions/v1/analyze-health-trends
{
  "patientId": "uuid",
  "metricType": "blood_pressure",
  "daysBack": 30
}
```

#### 2. `process-health-sync`

**Purpose**: Process bulk health data sync with validation and anomaly detection

```typescript
// Edge Function: /functions/process-health-sync

interface Request {
  patientId: string;
  deviceId: string;
  metrics: HealthMetricInput[];
  syncTimestamp: string;
}

interface Response {
  success: boolean;
  recordsProcessed: number;
  anomaliesDetected: number;
  alertsCreated: number;
  errors: ErrorDetail[];
}
```

#### 3. `generate-health-report`

**Purpose**: Generate comprehensive health reports (PDF/email)

```typescript
// Edge Function: /functions/generate-health-report

interface Request {
  patientId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  includeMetrics: string[];
  format: 'pdf' | 'json';
}

interface Response {
  reportUrl?: string;  // For PDF
  reportData?: object; // For JSON
}
```

### 6.3 Realtime Subscriptions

Subscribe to real-time health metric updates:

```typescript
// Subscribe to new health metrics
const subscription = supabase
  .channel('health-metrics-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'health_metrics',
      filter: `patient_id=eq.${patientId}`
    },
    (payload) => {
      console.log('New health metric:', payload.new);
      // Update UI with new data
    }
  )
  .subscribe();

// Subscribe to health alerts
const alertSubscription = supabase
  .channel('health-alerts')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'alerts',
      filter: `patient_id=eq.${patientId}`
    },
    (payload) => {
      // Show alert notification
      showAlert(payload.new);
    }
  )
  .subscribe();
```

---

## 7. Mobile Application Requirements

### 7.1 Capacitor Setup

#### Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npx cap init "Para Kind Connect" "com.parakind.connect" --web-dir=dist
npx cap add android
```

#### Install Health Connect Plugin

```bash
# Option 1: Ubie OSS plugin (recommended for Android-only)
npm install capacitor-health-connect
npx cap sync

# Option 2: Cross-platform plugin (for future iOS support)
npm install @mley/capacitor-health
npx cap sync
```

### 7.2 Android Configuration

#### `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application>
        <!-- ... existing configuration ... -->

        <!-- Health Connect Permissions -->
        <uses-permission android:name="android.permission.health.READ_HEART_RATE" />
        <uses-permission android:name="android.permission.health.READ_BLOOD_PRESSURE" />
        <uses-permission android:name="android.permission.health.READ_BLOOD_GLUCOSE" />
        <uses-permission android:name="android.permission.health.READ_OXYGEN_SATURATION" />
        <uses-permission android:name="android.permission.health.READ_STEPS" />
        <uses-permission android:name="android.permission.health.READ_DISTANCE" />
        <uses-permission android:name="android.permission.health.READ_WEIGHT" />
        <uses-permission android:name="android.permission.health.READ_HEIGHT" />
        <uses-permission android:name="android.permission.health.READ_BODY_TEMPERATURE" />
        <uses-permission android:name="android.permission.health.READ_SLEEP" />
        <uses-permission android:name="android.permission.health.READ_RESPIRATORY_RATE" />
        <uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY" />
        <uses-permission android:name="android.permission.health.READ_HYDRATION" />

        <!-- Background read permission (Android 15+) -->
        <uses-permission android:name="android.permission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND" />

        <!-- Historical data access (30+ days) -->
        <uses-permission android:name="android.permission.PERMISSION_READ_HEALTH_DATA_HISTORY" />

        <!-- Internet for syncing to backend -->
        <uses-permission android:name="android.permission.INTERNET" />
        <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

        <!-- Background sync -->
        <uses-permission android:name="android.permission.WAKE_LOCK" />
        <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

        <!-- Privacy Policy Intent Filter (Required by Health Connect) -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <!-- ... existing intent filters ... -->

            <!-- Health Connect privacy policy requirement -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE"/>
                <category android:name="android.intent.category.HEALTH_PERMISSIONS"/>
            </intent-filter>
        </activity>

        <!-- Background Sync Service -->
        <service
            android:name=".HealthSyncService"
            android:enabled="true"
            android:exported="false">
        </service>

        <!-- Boot receiver for starting background sync -->
        <receiver
            android:name=".BootReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED"/>
            </intent-filter>
        </receiver>
    </application>

    <!-- Minimum SDK versions -->
    <uses-sdk android:minSdkVersion="28" android:targetSdkVersion="34" />

    <!-- Declare app uses Health Connect -->
    <queries>
        <package android:name="com.google.android.apps.healthdata" />
    </queries>
</manifest>
```

#### `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.parakind.connect"
        minSdkVersion 28
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
}

dependencies {
    // Health Connect SDK
    implementation "androidx.health.connect:connect-client:1.1.0-alpha08"

    // Existing Capacitor dependencies
    implementation project(':capacitor-android')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"

    // WorkManager for background sync
    implementation "androidx.work:work-runtime-ktx:2.9.0"
}
```

### 7.3 TypeScript Service Layer

#### `src/services/healthConnect/HealthConnectService.ts`

```typescript
import { CapacitorHealthConnect } from 'capacitor-health-connect';
import { supabase } from '@/integrations/supabase/client';

export interface HealthMetricRecord {
  metricType: string;
  recordedAt: string;
  valueNumeric?: number;
  valueJson?: any;
  unit?: string;
  dataSource?: string;
  healthConnectId: string;
  recordingMethod: 'automatic' | 'manual';
  deviceInfo?: any;
}

export class HealthConnectService {
  private static instance: HealthConnectService;
  private isInitialized = false;
  private syncInProgress = false;

  private constructor() {}

  static getInstance(): HealthConnectService {
    if (!HealthConnectService.instance) {
      HealthConnectService.instance = new HealthConnectService();
    }
    return HealthConnectService.instance;
  }

  /**
   * Check if Health Connect is available on device
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const result = await CapacitorHealthConnect.checkAvailability();
      return result.available;
    } catch (error) {
      console.error('Health Connect not available:', error);
      return false;
    }
  }

  /**
   * Request all required Health Connect permissions
   */
  async requestPermissions(): Promise<{
    granted: string[];
    denied: string[];
  }> {
    const permissions = [
      'android.permission.health.READ_HEART_RATE',
      'android.permission.health.READ_BLOOD_PRESSURE',
      'android.permission.health.READ_BLOOD_GLUCOSE',
      'android.permission.health.READ_OXYGEN_SATURATION',
      'android.permission.health.READ_STEPS',
      'android.permission.health.READ_DISTANCE',
      'android.permission.health.READ_WEIGHT',
      'android.permission.health.READ_SLEEP',
      'android.permission.health.READ_BODY_TEMPERATURE',
      'android.permission.health.READ_RESPIRATORY_RATE',
      'android.permission.health.READ_HEART_RATE_VARIABILITY',
      'android.permission.health.READ_HYDRATION',
    ];

    try {
      const result = await CapacitorHealthConnect.requestHealthPermissions({
        read: permissions,
      });

      // Update sync status in database
      await this.updateSyncStatus({
        permissionsGranted: result.granted,
        permissionsDenied: result.denied,
        lastPermissionRequestAt: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }

  /**
   * Initialize Health Connect integration
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      throw new Error('Health Connect is not available on this device');
    }

    // Create or update sync status record
    const deviceId = await this.getDeviceId();
    await supabase.from('health_sync_status').upsert({
      patient_id: userId,
      device_id: deviceId,
      health_connect_available: true,
      sync_enabled: true,
      last_sync_attempt_at: new Date().toISOString(),
    });

    this.isInitialized = true;
  }

  /**
   * Sync health data from Health Connect to Supabase
   */
  async syncHealthData(userId: string): Promise<{
    success: boolean;
    recordsSynced: number;
    errors: string[];
  }> {
    if (this.syncInProgress) {
      return { success: false, recordsSynced: 0, errors: ['Sync already in progress'] };
    }

    this.syncInProgress = true;
    const errors: string[] = [];
    let recordsSynced = 0;

    try {
      // Get last successful sync time
      const lastSync = await this.getLastSyncTime(userId);
      const startTime = lastSync || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours default
      const endTime = new Date();

      // Sync each metric type
      const metricTypes = [
        { type: 'heart_rate', readMethod: 'readHeartRate' },
        { type: 'blood_pressure', readMethod: 'readBloodPressure' },
        { type: 'steps', readMethod: 'readSteps' },
        { type: 'sleep_session', readMethod: 'readSleep' },
        { type: 'blood_glucose', readMethod: 'readBloodGlucose' },
        { type: 'oxygen_saturation', readMethod: 'readOxygenSaturation' },
        { type: 'weight', readMethod: 'readWeight' },
      ];

      for (const metric of metricTypes) {
        try {
          const records = await this.readHealthConnectData(
            metric.readMethod,
            startTime,
            endTime
          );

          if (records.length > 0) {
            const transformed = this.transformHealthConnectRecords(
              records,
              metric.type,
              userId
            );

            const { error } = await supabase
              .from('health_metrics')
              .upsert(transformed, { onConflict: 'patient_id,metric_type,recorded_at,health_connect_id' });

            if (error) {
              errors.push(`Error syncing ${metric.type}: ${error.message}`);
            } else {
              recordsSynced += transformed.length;
            }
          }
        } catch (error) {
          errors.push(`Error reading ${metric.type}: ${error.message}`);
        }
      }

      // Update sync status
      await this.updateSyncStatus({
        lastSuccessfulSyncAt: new Date().toISOString(),
        lastSyncStatus: errors.length === 0 ? 'success' : 'partial',
        lastRecordsCount: recordsSynced,
        totalRecordsSynced: recordsSynced,
        lastSyncError: errors.length > 0 ? errors.join('; ') : null,
        consecutiveFailures: errors.length === 0 ? 0 : undefined,
      });

      return {
        success: errors.length === 0,
        recordsSynced,
        errors,
      };
    } catch (error) {
      console.error('Sync error:', error);
      await this.updateSyncStatus({
        lastSyncStatus: 'failed',
        lastSyncError: error.message,
        consecutiveFailures: 1,
      });

      return {
        success: false,
        recordsSynced,
        errors: [error.message],
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Read data from Health Connect
   */
  private async readHealthConnectData(
    method: string,
    startTime: Date,
    endTime: Date
  ): Promise<any[]> {
    try {
      const result = await CapacitorHealthConnect[method]({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      return result.records || [];
    } catch (error) {
      console.error(`Error reading ${method}:`, error);
      return [];
    }
  }

  /**
   * Transform Health Connect records to database format
   */
  private transformHealthConnectRecords(
    records: any[],
    metricType: string,
    userId: string
  ): HealthMetricRecord[] {
    return records.map(record => {
      const base = {
        patient_id: userId,
        metric_type: metricType,
        recorded_at: record.time || record.startTime,
        health_connect_id: record.metadata?.id || `${metricType}-${Date.now()}`,
        data_source: record.metadata?.dataOrigin?.packageName || 'unknown',
        recording_method: record.metadata?.recordingMethod || 'automatic',
        device_info: record.metadata?.device,
        synced_from_device_at: new Date().toISOString(),
      };

      // Handle metric-specific transformations
      switch (metricType) {
        case 'blood_pressure':
          return {
            ...base,
            value_json: {
              systolic: record.systolic?.inMillimetersOfMercury,
              diastolic: record.diastolic?.inMillimetersOfMercury,
            },
            unit: 'mmHg',
            body_position: record.bodyPosition,
            measurement_location: record.measurementLocation,
          };

        case 'heart_rate':
          return {
            ...base,
            value_numeric: record.beatsPerMinute,
            unit: 'bpm',
          };

        case 'steps':
          return {
            ...base,
            value_numeric: record.count,
            unit: 'steps',
          };

        case 'weight':
          return {
            ...base,
            value_numeric: record.weight?.inKilograms,
            unit: 'kg',
          };

        case 'blood_glucose':
          return {
            ...base,
            value_numeric: record.level?.inMilligramsPerDeciliter,
            unit: 'mg/dL',
            measurement_context: record.specimenSource,
          };

        case 'oxygen_saturation':
          return {
            ...base,
            value_numeric: record.percentage?.value,
            unit: '%',
          };

        case 'sleep_session':
          return {
            ...base,
            value_json: {
              duration_minutes: Math.floor(
                (new Date(record.endTime) - new Date(record.startTime)) / 60000
              ),
              start_time: record.startTime,
              end_time: record.endTime,
              title: record.title,
              notes: record.notes,
            },
            unit: 'minutes',
          };

        default:
          return base;
      }
    });
  }

  /**
   * Get last successful sync time
   */
  private async getLastSyncTime(userId: string): Promise<Date | null> {
    const { data } = await supabase
      .from('health_sync_status')
      .select('last_successful_sync_at')
      .eq('patient_id', userId)
      .single();

    return data?.last_successful_sync_at ? new Date(data.last_successful_sync_at) : null;
  }

  /**
   * Update sync status in database
   */
  private async updateSyncStatus(updates: Partial<any>): Promise<void> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const deviceId = await this.getDeviceId();

    await supabase
      .from('health_sync_status')
      .upsert({
        patient_id: session.session.user.id,
        device_id: deviceId,
        last_sync_attempt_at: new Date().toISOString(),
        ...updates,
      });
  }

  /**
   * Get unique device ID
   */
  private async getDeviceId(): Promise<string> {
    // In production, use Capacitor Device plugin
    // For now, generate/store in localStorage
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `device-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Setup background sync (Android WorkManager)
   */
  async setupBackgroundSync(intervalMinutes: number = 60): Promise<void> {
    // This would call native code to setup WorkManager
    // Implementation depends on chosen plugin
    console.log(`Setting up background sync every ${intervalMinutes} minutes`);
  }

  /**
   * Open Health Connect settings
   */
  async openHealthConnectSettings(): Promise<void> {
    await CapacitorHealthConnect.openHealthConnectSetting();
  }
}

export default HealthConnectService.getInstance();
```

### 7.4 React Hook for Health Connect

#### `src/hooks/useHealthConnect.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import HealthConnectService from '@/services/healthConnect/HealthConnectService';
import { useToast } from '@/hooks/use-toast';

export interface HealthConnectStatus {
  available: boolean;
  initialized: boolean;
  permissionsGranted: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
}

export const useHealthConnect = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<HealthConnectStatus>({
    available: false,
    initialized: false,
    permissionsGranted: false,
    lastSync: null,
    syncInProgress: false,
  });

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await HealthConnectService.checkAvailability();
      setStatus(prev => ({ ...prev, available }));
    };
    checkAvailability();
  }, []);

  // Initialize Health Connect
  const initialize = useCallback(async () => {
    if (!user) return;

    try {
      await HealthConnectService.initialize(user.id);
      setStatus(prev => ({ ...prev, initialized: true }));

      toast({
        title: 'Health Connect Ready',
        description: 'Health data integration initialized',
      });
    } catch (error) {
      toast({
        title: 'Initialization Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      const result = await HealthConnectService.requestPermissions();

      setStatus(prev => ({
        ...prev,
        permissionsGranted: result.granted.length > 0,
      }));

      if (result.granted.length > 0) {
        toast({
          title: 'Permissions Granted',
          description: `Access granted to ${result.granted.length} health metrics`,
        });
      }

      if (result.denied.length > 0) {
        toast({
          title: 'Some Permissions Denied',
          description: `${result.denied.length} permissions were not granted`,
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      toast({
        title: 'Permission Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Sync health data
  const syncHealthData = useCallback(async () => {
    if (!user) return;

    setStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      const result = await HealthConnectService.syncHealthData(user.id);

      setStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date(),
      }));

      if (result.success) {
        toast({
          title: 'Sync Complete',
          description: `${result.recordsSynced} health records synced`,
        });
      } else {
        toast({
          title: 'Sync Completed with Errors',
          description: `${result.recordsSynced} records synced, ${result.errors.length} errors`,
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      setStatus(prev => ({ ...prev, syncInProgress: false }));

      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });

      throw error;
    }
  }, [user, toast]);

  // Open Health Connect settings
  const openSettings = useCallback(async () => {
    await HealthConnectService.openHealthConnectSettings();
  }, []);

  return {
    status,
    initialize,
    requestPermissions,
    syncHealthData,
    openSettings,
  };
};
```

### 7.5 Background Sync Service (Native Android)

#### `android/app/src/main/java/com/parakind/connect/HealthSyncWorker.kt`

```kotlin
package com.parakind.connect

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

class HealthSyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            // Call your sync logic here
            // This would trigger the JavaScript HealthConnectService.syncHealthData()
            // via a bridge mechanism

            // For now, log the sync attempt
            android.util.Log.d("HealthSync", "Background sync triggered")

            // Return success
            Result.success()
        } catch (e: Exception) {
            android.util.Log.e("HealthSync", "Background sync failed", e)
            Result.retry()
        }
    }

    companion object {
        private const val WORK_NAME = "HealthConnectSync"

        fun schedulePeriodicSync(context: Context, intervalMinutes: Long = 60) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<HealthSyncWorker>(
                intervalMinutes, TimeUnit.MINUTES,
                15, TimeUnit.MINUTES // Flex interval
            )
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )
        }
    }
}
```

---

## 8. Security & Privacy Considerations

### 8.1 Data Security

**1. Encryption in Transit**
- All communication between mobile app and Supabase uses TLS 1.3
- Health Connect data is encrypted on device by Android system
- Supabase connection uses secure WebSocket (WSS) for realtime updates

**2. Encryption at Rest**
- Supabase PostgreSQL database uses AES-256 encryption
- Health Connect stores data encrypted on device
- No health data cached in mobile app local storage unencrypted

**3. Authentication & Authorization**
- Supabase JWT tokens with short expiration (1 hour)
- Row Level Security (RLS) enforces data access at database level
- Each query automatically filtered by authenticated user
- Caregivers can only access patients they have active relationships with

**4. Data Minimization**
- Only collect health metrics relevant to senior care
- No collection of personally identifiable information beyond what's necessary
- Automatic data retention policies (configurable, e.g., 2 years)

### 8.2 Privacy Compliance

**HIPAA Considerations** (if applicable):
- Health Connect data is PHI (Protected Health Information)
- Need Business Associate Agreement (BAA) with Supabase
- Implement audit logging for all data access
- Ensure proper data retention and deletion policies
- Provide data export capabilities for patients

**GDPR Compliance** (if serving EU users):
- Obtain explicit consent for health data collection
- Provide clear privacy policy
- Implement "right to be forgotten" (data deletion)
- Allow users to export their data
- Document data processing activities

**CCPA Compliance** (California users):
- Disclosure of data collection practices
- Allow users to opt-out of data sale (N/A for this use case)
- Provide data deletion capabilities

### 8.3 User Consent Flow

```typescript
// Multi-step consent process

// Step 1: General app permissions
- Account creation and authentication
- Basic profile information

// Step 2: Health Connect permissions explanation
- Show detailed explanation of each health metric
- Explain why each metric is collected
- Show examples of how data will be used
- Link to privacy policy

// Step 3: Health Connect system permissions
- Android Health Connect permission dialog
- User grants/denies each data type individually

// Step 4: Caregiver access consent
- User explicitly grants caregivers access to health data
- Can revoke access at any time
- Can configure which caregivers see which metrics

// Step 5: Alert preferences
- User configures alert thresholds
- Sets notification preferences
- Configures quiet hours
```

### 8.4 Security Best Practices

1. **Never log sensitive health data**
   - Strip health values from error logs
   - Use generic error messages in production

2. **Implement rate limiting**
   - Prevent abuse of sync endpoints
   - Limit queries per user/device

3. **Regular security audits**
   - Review RLS policies quarterly
   - Monitor for suspicious access patterns
   - Keep dependencies updated

4. **Secure API keys**
   - Store Supabase keys in environment variables
   - Use Capacitor Secure Storage for tokens
   - Never commit secrets to version control

5. **Monitor for data breaches**
   - Implement logging for unusual access patterns
   - Set up alerts for failed authentication attempts
   - Regular backups with encryption

### 8.5 Privacy Policy Requirements

Must include:
- What health data is collected
- How health data is used
- Who has access to health data
- How long data is retained
- User rights (access, deletion, export)
- Third-party services used (Supabase, Health Connect)
- Contact information for privacy concerns
- Updates to privacy policy notification process

---

## 9. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal**: Setup mobile app infrastructure and database schema

**Tasks**:
1. **Database Setup** (Week 1, Days 1-2)
   - [ ] Create `health_metrics` table
   - [ ] Create `health_sync_status` table
   - [ ] Create `health_metric_aggregates` table
   - [ ] Update existing tables (daily_summaries, alerts, profiles)
   - [ ] Create database functions (anomaly detection, alert creation)
   - [ ] Create database triggers
   - [ ] Test RLS policies

2. **Capacitor Setup** (Week 1, Days 3-5)
   - [ ] Install Capacitor and Android platform
   - [ ] Configure Capacitor for existing React app
   - [ ] Setup Android Studio project
   - [ ] Configure AndroidManifest.xml with Health Connect permissions
   - [ ] Test basic Capacitor build and deployment
   - [ ] Configure code signing

3. **Health Connect Plugin Integration** (Week 2, Days 1-3)
   - [ ] Install `capacitor-health-connect` plugin
   - [ ] Test Health Connect availability detection
   - [ ] Implement permission request flow
   - [ ] Test reading sample data from Health Connect
   - [ ] Handle permission denied scenarios

4. **Testing & Documentation** (Week 2, Days 4-5)
   - [ ] Test on physical Android devices (multiple versions)
   - [ ] Document setup process
   - [ ] Create developer onboarding guide
   - [ ] Setup CI/CD for Android builds

**Deliverables**:
- Working Android app shell with Health Connect access
- Complete database schema deployed
- Basic permission flow working
- Documentation for developers

### Phase 2: Core Sync Functionality (Weeks 3-4)

**Goal**: Implement health data synchronization

**Tasks**:
1. **HealthConnectService Implementation** (Week 3, Days 1-3)
   - [ ] Create HealthConnectService class
   - [ ] Implement data reading for priority metrics (heart rate, blood pressure, steps)
   - [ ] Implement data transformation logic
   - [ ] Implement Supabase upload logic
   - [ ] Handle duplicate detection
   - [ ] Error handling and retry logic

2. **React Integration** (Week 3, Days 4-5)
   - [ ] Create `useHealthConnect` hook
   - [ ] Implement sync status tracking
   - [ ] Create Health Connect settings screen
   - [ ] Add sync button to senior dashboard
   - [ ] Display last sync time and status

3. **Background Sync** (Week 4, Days 1-3)
   - [ ] Implement Android WorkManager integration
   - [ ] Schedule periodic background sync (hourly)
   - [ ] Handle network connectivity checks
   - [ ] Handle battery optimization exemptions
   - [ ] Test background sync reliability

4. **Testing & Optimization** (Week 4, Days 4-5)
   - [ ] Test sync with multiple metric types
   - [ ] Test with large data volumes
   - [ ] Optimize batch insert performance
   - [ ] Test offline sync and queueing
   - [ ] Monitor battery impact

**Deliverables**:
- Fully functional health data sync
- Background sync working reliably
- Senior-facing health settings UI
- Performance benchmarks documented

### Phase 3: Caregiver Dashboard Integration (Weeks 5-6)

**Goal**: Display health data on caregiver dashboard

**Tasks**:
1. **Data Queries & API** (Week 5, Days 1-2)
   - [ ] Create React Query hooks for health metrics
   - [ ] Implement data aggregation queries
   - [ ] Setup realtime subscriptions for live updates
   - [ ] Optimize query performance
   - [ ] Add pagination for large datasets

2. **Health Metrics Visualization** (Week 5, Days 3-5)
   - [ ] Create health metrics card component
   - [ ] Implement heart rate chart (line chart)
   - [ ] Implement blood pressure chart (dual-line chart)
   - [ ] Implement steps chart (bar chart)
   - [ ] Implement sleep chart (bar chart with duration)
   - [ ] Add time range selector (24h, 7d, 30d, 90d)

3. **Dashboard Integration** (Week 6, Days 1-3)
   - [ ] Add Health Metrics section to caregiver dashboard
   - [ ] Create health summary cards (latest values)
   - [ ] Add trend indicators (up/down arrows)
   - [ ] Implement metric detail view (drill-down)
   - [ ] Add export data functionality (CSV/PDF)

4. **Testing & Polish** (Week 6, Days 4-5)
   - [ ] User acceptance testing with caregivers
   - [ ] Responsive design testing
   - [ ] Performance testing with real data
   - [ ] Accessibility testing
   - [ ] Bug fixes and polish

**Deliverables**:
- Complete health metrics visualization on caregiver dashboard
- Realtime updates working
- Export functionality
- User-tested and polished UI

### Phase 4: Alerts & Notifications (Weeks 7-8)

**Goal**: Implement intelligent health alerts

**Tasks**:
1. **Alert Detection Logic** (Week 7, Days 1-3)
   - [ ] Implement anomaly detection function
   - [ ] Configure default alert thresholds
   - [ ] Test threshold triggers
   - [ ] Implement alert severity levels
   - [ ] Test alert deduplication (don't spam caregivers)

2. **Alert UI** (Week 7, Days 4-5)
   - [ ] Create health alert notifications
   - [ ] Add alert banner to dashboard
   - [ ] Implement alert history view
   - [ ] Add alert acknowledgment flow
   - [ ] Add alert resolution notes

3. **Push Notifications** (Week 8, Days 1-3)
   - [ ] Setup Firebase Cloud Messaging (FCM)
   - [ ] Implement push notification sending
   - [ ] Add notification preferences UI
   - [ ] Implement quiet hours
   - [ ] Test notification delivery

4. **Alert Configuration** (Week 8, Days 4-5)
   - [ ] Create alert threshold configuration UI
   - [ ] Allow per-patient threshold customization
   - [ ] Implement alert escalation logic
   - [ ] Add caregiver notification preferences
   - [ ] Testing and refinement

**Deliverables**:
- Working alert system with configurable thresholds
- Push notifications to caregivers
- Alert management UI
- User-configurable preferences

### Phase 5: Polish & Deployment (Weeks 9-10)

**Goal**: Production-ready application

**Tasks**:
1. **Advanced Features** (Week 9, Days 1-3)
   - [ ] Implement remaining health metrics (Phase 2 & 3 metrics)
   - [ ] Add health trends analysis
   - [ ] Implement weekly/monthly health reports
   - [ ] Add data export for medical professionals
   - [ ] Implement offline mode improvements

2. **Security & Compliance** (Week 9, Days 4-5)
   - [ ] Security audit
   - [ ] Privacy policy updates
   - [ ] Terms of service updates
   - [ ] Implement audit logging
   - [ ] Data retention policy implementation

3. **Play Store Preparation** (Week 10, Days 1-3)
   - [ ] Complete Play Console health permissions declaration
   - [ ] Create app store listing (screenshots, description)
   - [ ] Prepare privacy policy URL
   - [ ] Submit for Google Health Connect approval
   - [ ] Complete app store metadata

4. **Launch Preparation** (Week 10, Days 4-5)
   - [ ] Final QA testing
   - [ ] Performance testing
   - [ ] Beta testing with real users
   - [ ] Bug fixes
   - [ ] Documentation completion
   - [ ] Deploy to production

**Deliverables**:
- Production-ready Android application
- App submitted to Play Store
- Complete documentation
- Beta testing completed
- Marketing materials prepared

### Phase 6: Post-Launch (Ongoing)

**Tasks**:
- Monitor Health Connect sync reliability
- Collect user feedback
- Monitor alert accuracy and adjust thresholds
- Performance optimization
- Feature enhancements based on feedback
- iOS version planning (using HealthKit)

---

## 10. Technical Requirements & Dependencies

### 10.1 Development Environment

**Required Software**:
- Node.js 18+ and npm 8+
- Android Studio Arctic Fox or later
- Android SDK 28+ (Android 9.0)
- JDK 11 or later
- Capacitor CLI 6+

**Development Dependencies**:
```json
{
  "devDependencies": {
    "@capacitor/cli": "^6.0.0",
    "@capacitor/android": "^6.0.0",
    "typescript": "^5.8.0",
    "vite": "^5.4.0"
  },
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "capacitor-health-connect": "^0.7.0",
    "@supabase/supabase-js": "^2.75.0",
    "@tanstack/react-query": "^5.83.0",
    "recharts": "^2.15.0",
    "date-fns": "^3.6.0"
  }
}
```

### 10.2 Android Requirements

**Minimum Requirements**:
- Android 9.0 (API 28) - for Health Connect app support
- Android 14+ (API 34) - for built-in Health Connect
- 50MB free storage
- Internet connection for sync
- Screen lock enabled (PIN/pattern/password)

**Recommended Requirements**:
- Android 14+ for best experience
- Wearable device with health sensors
- Always-on internet connection
- Battery optimization disabled for app

### 10.3 Backend Requirements

**Supabase Configuration**:
- PostgreSQL 15+
- Realtime enabled
- Row Level Security (RLS) enabled
- Storage bucket for health reports (optional)

**Database Size Estimates**:
- Base schema: ~5MB
- Per user per year: ~100-500MB (depending on metrics frequency)
- 100 active users: ~10-50GB per year

**API Rate Limits**:
- Supabase Free tier: 500MB database, 50K monthly active users
- Pro tier recommended for production: $25/month
- Consider Edge Functions for complex processing

### 10.4 Third-Party Services

**Required**:
- Supabase (Backend as a Service)
- Google Play Developer Account ($25 one-time)
- Android Health Connect (free, system component)

**Optional**:
- Firebase Cloud Messaging (push notifications) - free with limits
- Sentry (error tracking) - free tier available
- Analytics service (Google Analytics, Mixpanel) - free tiers available

### 10.5 Testing Requirements

**Testing Devices**:
- Minimum 2 physical Android devices:
  - One with Android 14+ (built-in Health Connect)
  - One with Android 9-13 (Health Connect app from Play Store)
- Various screen sizes (phone & tablet)
- Wearables for end-to-end testing (optional)

**Testing Apps**:
- Google Fit or Samsung Health (to populate Health Connect)
- Blood pressure simulator app (for testing)
- Step counter app

### 10.6 CI/CD Requirements

**GitHub Actions Workflow** (example):
```yaml
name: Android Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: 11
      - name: Install dependencies
        run: npm ci
      - name: Build web app
        run: npm run build
      - name: Sync Capacitor
        run: npx cap sync android
      - name: Build Android APK
        run: cd android && ./gradlew assembleDebug
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug.apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 11. Alternative Solutions

### 11.1 If Health Connect Approval is Delayed

**Problem**: Google Health Connect approval can take weeks or months.

**Alternatives**:

1. **Manual Health Data Entry**
   - Build forms for seniors/caregivers to manually enter health data
   - Quick to implement
   - Works immediately without approval
   - Cons: User friction, data entry errors, low adoption

2. **Third-Party Health Data APIs**
   - Use services like Validic, Terra API, or Thryve
   - These services aggregate data from multiple sources including Health Connect
   - Pre-approved for Health Connect access
   - Cons: Additional cost ($200-500/month), dependency on third party

3. **Bluetooth Health Device Integration**
   - Connect directly to Bluetooth blood pressure monitors, glucose meters
   - Bypass Health Connect entirely
   - More reliable for medical-grade devices
   - Cons: Requires specific device models, more complex development

### 11.2 If Native App Development is Not Feasible

**Problem**: Team lacks mobile development resources or timeline is too short.

**Alternatives**:

1. **Standalone Sync App**
   - Create minimal Android app that ONLY syncs Health Connect data
   - Users continue using web app for everything else
   - Faster development (2-3 weeks)
   - Cons: Poor user experience, two separate apps

2. **Partner with Existing Health Apps**
   - Partner with apps that already have Health Connect integration
   - Use their export/webhook features to get data
   - Cons: Dependency on third party, data delays, limited control

3. **Wait for Web Health APIs**
   - Web Health Connect APIs are being discussed but not available
   - Monitor W3C Web Platform Incubator Community Group
   - Cons: May take years, uncertain timeline

### 11.3 For iOS Support

**Problem**: This design only covers Android Health Connect.

**iOS HealthKit Integration**:
- Similar architecture but uses Apple HealthKit
- Use `@mley/capacitor-health` plugin (supports both platforms)
- HealthKit has different approval process
- Similar data types available
- Implementation time: +3-4 weeks

**Cross-Platform Plugin**:
```typescript
// Using capacitor-health (supports both platforms)
import { Health } from '@mley/capacitor-health';

// Works on both iOS and Android
const result = await Health.requestAuthorization({
  read: ['heart_rate', 'blood_pressure', 'steps'],
});
```

---

## 12. Risk Assessment

### 12.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Health Connect API changes** | Medium | High | Use well-maintained plugins, monitor Android updates, abstract Health Connect logic behind service layer |
| **Google approval delays** | High | Medium | Start approval process early, have manual entry fallback, consider third-party aggregator |
| **Background sync reliability** | Medium | Medium | Implement retry logic, manual sync button, monitor sync status, alert on failures |
| **Battery drain** | Medium | Low | Optimize sync frequency, use WorkManager constraints, respect battery saver mode |
| **Database performance** | Low | Medium | Implement aggregates table, use proper indexing, monitor query performance, paginate results |
| **Realtime subscription limits** | Low | Low | Use Supabase Pro tier for production, optimize subscriptions, use polling fallback |

### 12.2 User Adoption Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Users don't install mobile app** | High | High | Clear onboarding, explain benefits, optional feature (web app still works), family member can setup |
| **Permission denial** | Medium | High | Explain why each permission is needed, show examples, allow partial permissions |
| **Inconsistent data sources** | Medium | Medium | Educate on using consistent health app, support multiple sources, aggregate intelligently |
| **Alert fatigue** | Medium | High | Smart thresholds, quiet hours, alert summarization, user-configurable settings |

### 12.3 Compliance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **HIPAA violations** | Low | Critical | Get BAA with Supabase, implement proper security, regular audits, staff training |
| **Privacy policy violations** | Low | High | Legal review, clear consent flow, implement all promised features (export, deletion) |
| **Health Connect policy violations** | Low | Critical | Follow all Google guidelines, minimize data collection, clear use case explanation |
| **Data breach** | Low | Critical | Encryption, RLS, security audits, incident response plan, insurance |

### 12.4 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Development timeline overrun** | Medium | Medium | Phased approach, MVP first, optional features later |
| **Cost overruns** | Low | Medium | Use Supabase free tier for development, monitor usage, budget for Pro tier |
| **Maintenance burden** | Medium | Medium | Good documentation, automated testing, monitoring alerts |
| **Competitive pressure** | Low | Low | Fast iteration, unique features, strong user relationships |

---

## Appendices

### Appendix A: Health Connect Data Type Reference

Complete list of Health Connect data types with clinical relevance for seniors:

| Category | Data Type | Senior Relevance | Priority |
|----------|-----------|------------------|----------|
| **Vitals** | Blood Pressure | Essential for hypertension monitoring | Critical |
| | Heart Rate | Cardiovascular health, AFib detection | Critical |
| | Oxygen Saturation | Respiratory issues, COPD | High |
| | Blood Glucose | Diabetes management | Critical |
| | Body Temperature | Infection detection | Medium |
| | Respiratory Rate | Respiratory health | Medium |
| | Heart Rate Variability | Stress, autonomic function | Low |
| **Activity** | Steps | Fall risk, mobility | High |
| | Distance | Activity level | Medium |
| | Floors Climbed | Cardiovascular fitness | Low |
| | Active Calories | Energy expenditure | Medium |
| | Exercise Sessions | Activity tracking | Low |
| **Body** | Weight | Nutritional status, fluid retention | High |
| | Height | BMI calculation | Low |
| | BMI | Nutritional assessment | Medium |
| | Body Fat | Nutritional status | Low |
| **Sleep** | Sleep Session | Sleep quality, cognitive health | High |
| | Sleep Stages | Sleep quality details | Low |
| **Nutrition** | Hydration | Dehydration prevention | Medium |
| | Nutrition | Diet monitoring | Low |

### Appendix B: Alert Threshold Defaults

Recommended default alert thresholds for senior population:

```json
{
  "blood_pressure": {
    "systolic": {
      "warning_high": 140,
      "critical_high": 180,
      "warning_low": 100,
      "critical_low": 90
    },
    "diastolic": {
      "warning_high": 90,
      "critical_high": 110,
      "warning_low": 60,
      "critical_low": 50
    }
  },
  "heart_rate": {
    "warning_high": 100,
    "critical_high": 120,
    "warning_low": 50,
    "critical_low": 40
  },
  "oxygen_saturation": {
    "warning_low": 95,
    "critical_low": 90
  },
  "blood_glucose": {
    "fasting": {
      "warning_high": 125,
      "critical_high": 180,
      "warning_low": 70,
      "critical_low": 54
    }
  },
  "steps_daily": {
    "warning_low": 2000,
    "critical_low": 500
  },
  "sleep_hours": {
    "warning_low": 6,
    "warning_high": 10,
    "critical_low": 4
  },
  "weight_change_weekly": {
    "warning_change_lbs": 5,
    "critical_change_lbs": 10
  }
}
```

### Appendix C: Sample Queries

Common queries for health metrics:

```sql
-- Get latest heart rate
SELECT value_numeric, recorded_at
FROM health_metrics
WHERE patient_id = 'uuid'
AND metric_type = 'heart_rate'
ORDER BY recorded_at DESC
LIMIT 1;

-- Get average blood pressure for last 7 days
SELECT
  DATE(recorded_at) as date,
  AVG((value_json->>'systolic')::integer) as avg_systolic,
  AVG((value_json->>'diastolic')::integer) as avg_diastolic,
  COUNT(*) as reading_count
FROM health_metrics
WHERE patient_id = 'uuid'
AND metric_type = 'blood_pressure'
AND recorded_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(recorded_at)
ORDER BY date DESC;

-- Get daily step totals for last 30 days
SELECT
  recorded_date,
  SUM(value_numeric) as total_steps
FROM health_metrics
WHERE patient_id = 'uuid'
AND metric_type = 'steps'
AND recorded_at >= NOW() - INTERVAL '30 days'
GROUP BY recorded_date
ORDER BY recorded_date DESC;

-- Get all anomalies in last 24 hours
SELECT
  metric_type,
  recorded_at,
  value_numeric,
  value_json,
  anomaly_reason
FROM health_metrics
WHERE patient_id = 'uuid'
AND is_anomaly = true
AND recorded_at >= NOW() - INTERVAL '24 hours'
ORDER BY recorded_at DESC;

-- Get health data completeness score
SELECT
  recorded_date,
  COUNT(DISTINCT metric_type) as metrics_received,
  ROUND(
    COUNT(DISTINCT metric_type)::numeric / 7 * 100,
    2
  ) as completeness_percentage
FROM health_metrics
WHERE patient_id = 'uuid'
AND metric_type IN ('heart_rate', 'blood_pressure', 'steps', 'sleep_session', 'weight', 'blood_glucose', 'oxygen_saturation')
AND recorded_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY recorded_date
ORDER BY recorded_date DESC;
```

### Appendix D: Resources & Documentation

**Official Documentation**:
- [Android Health Connect Docs](https://developer.android.com/health-and-fitness/guides/health-connect)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Capacitor Health Connect Plugin](https://github.com/ubie-oss/capacitor-health-connect)

**Community Resources**:
- [Health Connect on Stack Overflow](https://stackoverflow.com/questions/tagged/android-health-connect)
- [Capacitor Community Discord](https://discord.gg/capacitor)
- [r/androiddev on Reddit](https://reddit.com/r/androiddev)

**Tools**:
- [Android Studio](https://developer.android.com/studio)
- [Supabase Dashboard](https://app.supabase.com)
- [Play Console](https://play.google.com/console)

---

## Conclusion

This technical design document provides a comprehensive blueprint for integrating Android Health Connect into the Para Kind Connect application. The recommended approach using Capacitor enables maximum code reuse while providing full native capabilities.

### Key Takeaways

1. **Native App Required**: Health Connect only works with native Android apps, not PWAs
2. **Capacitor Recommended**: Best balance of code reuse and native capabilities
3. **10-Week Timeline**: Realistic timeline from start to Play Store submission
4. **Database-First Design**: Comprehensive schema supports all use cases
5. **Security Critical**: HIPAA/GDPR compliance must be addressed
6. **User Consent Essential**: Multi-step consent process protects users and app
7. **Phased Approach**: Start with high-priority metrics, expand later

### Next Steps

1. **Stakeholder Review**: Review this document with team and stakeholders
2. **Budget Approval**: Confirm budget for Google Play account, Supabase Pro, development time
3. **Resource Allocation**: Assign developers with mobile experience
4. **Environment Setup**: Setup development environment and test devices
5. **Begin Phase 1**: Start with database schema and Capacitor setup
6. **Privacy Policy**: Engage legal counsel to draft/update privacy policy
7. **Play Console Setup**: Create Google Play Developer account

### Success Metrics

- **Sync Reliability**: >95% successful background syncs
- **User Adoption**: >60% of seniors enable Health Connect
- **Alert Accuracy**: <5% false positive rate for critical alerts
- **Performance**: Dashboard loads in <2 seconds with health data
- **User Satisfaction**: >4.0 star rating on Play Store

---

**Document Status**: Draft v1.0
**Last Updated**: October 16, 2025
**Next Review**: After Phase 1 completion
