/**
 * AdminSettings Page
 *
 * System configuration and settings management.
 * Configure feature flags, notifications, security, and system settings.
 */

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Flag,
  Bell,
  Shield,
  Server,
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { systemSettingsSchema } from '@/lib/admin/validation';
import type { SystemSettings } from '@/lib/admin/types';

/**
 * AdminSettings Page Component
 */
export const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize with default settings
  const [settings, setSettings] = useState<SystemSettings>({
    // Feature flags
    enableBetaFeatures: false,
    enableVoiceCheckins: true,
    enableWhatsAppIntegration: false,

    // Notification settings
    alertNotificationDelay: 5,
    escalationThreshold: 30,
    dailySummaryTime: '08:00',

    // Security settings
    sessionTimeout: 60,
    requireMFA: false,
    passwordMinLength: 8,

    // System settings
    maintenanceMode: false,
    maxCheckInsPerDay: 20,
    dataRetentionDays: 365,
  });

  const updateSetting = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Validate settings
      const validation = systemSettingsSchema.safeParse(settings);
      if (!validation.success) {
        toast({
          title: 'Validation Error',
          description: validation.error.errors[0]?.message || 'Invalid settings',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      // In a real app, save to backend
      // await saveSystemSettings(validation.data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Settings saved',
        description: 'System settings have been updated successfully.',
      });

      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      enableBetaFeatures: false,
      enableVoiceCheckins: true,
      enableWhatsAppIntegration: false,
      alertNotificationDelay: 5,
      escalationThreshold: 30,
      dailySummaryTime: '08:00',
      sessionTimeout: 60,
      requireMFA: false,
      passwordMinLength: 8,
      maintenanceMode: false,
      maxCheckInsPerDay: 20,
      dataRetentionDays: 365,
    });
    setHasChanges(false);

    toast({
      title: 'Settings reset',
      description: 'All settings have been reset to defaults.',
    });
  };

  return (
    <AdminLayout
      title="System Settings"
      description="Configure system features and preferences"
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <div className="space-y-6">
        {/* Save Banner */}
        {hasChanges && (
          <Alert>
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              You have unsaved changes. Don't forget to save your settings.
            </AlertDescription>
          </Alert>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="features">
              <Flag className="h-4 w-4 mr-2" aria-hidden="true" />
              Features
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
              Security
            </TabsTrigger>
            <TabsTrigger value="system">
              <Server className="h-4 w-4 mr-2" aria-hidden="true" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Feature Flags Tab */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                  Enable or disable system features and experimental functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableBetaFeatures" className="text-base">
                      Beta Features
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable experimental features and functionality
                    </p>
                  </div>
                  <Switch
                    id="enableBetaFeatures"
                    checked={settings.enableBetaFeatures}
                    onCheckedChange={(checked) => updateSetting('enableBetaFeatures', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableVoiceCheckins" className="text-base">
                      Voice Check-ins
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow seniors to perform check-ins via voice
                    </p>
                  </div>
                  <Switch
                    id="enableVoiceCheckins"
                    checked={settings.enableVoiceCheckins}
                    onCheckedChange={(checked) => updateSetting('enableVoiceCheckins', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableWhatsAppIntegration" className="text-base">
                      WhatsApp Integration
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable WhatsApp for check-ins and notifications
                    </p>
                  </div>
                  <Switch
                    id="enableWhatsAppIntegration"
                    checked={settings.enableWhatsAppIntegration}
                    onCheckedChange={(checked) =>
                      updateSetting('enableWhatsAppIntegration', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure alert notifications and daily summaries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="alertNotificationDelay">
                    Alert Notification Delay (minutes)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Time to wait before sending alert notifications
                  </p>
                  <Input
                    id="alertNotificationDelay"
                    type="number"
                    min="0"
                    max="60"
                    value={settings.alertNotificationDelay}
                    onChange={(e) =>
                      updateSetting('alertNotificationDelay', parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escalationThreshold">Escalation Threshold (minutes)</Label>
                  <p className="text-sm text-muted-foreground">
                    Time before escalating unacknowledged alerts
                  </p>
                  <Input
                    id="escalationThreshold"
                    type="number"
                    min="1"
                    max="1440"
                    value={settings.escalationThreshold}
                    onChange={(e) =>
                      updateSetting('escalationThreshold', parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailySummaryTime">Daily Summary Time</Label>
                  <p className="text-sm text-muted-foreground">
                    Time to send daily summary emails (24-hour format)
                  </p>
                  <Input
                    id="dailySummaryTime"
                    type="time"
                    value={settings.dailySummaryTime}
                    onChange={(e) => updateSetting('dailySummaryTime', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure authentication and security requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out inactive users after this time
                  </p>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="15"
                    max="1440"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireMFA" className="text-base">
                      Require Multi-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Require MFA for all user accounts
                    </p>
                  </div>
                  <Switch
                    id="requireMFA"
                    checked={settings.requireMFA}
                    onCheckedChange={(checked) => updateSetting('requireMFA', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimum number of characters required for passwords
                  </p>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="8"
                    max="128"
                    value={settings.passwordMinLength}
                    onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    <strong>Warning:</strong> Changing these settings may affect system performance
                    and availability. Proceed with caution.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenanceMode" className="text-base">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable the system for maintenance
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxCheckInsPerDay">Maximum Check-ins Per Day</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum number of check-ins allowed per senior per day
                  </p>
                  <Input
                    id="maxCheckInsPerDay"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxCheckInsPerDay}
                    onChange={(e) => updateSetting('maxCheckInsPerDay', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataRetentionDays">Data Retention Period (days)</Label>
                  <p className="text-sm text-muted-foreground">
                    Number of days to retain historical data
                  </p>
                  <Input
                    id="dataRetentionDays"
                    type="number"
                    min="30"
                    max="3650"
                    value={settings.dataRetentionDays}
                    onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleReset} disabled={isSaving || !hasChanges}>
                Reset to Defaults
              </Button>
              <div className="flex gap-2">
                {hasChanges && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    Unsaved changes
                  </div>
                )}
                <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current system status and version information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">System Version</Label>
                <p className="text-sm font-medium mt-1">Para Connect v1.0.0</p>
              </div>
              <div>
                <Label className="text-muted-foreground">System Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                  <span className="text-sm font-medium">
                    {settings.maintenanceMode ? 'Maintenance Mode' : 'Operational'}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Environment</Label>
                <p className="text-sm font-medium mt-1">Production</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <p className="text-sm font-medium mt-1">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
