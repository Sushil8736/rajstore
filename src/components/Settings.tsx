import { useEffect, useState } from 'react';
import { settingsAPI } from '../utils/api';
import type { BusinessSettings, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { SellerManagement } from './SellerManagement';
import { BluetoothPrinterManager } from './BluetoothPrinterManager';

interface SettingsProps {
  user: User;
  accessToken: string | null;
}

export function Settings({ user, accessToken }: SettingsProps) {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: '',
    address: '',
    phone: '',
    gstin: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await settingsAPI.getSettings();
      console.log('Loaded settings:', result);
      if (result) {
        setSettings(result);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const result = await settingsAPI.saveSettings(settings);
      
      if (result) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error(result);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage your business settings and preferences</p>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  placeholder="Enter business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Enter business address"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN (Optional)</Label>
                <Input
                  id="gstin"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  placeholder="Enter GSTIN"
                />
              </div>

              <Button onClick={handleSave} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4">
          {accessToken && user.role === 'admin' ? (
            <SellerManagement accessToken={accessToken} currentUser={user} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Only admin users can manage sellers.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="printer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bluetooth Thermal Printer</CardTitle>
            </CardHeader>
            <CardContent>
              <BluetoothPrinterManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About Sales & Billing System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2">Version</h3>
                <p className="text-sm text-muted-foreground">1.0.0</p>
              </div>

              <div className="pt-4 space-y-1">
                <p>Features:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-muted-foreground">
                  <li>User authentication and seller management</li>
                  <li>Create and manage bills with automatic bill numbering</li>
                  <li>Track sales by day, month, and financial year</li>
                  <li>Manage stock inventory with automatic quantity updates</li>
                  <li>Print-friendly bill format optimized for thermal printers</li>
                  <li>Bluetooth thermal printer support (58mm/2-inch)</li>
                  <li>Payment mode tracking (Cash, UPI, Card)</li>
                  <li>Permanent data storage with Supabase</li>
                </ul>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Developed with React, TypeScript, and Supabase
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
