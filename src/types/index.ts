// Type definitions for the billing system

export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  total: number;
  stockId?: string;
  discountType?: 'fixed' | 'percentage';
  discountValue?: number;
  discountAmount?: number;
}

export interface Bill {
  billNumber: string;
  date: string;
  customerName?: string;
  items: BillItem[];
  subtotal?: number;
  discountType?: 'fixed' | 'percentage';
  discountValue?: number;
  discountAmount?: number;
  grandTotal: number;
  paymentMode?: 'Cash' | 'UPI' | 'Card' | '';
  notes?: string;
  businessName?: string;
  sellerId?: string;
  sellerName?: string;
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
  termsAndConditions?: string;
}

export interface SalesReport {
  totalSales: number;
  totalBills: number;
  paymentModes: Record<string, number>;
  bills: Bill[];
  totalDiscount?: number;
  averageDiscount?: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'seller';
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
}