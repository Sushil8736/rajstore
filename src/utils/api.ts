import { projectId, publicAnonKey } from './supabase/info';
import type { Bill, StockItem, BusinessSettings, SalesReport } from '../types';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-f305f05f`;

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'API call failed');
  }
  
  return data;
}

export const billAPI = {
  // Get suggested next bill number (for suggestion only, not mandatory)
  getNextBillNumber: async (): Promise<string> => {
    const data = await apiCall('/get-next-bill-number', {
      method: 'POST',
    });
    return data.billNumber;
  },
  
  // Create a new bill with manual bill number
  createBill: async (bill: Bill): Promise<Bill> => {
    const data = await apiCall('/create-bill', {
      method: 'POST',
      body: JSON.stringify(bill),
    });
    return data.bill;
  },
  
  // Get all bills
  getAllBills: async (): Promise<Bill[]> => {
    const data = await apiCall('/get-bills');
    return data.bills;
  },
  
  // Get bill by number (for checking uniqueness)
  getBillByNumber: async (billNumber: string): Promise<Bill | null> => {
    try {
      const data = await apiCall(`/get-bill/${encodeURIComponent(billNumber)}`);
      return data.bill;
    } catch (error) {
      // If bill not found (404), return null
      return null;
    }
  },
  
  // Get bill (alias for compatibility)
  getBill: async (billNumber: string): Promise<Bill> => {
    const data = await apiCall(`/get-bill/${encodeURIComponent(billNumber)}`);
    return data.bill;
  },
  
  // Get sales report
  getReport: async (startDate: string, endDate: string, sellerId?: string): Promise<SalesReport> => {
    const body: any = { startDate, endDate };
    // Only include sellerId if provided and not 'all'
    if (sellerId && sellerId !== 'all') {
      body.sellerId = sellerId;
    }
    
    const data = await apiCall('/get-report', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return data.report;
  },

  // Delete bill
  deleteBill: async (billNumber: string): Promise<void> => {
    await apiCall(`/delete-bill/${encodeURIComponent(billNumber)}`, {
      method: 'DELETE',
    });
  },
};

export const stockAPI = {
  // Add new stock item
  addStock: async (item: Omit<StockItem, 'id' | 'createdAt'>): Promise<StockItem> => {
    const data = await apiCall('/add-stock', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return data.item;
  },
  
  // Get all stock items
  getAllStock: async (): Promise<StockItem[]> => {
    const data = await apiCall('/get-stock');
    return data.stock;
  },
  
  // Update stock item
  updateStock: async (id: string, updates: Partial<StockItem>): Promise<StockItem> => {
    const data = await apiCall('/update-stock', {
      method: 'POST',
      body: JSON.stringify({ id, updates }),
    });
    return data.item;
  },
  
  // Delete stock item
  deleteStock: async (id: string): Promise<void> => {
    await apiCall(`/delete-stock/${id}`, {
      method: 'DELETE',
    });
  },
};

export const settingsAPI = {
  // Save business settings
  saveSettings: async (settings: BusinessSettings): Promise<BusinessSettings> => {
    const data = await apiCall('/save-settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
    return data.settings;
  },
  
  // Get business settings
  getSettings: async (): Promise<BusinessSettings | null> => {
    const data = await apiCall('/get-settings');
    return data.settings;
  },
};