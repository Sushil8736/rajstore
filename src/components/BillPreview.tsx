import React, { useState } from 'react';
import type { Bill, BusinessSettings } from '../types';
import { Printer, Bluetooth, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { BluetoothPrinterManager } from './BluetoothPrinterManager';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';

interface BillPreviewProps {
  bill: Bill;
  settings: BusinessSettings | null;
}

export function BillPreview({ bill, settings }: BillPreviewProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [canPrint, setCanPrint] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBluetoothPrint = async () => {
    if (!bluetoothPrinter.isConnected()) {
      setPrintError('Please connect to a Bluetooth printer first');
      return;
    }

    setIsPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      const printData = {
        businessName: settings?.businessName || 'Your Business',
        address: settings?.address,
        phone: settings?.phone,
        email: settings?.email,
        gst: settings?.gst,
        billNumber: bill.billNumber,
        date: formatDate(bill.date),
        customerName: bill.customerName,
        sellerName: bill.sellerName,
        paymentMode: bill.paymentMode,
        items: bill.items,
        grandTotal: bill.grandTotal,
        notes: bill.notes,
      };

      await bluetoothPrinter.printBill(printData);
      setPrintSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPrintSuccess(false);
      }, 3000);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : 'Failed to print');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Print Controls */}
      <div className="flex flex-wrap gap-2 justify-end print:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Bluetooth className="size-4" />
              Bluetooth Printer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bluetooth Thermal Printer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <BluetoothPrinterManager onPrintReady={setCanPrint} />
              
              <Button
                onClick={handleBluetoothPrint}
                disabled={!canPrint || isPrinting}
                className="w-full flex items-center justify-center gap-2"
              >
                <Printer className="size-4" />
                {isPrinting ? 'Printing...' : 'Print Invoice'}
              </Button>

              {printError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="size-4 text-red-600" />
                  <AlertDescription className="text-red-800">{printError}</AlertDescription>
                </Alert>
              )}

              {printSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <Check className="size-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Invoice printed successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={handleBrowserPrint} className="flex items-center gap-2">
          <Printer className="size-4" />
          Browser Print
        </Button>
      </div>

      {/* Bill Preview */}
      <div className="bill-preview bg-white p-6 max-w-md mx-auto border-2 border-dashed border-gray-300">
        {/* Business Header */}
        <div className="text-center border-b-2 border-black pb-3 mb-3">
          <h1 className="text-xl uppercase tracking-wide">
            {settings?.businessName || 'Your Business Name'}
          </h1>
          {settings?.address && (
            <p className="text-xs mt-1">{settings.address}</p>
          )}
          <div className="flex justify-center gap-4 text-xs mt-1">
            {settings?.phone && <span>Ph: {settings.phone}</span>}
            {settings?.email && <span>{settings.email}</span>}
          </div>
          {settings?.gst && (
            <p className="text-xs mt-1">GST: {settings.gst}</p>
          )}
        </div>

        {/* Bill Info */}
        <div className="space-y-1 text-xs mb-3 border-b border-dashed border-gray-400 pb-3">
          <div className="flex justify-between">
            <span>Bill No:</span>
            <span>{bill.billNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(bill.date)}</span>
          </div>
          {bill.customerName && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{bill.customerName}</span>
            </div>
          )}
          {bill.sellerName && (
            <div className="flex justify-between">
              <span>Seller:</span>
              <span>{bill.sellerName}</span>
            </div>
          )}
          {bill.paymentMode && (
            <div className="flex justify-between">
              <span>Payment:</span>
              <span>{bill.paymentMode}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-3">
          <div className="border-b-2 border-black pb-1 mb-2">
            <div className="grid grid-cols-12 gap-1 text-xs uppercase">
              <div className="col-span-5">Item</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {bill.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-1 text-xs">
                <div className="col-span-5 break-words">{item.name}</div>
                <div className="col-span-2 text-right">{item.quantity}</div>
                <div className="col-span-2 text-right">{item.rate.toFixed(2)}</div>
                <div className="col-span-3 text-right">{item.total.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t-2 border-black pt-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="uppercase">Grand Total:</span>
            <span className="text-xl">{formatCurrency(bill.grandTotal)}</span>
          </div>
        </div>

        {/* Notes */}
        {bill.notes && (
          <div className="border-t border-dashed border-gray-400 pt-2 mb-3">
            <p className="text-xs">
              <span className="uppercase">Note:</span> {bill.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t-2 border-black pt-3 mt-3">
          <p className="text-xs">Thank you for your business!</p>
        </div>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .bill-preview, .bill-preview * {
              visibility: visible;
            }
            .bill-preview {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              padding: 10mm;
              border: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}