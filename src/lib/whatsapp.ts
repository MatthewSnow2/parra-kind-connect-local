/**
 * WhatsApp Integration Utilities
 *
 * Provides simple click-to-chat functionality without requiring WhatsApp Business API.
 * Uses the wa.me URL scheme to open WhatsApp with pre-filled messages.
 */

/**
 * Format phone number for WhatsApp (remove spaces, dashes, parentheses)
 * WhatsApp expects format: countrycode + number (e.g., 14155551234)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';

  // Remove all non-numeric characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove leading + if present (wa.me doesn't need it)
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Open WhatsApp chat with optional pre-filled message
 * @param phoneNumber - Phone number in any format (will be cleaned)
 * @param message - Optional pre-filled message
 * @param openInNewTab - Whether to open in new tab (default: true)
 */
export function openWhatsAppChat(
  phoneNumber: string,
  message?: string,
  openInNewTab: boolean = true
): void {
  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);

  if (!formattedPhone) {
    console.error('Invalid phone number for WhatsApp');
    return;
  }

  let url = `https://wa.me/${formattedPhone}`;

  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }

  if (openInNewTab) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = url;
  }
}

/**
 * Generate WhatsApp share URL (doesn't open, just returns URL)
 */
export function getWhatsAppUrl(phoneNumber: string, message?: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);

  if (!formattedPhone) {
    return '';
  }

  let url = `https://wa.me/${formattedPhone}`;

  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }

  return url;
}

/**
 * Format alert message for WhatsApp sharing
 */
export function formatAlertForWhatsApp(alert: {
  alert_message: string;
  severity: string;
  created_at: string;
  patient?: { full_name?: string; display_name?: string };
}): string {
  const patientName = alert.patient?.display_name || alert.patient?.full_name || 'Patient';
  const severity = alert.severity.toUpperCase();
  const time = new Date(alert.created_at).toLocaleString();

  return `🚨 *${severity} ALERT*

Patient: ${patientName}
Time: ${time}

${alert.alert_message}

Please check the Parra dashboard for more details.`;
}

/**
 * Format daily summary for WhatsApp sharing
 */
export function formatSummaryForWhatsApp(summary: {
  summary_text?: string;
  overall_mood?: string;
  overall_status?: string;
  summary_date: string;
  patient?: { full_name?: string; display_name?: string };
}): string {
  const patientName = summary.patient?.display_name || summary.patient?.full_name || 'Patient';
  const date = new Date(summary.summary_date).toLocaleDateString();
  const mood = summary.overall_mood || 'N/A';
  const status = summary.overall_status || 'N/A';

  return `📊 *Daily Summary for ${patientName}*

Date: ${date}
Status: ${status.toUpperCase()}
Mood: ${mood}

${summary.summary_text || 'No summary available'}

View full details on the Parra dashboard.`;
}

/**
 * Check if WhatsApp is likely available on this device
 * (This is a best-guess, not 100% accurate)
 */
export function isWhatsAppLikelyAvailable(): boolean {
  // WhatsApp Web works on desktop, WhatsApp app on mobile
  return true; // wa.me works on all devices
}
