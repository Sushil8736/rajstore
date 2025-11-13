export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  total: number;
  stockId?: string;
}

export interface Bill {
  billNumber: string;
  date: string;
  customerName?: string;
  items: BillItem[];
  grandTotal: number;
  paymentMode?: 'Cash' | 'UPI' | 'Card' | '';
  notes?: string;
  businessName?: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  purchaseRate?: number;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  address?: string;
  phone?: string;
  email?: string;
  gst?: string;
}

export interface SalesReport {
  totalSales: number;
  totalBills: number;
  paymentModes: Record<string, number>;
  bills: Bill[];
}
