import type { Bill, BusinessSettings } from '../types';

interface BillPreviewProps {
  bill: Bill;
  settings: BusinessSettings | null;
}

export function BillPreview({ bill, settings }: BillPreviewProps) {
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

  return (
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
  );
}
