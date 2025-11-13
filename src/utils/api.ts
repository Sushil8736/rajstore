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
  getNextBillNumber: async (): Promise<string> => {
    const data = await apiCall('/get-next-bill-number', {
      method: 'POST',
    });
    return data.billNumber;
  },
  
  createBill: async (bill: Bill): Promise<Bill> => {
    const data = await apiCall('/create-bill', {
      method: 'POST',
      body: JSON.stringify(bill),
    });
    return data.bill;
  },
  
  getAllBills: async (): Promise<Bill[]> => {
    const data = await apiCall('/get-bills');
    return data.bills;
  },
  
  getBill: async (billNumber: string): Promise<Bill> => {
    const data = await apiCall(`/get-bill/${billNumber}`);
    return data.bill;
  },
  
  getReport: async (startDate: string, endDate: string): Promise<SalesReport> => {
    const data = await apiCall('/get-report', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
    return data.report;
  },
};

export const stockAPI = {
  addStock: async (item: Omit<StockItem, 'id' | 'createdAt'>): Promise<StockItem> => {
    const data = await apiCall('/add-stock', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return data.item;
  },
  
  getAllStock: async (): Promise<StockItem[]> => {
    const data = await apiCall('/get-stock');
    return data.stock;
  },
  
  updateStock: async (id: string, updates: Partial<StockItem>): Promise<StockItem> => {
    const data = await apiCall('/update-stock', {
      method: 'POST',
      body: JSON.stringify({ id, updates }),
    });
    return data.item;
  },
  
  deleteStock: async (id: string): Promise<void> => {
    await apiCall(`/delete-stock/${id}`, {
      method: 'DELETE',
    });
  },
};

export const settingsAPI = {
  saveSettings: async (settings: BusinessSettings): Promise<BusinessSettings> => {
    const data = await apiCall('/save-settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
    return data.settings;
  },
  
  getSettings: async (): Promise<BusinessSettings | null> => {
    const data = await apiCall('/get-settings');
    return data.settings;
  },
};
