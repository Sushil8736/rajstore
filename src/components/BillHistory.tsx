import { useEffect, useState } from 'react';
import { billAPI, settingsAPI } from '../utils/api';
import type { Bill, BusinessSettings } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Printer, Eye, Trash2 } from 'lucide-react';
import { BillPreview } from './BillPreview';
import { toast } from 'sonner';

export function BillHistory() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
    loadSettings();
  }, []);

  useEffect(() => {
    filterBills();
  }, [searchTerm, bills]);

  const loadBills = async () => {
    try {
      const allBills = await billAPI.getAllBills();
      setBills(allBills);
      setFilteredBills(allBills);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const businessSettings = await settingsAPI.getSettings();
      setSettings(businessSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const filterBills = () => {
    if (!searchTerm) {
      setFilteredBills(bills);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = bills.filter(bill => 
      bill.billNumber.toLowerCase().includes(term) ||
      bill.customerName?.toLowerCase().includes(term) ||
      bill.date.includes(term)
    );
    setFilteredBills(filtered);
  };

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

  const handleDelete = async (billNumber: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) {
      return;
    }

    try {
      await billAPI.deleteBill(billNumber);
      toast.success('Bill deleted successfully');
      loadBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bill History</h1>
        <p className="text-muted-foreground">View and search all bills</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bill number, customer name, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? 'No bills found matching your search' : 'No bills created yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredBills.map(bill => (
                <div
                  key={bill.billNumber}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{bill.billNumber}</p>
                        {bill.paymentMode && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {bill.paymentMode}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {bill.customerName || 'Walk-in Customer'}
                      </p>
                      {bill.sellerName && (
                        <p className="text-xs text-muted-foreground">
                          Seller: {bill.sellerName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(bill.date)}
                      </p>
                      <div className="mt-2 text-sm space-y-1">
                        <p className="text-muted-foreground">
                          {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                        </p>
                        {bill.discountValue && bill.discountValue > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                              Discount: {bill.discountType === 'percentage' 
                                ? `${bill.discountValue}%` 
                                : formatCurrency(bill.discountValue)}
                            </span>
                            <span className="text-muted-foreground">
                              Saved: {formatCurrency(bill.discountAmount || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="space-y-1">
                        {bill.subtotal && bill.subtotal !== bill.grandTotal && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatCurrency(bill.subtotal)}
                          </p>
                        )}
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(bill.grandTotal)}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => setSelectedBill(bill)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          onClick={() => handleDelete(bill.billNumber)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Bill Details</h2>
              <Button onClick={() => setSelectedBill(null)} variant="ghost" size="sm">
                Close
              </Button>
            </div>
            <div className="p-4">
              <BillPreview bill={selectedBill} settings={settings} />
              <div className="mt-4 flex gap-2">
                <Button onClick={() => window.print()} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button onClick={() => setSelectedBill(null)} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}