# Samsung Health Data Export Guide

## How to Export Your Health Data from Samsung Health

This guide will help you export health data from your Samsung Galaxy Watch 7 and S23+ to share with the Parra Connect development team or to import into the application.

---

## What Data Can Be Exported?

Samsung Health allows you to export comprehensive health data including:

- ✅ **Heart rate** (continuous monitoring from Galaxy Watch 7)
- ✅ **Steps** (daily step counts)
- ✅ **Sleep** (duration, stages, sleep quality scores)
- ✅ **Blood pressure** (manual measurements from watch)
- ✅ **Oxygen saturation** (SpO2 readings)
- ✅ **Exercise activities** (workouts, distance, calories)
- ✅ **Weight & body measurements**
- ✅ **Nutrition data** (food intake, water consumption)
- ✅ **Stress levels**

---

## Export Instructions

### Step 1: Open Samsung Health App

1. Open the **Samsung Health** app on your Samsung S23+
2. Make sure your Galaxy Watch 7 data has synced (check sync status at bottom of app)

### Step 2: Access Settings

1. Tap the **hamburger menu** (☰) in the top-left or bottom-right corner
2. Scroll down and select **Settings**
3. Look for **Privacy** or **Data and permissions**

### Step 3: Export Data

1. Tap **Download personal data** or **Export data**
2. Select the data types you want to export:
   - Check **All data** for a complete export
   - Or select specific categories (Heart rate, Steps, Sleep, etc.)
3. Choose date range:
   - **Last 7 days** - For recent data testing
   - **Last 30 days** - For monthly trends
   - **All time** - For complete history
4. Tap **Request data** or **Export**

### Step 4: Wait for Processing

1. Samsung Health will process your request (usually 1-5 minutes)
2. You'll receive a notification when the export is ready
3. Alternatively, check back in **Settings > Privacy > Download requests**

### Step 5: Download the Export

1. Once ready, tap **Download** in the notification or settings
2. The data will be saved as a **ZIP file** to your device
3. Default location: `Downloads` folder or `/storage/emulated/0/Download/`

---

## What's Included in the Export?

The export ZIP file contains:

### 📁 Main Files

- **`com.samsung.health.activity_tracker.csv`** - Steps, distance, calories
- **`com.samsung.health.heart_rate.csv`** - All heart rate readings with timestamps
- **`com.samsung.health.sleep.csv`** - Sleep sessions and stages
- **`com.samsung.health.blood_pressure.csv`** - BP measurements
- **`com.samsung.health.oxygen_saturation.csv`** - SpO2 readings
- **`com.samsung.health.exercise.csv`** - Workout data
- **`com.samsung.health.weight.csv`** - Weight measurements
- **`com.samsung.health.water_intake.csv`** - Hydration tracking
- **`com.samsung.shealth.tracker.pedometer_day_summary.csv`** - Daily step summaries

### 📁 JSON Folder

- Detailed JSON files with metadata for each data type
- Device information
- Measurement context and accuracy data

### 📄 Total Files

- Typically **15-25 CSV files** depending on what data you've tracked
- **1 JSON folder** with detailed metadata
- **1 README.txt** with export information

---

## How to Share the Export

### Option 1: Email (For Small Exports)

1. Locate the ZIP file in your Downloads folder
2. Use your preferred file manager (My Files, Google Files)
3. Long-press the ZIP file and select **Share**
4. Choose **Email** or **Gmail**
5. Send to the development team

### Option 2: Cloud Upload (For Large Exports)

1. Upload to **Google Drive**, **Dropbox**, or **OneDrive**
2. Get a shareable link
3. Share the link securely

### Option 3: USB Transfer

1. Connect your S23+ to computer via USB
2. Enable **File Transfer** mode
3. Navigate to `Internal Storage > Download`
4. Copy the ZIP file to your computer

---

## Data Format Examples

### Heart Rate CSV Format

```csv
com.samsung.health.heart_rate
start_time,end_time,heart_rate,heart_beat_count,comment,custom,update_time,device_uuid,create_time
2025-10-17 08:30:00,2025-10-17 08:30:00,72.0,,,{"device_manufacturer":"Samsung","device_model":"SM-R930","sensor_type":"PPG"},2025-10-17 08:30:05,abc123-device-uuid,2025-10-17 08:30:05
```

### Steps CSV Format

```csv
com.samsung.shealth.tracker.pedometer_day_summary
day_time,step_count,distance,calorie,speed
2025-10-17 00:00:00,8456,6834.5,487.2,4.5
```

### Sleep CSV Format

```csv
com.samsung.health.sleep
start_time,end_time,sleep_stage,comment
2025-10-16 23:00:00,2025-10-17 06:06:00,40001,
```

**Sleep Stage Codes:**
- `40001` - Awake
- `40002` - Light sleep
- `40003` - Deep sleep
- `40004` - REM sleep

---

## Troubleshooting

### "Export not available"

- Make sure you have **Samsung Health version 6.30** or higher
- Update the app from Galaxy Store or Play Store
- Restart the app and try again

### "No data to export"

- Ensure your Galaxy Watch 7 has synced recent data
- Open Samsung Health and wait for sync to complete
- Check that you have data for the selected date range

### Export file is too large

- Export shorter time periods (7 days instead of all time)
- Deselect unused data types (e.g., nutrition if not tracked)
- Use cloud storage instead of email

### Can't find the downloaded file

- Check `My Files > Downloads` folder
- Search for "Samsung_Health" in your file manager
- Look in `/storage/emulated/0/Download/` via file explorer

---

## Privacy & Security Notes

⚠️ **Important:**

1. **Personal Health Information (PHI)** - This export contains sensitive medical data
2. **Encrypt before sharing** - Use password-protected ZIP files or secure file sharing
3. **Delete after sharing** - Remove the export file from your device after uploading
4. **HIPAA Considerations** - If using for healthcare purposes, follow HIPAA guidelines
5. **Samsung Privacy** - Your export is generated locally on your device

---

## Frequency Recommendations

### For Development/Testing

- Export **weekly** for testing new features
- Export **monthly** for comprehensive testing
- Export **after significant activities** (long workout, poor sleep night)

### For Medical Monitoring

- Export **monthly** and share with healthcare provider
- Keep **3-month rolling backups**
- Export before **doctor appointments**

---

## Alternative: Real-Time Sync (Coming Soon)

Instead of manual exports, Parra Connect will soon support **real-time syncing** through **Terra API**:

- ✅ Automatic data sync every hour
- ✅ No manual exports needed
- ✅ Real-time health monitoring
- ✅ Secure OAuth connection
- ✅ Supports Galaxy Watch 7 and S23+ seamlessly

**Status:** Coming Q2 2025 with smart device integration

---

## Support

Need help with exports?

- 📧 **Email:** hello@parraconnect.ai
- 📱 **Samsung Health Support:** https://www.samsung.com/us/support/
- 📚 **Samsung Health FAQ:** Settings > About > FAQs

---

## Next Steps After Export

Once you have the export ZIP file:

1. ✅ Run the health data migration: `/supabase/migrations/20251017000001_matthew_mock_health_data.sql`
2. ✅ Upload the CSV files through the Parra Connect dashboard (feature coming soon)
3. ✅ View your health metrics in the patient dashboard
4. ✅ Share insights with your caregivers

---

**Last Updated:** October 17, 2025
**Compatible With:** Samsung Health 6.30+, Galaxy Watch 7, Galaxy S23+
