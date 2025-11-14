import React, { useState, useEffect } from 'react';
import { Bluetooth, Printer, Check, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';

interface BluetoothPrinterManagerProps {
  onPrintReady?: (canPrint: boolean) => void;
}

export function BluetoothPrinterManager({ onPrintReady }: BluetoothPrinterManagerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check browser support
    setIsSupported(bluetoothPrinter.isSupported());
  }, []);

  useEffect(() => {
    if (onPrintReady) {
      onPrintReady(isConnected);
    }
  }, [isConnected, onPrintReady]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      const connected = await bluetoothPrinter.connect();
      if (connected) {
        setIsConnected(true);
        const name = bluetoothPrinter.getDeviceName();
        setDeviceName(name);
        setSuccess(`Connected to ${name || 'Bluetooth Printer'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to printer');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bluetoothPrinter.disconnect();
      setIsConnected(false);
      setDeviceName(null);
      setSuccess('Disconnected from printer');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      await bluetoothPrinter.testPrint();
      setSuccess('Test print sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test print failed');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isSupported) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="size-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on desktop/Android.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bluetooth className="size-5 text-blue-600" />
          <div>
            <h3 className="text-sm">Bluetooth Printer</h3>
            <p className="text-xs text-gray-500">
              {isConnected ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Wifi className="size-3" />
                  Connected: {deviceName || 'Unnamed Device'}
                </span>
              ) : (
                <span className="text-gray-500">Not connected</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              size="sm"
              className="flex items-center gap-2"
            >
              <Bluetooth className="size-4" />
              {isConnecting ? 'Connecting...' : 'Connect Printer'}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleTestPrint}
                disabled={isTesting}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="size-4" />
                {isTesting ? 'Printing...' : 'Test Print'}
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="size-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="size-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <div className="text-xs text-gray-500 space-y-1 border-l-2 border-blue-200 pl-3">
          <p className="text-blue-900">How to connect:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Turn on your Bluetooth thermal printer</li>
            <li>Make sure it's in pairing mode (check printer manual)</li>
            <li>Click "Connect Printer" and select your device</li>
            <li>Once connected, you can print invoices</li>
          </ol>
        </div>
      )}
    </div>
  );
}