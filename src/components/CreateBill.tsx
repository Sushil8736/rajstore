import { useState, useEffect } from 'react';
import { billAPI, stockAPI, settingsAPI } from '../utils/api';
import type { Bill, BillItem, StockItem, BusinessSettings, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Plus, Trash2, Save, Printer, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { BillPreview } from './BillPreview';

interface CreateBillProps {
  user: User | null;
}

export function CreateBill({ user }: CreateBillProps) {
  const [billNumber, setBillNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'' | 'Cash' | 'UPI' | 'Card'>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<BillItem[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeBill();
    loadStock();
    loadSettings();
  }, []);

  const initializeBill = async () => {
    try {
      const nextBillNumber = await billAPI.getNextBillNumber();
      setBillNumber(nextBillNumber);
    } catch (error) {
      console.error('Error getting bill number:', error);
      toast.error('Failed to initialize bill');
    }
  };

  const loadStock = async () => {
    try {
      const stock = await stockAPI.getAllStock();
      setStockItems(stock);
    } catch (error) {
      console.error('Error loading stock:', error);
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

  const addItem = () => {
    const newItem: BillItem = {
      id: `item-${Date.now()}`,
      name: '',
      quantity: 1,
      rate: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof BillItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Recalculate total
        if (field === 'quantity' || field === 'rate') {
          updated.total = updated.quantity * updated.rate;
        }
        
        // If stock item selected, pre-fill details
        if (field === 'stockId' && value) {
          const stockItem = stockItems.find(s => s.id === value);
          if (stockItem) {
            updated.name = stockItem.name;
            updated.rate = stockItem.purchaseRate || 0;
            updated.total = updated.quantity * updated.rate;
          }
        }
        
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSaveBill = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (items.some(item => !item.name || item.quantity <= 0 || item.rate <= 0)) {
      toast.error('Please fill all item details');
      return;
    }

    setLoading(true);
    try {
      const bill: Bill = {
        billNumber,
        date: new Date().toISOString(),
        customerName: customerName || undefined,
        items,
        grandTotal: calculateGrandTotal(),
        paymentMode: paymentMode || undefined,
        notes: notes || undefined,
        businessName: settings?.businessName,
        sellerId: user?.id,
        sellerName: user?.name,
      };

      await billAPI.createBill(bill);
      setCreatedBill(bill);
      toast.success('Bill created successfully!');
      
      // Reset form
      setCustomerName('');
      setPaymentMode('');
      setNotes('');
      setItems([]);
      initializeBill();
      loadStock(); // Refresh stock to show updated quantities
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (createdBill) {
      setShowPreview(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Create Bill</h1>
          <p className="text-muted-foreground">Bill Number: {billNumber}</p>
        </div>
        {createdBill && (
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Last Bill
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode (Optional)</Label>
              <Select value={paymentMode} onValueChange={(value: any) => setPaymentMode(value)}>
                <SelectTrigger id="paymentMode">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No items added. Click "Add Item" to start.
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p>Item {index + 1}</p>
                    <Button
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select from Stock (Optional)</Label>
                      <Select
                        value={item.stockId || ''}
                        onValueChange={(value) => updateItem(item.id, 'stockId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stock item" />
                        </SelectTrigger>
                        <SelectContent>
                          {stockItems.map(stock => (
                            <SelectItem key={stock.id} value={stock.id}>
                              {stock.name} (Qty: {stock.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Product Name</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Enter product name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rate (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total (₹)</Label>
                      <Input
                        type="number"
                        value={item.total.toFixed(2)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p>Grand Total:</p>
              <p className="text-2xl">
                ₹{calculateGrandTotal().toFixed(2)}
              </p>
            </div>

            <Button
              onClick={handleSaveBill}
              className="w-full"
              disabled={loading || items.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Bill'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && createdBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2>Bill Preview</h2>
              <Button onClick={() => setShowPreview(false)} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <BillPreview bill={createdBill} settings={settings} />
              <div className="mt-4 flex gap-2">
                <Button onClick={() => window.print()} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button onClick={() => setShowPreview(false)} variant="outline" className="flex-1">
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