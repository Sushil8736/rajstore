import { useState, useEffect } from 'react';
import { billAPI, stockAPI, settingsAPI } from '../utils/api';
import type { Bill, BillItem, StockItem, BusinessSettings, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Plus, Trash2, Save, Printer, X, AlertCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { BillPreview } from './BillPreview';
import { Alert, AlertDescription } from './ui/alert';

interface CreateBillProps {
  user: User | null;
}

export function CreateBill({ user }: CreateBillProps) {
  const [billNumber, setBillNumber] = useState('');
  const [suggestedBillNumber, setSuggestedBillNumber] = useState('');
  const [billNumberError, setBillNumberError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'' | 'Cash' | 'UPI' | 'Card'>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<BillItem[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  
  // Discount states
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);

  useEffect(() => {
    loadStock();
    loadSettings();
    loadSuggestedBillNumber();
  }, []);

  const loadSuggestedBillNumber = async () => {
    try {
      // Use the API endpoint to get suggested bill number
      const suggested = await billAPI.getNextBillNumber();
      setSuggestedBillNumber(suggested);
    } catch (error) {
      console.error('Error loading suggested bill number:', error);
      // Fallback if API fails
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      setSuggestedBillNumber(`${year}-${month}-001`);
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

  const checkBillNumberUnique = async (number: string): Promise<boolean> => {
    try {
      // Use the API endpoint to check if bill exists
      const bill = await billAPI.getBillByNumber(number);
      // If bill exists, it's not unique
      return bill === null;
    } catch (error) {
      // If error (404 or other), assume it's unique
      console.log('Bill number check:', error);
      return true;
    }
  };

  const handleBillNumberChange = (value: string) => {
    setBillNumber(value);
    setBillNumberError('');
  };

  const useSuggestedNumber = async () => {
    // Fetch fresh suggestion from API
    try {
      const freshSuggestion = await billAPI.getNextBillNumber();
      setSuggestedBillNumber(freshSuggestion);
      setBillNumber(freshSuggestion);
      setBillNumberError('');
    } catch (error) {
      console.error('Error fetching fresh suggestion:', error);
      // Fallback to current suggestion
      setBillNumber(suggestedBillNumber);
      setBillNumberError('');
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
        
        if (field === 'quantity' || field === 'rate') {
          updated.total = updated.quantity * updated.rate;
        }
        
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

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'fixed') {
      return Math.min(discountValue, subtotal);
    } else {
      return (subtotal * discountValue) / 100;
    }
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscountAmount();
    return Math.max(0, subtotal - discount);
  };

  const handleSaveBill = async () => {
    // Validation
    if (!billNumber.trim()) {
      setBillNumberError('Bill number is required');
      toast.error('Please enter a bill number');
      return;
    }

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
      // Check bill number uniqueness using API
      const isUnique = await checkBillNumberUnique(billNumber.trim());
      if (!isUnique) {
        setBillNumberError('This bill number already exists');
        toast.error('Bill number already exists. Please use a different number.');
        setLoading(false);
        return;
      }

      // Auto-create stock for manual entries
      for (const item of items) {
        if (!item.stockId && item.name) {
          const exists = stockItems.some(stock => stock.name.toLowerCase() === item.name.toLowerCase());
          if (!exists) {
            await stockAPI.addStock({
              name: item.name,
              quantity: item.quantity,
              purchaseRate: item.rate,
            });
          }
        }
      }

      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscountAmount();
      const grandTotal = calculateGrandTotal();

      const bill: Bill = {
        billNumber: billNumber.trim(),
        date: new Date().toISOString(),
        customerName: customerName || undefined,
        items,
        subtotal,
        discountType: discountValue > 0 ? discountType : undefined,
        discountValue: discountValue > 0 ? discountValue : undefined,
        discountAmount: discountValue > 0 ? discountAmount : undefined,
        grandTotal,
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
      setDiscountType('fixed');
      setDiscountValue(0);
      setBillNumber('');
      setBillNumberError('');
      loadSuggestedBillNumber(); // Reload suggestion after creating bill
      loadStock();
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
          <h1 className="text-2xl font-bold">Create Bill</h1>
          <p className="text-muted-foreground">Enter bill details and items</p>
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
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number *</Label>
              <div className="flex gap-2">
                <Input
                  id="billNumber"
                  value={billNumber}
                  onChange={(e) => handleBillNumberChange(e.target.value)}
                  placeholder="e.g., Bill-2025-11-001"
                  className={billNumberError ? 'border-red-500 flex-1' : 'flex-1'}
                />
                {suggestedBillNumber && (billNumber !== suggestedBillNumber || billNumberError) && (
                  <Button
                    onClick={useSuggestedNumber}
                    variant="outline"
                    size="icon"
                    title={billNumberError ? 'Get fresh suggestion from API' : `Use suggested: ${suggestedBillNumber}`}
                    className={billNumberError ? 'border-green-500 text-green-600' : ''}
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {suggestedBillNumber && !billNumber && (
                <p className="text-xs text-muted-foreground">
                  Suggested: {suggestedBillNumber}
                </p>
              )}
              {billNumberError && (
                <Alert className="border-red-200 bg-red-50 py-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {billNumberError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

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
                    <p className="font-medium">Item {index + 1}</p>
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
                          <div className="px-2 py-1 sticky top-0 bg-white z-10">
                            <Input
                              type="text"
                              placeholder="Search stock..."
                              value={stockSearch}
                              onChange={e => setStockSearch(e.target.value)}
                              className="mb-2"
                            />
                          </div>
                          {stockItems.filter(stock => stock.name.toLowerCase().includes(stockSearch.toLowerCase())).map(stock => (
                            <SelectItem key={stock.id} value={stock.id}>
                              {stock.name} (Qty: {stock.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Product Name *</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Enter product name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rate (₹) *</Label>
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
        <CardHeader>
          <CardTitle>Discount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountType">Discount Type</Label>
              <Select value={discountType} onValueChange={(value: any) => setDiscountType(value)}>
                <SelectTrigger id="discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                step={discountType === 'percentage' ? '0.01' : '1'}
                max={discountType === 'percentage' ? '100' : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder="Enter discount"
              />
            </div>
          </div>
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

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between text-lg">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              
              {discountValue > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Discount ({discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`}):
                  </span>
                  <span>- ₹{calculateDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xl font-bold">Grand Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{calculateGrandTotal().toFixed(2)}
                </span>
              </div>
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
              <h2 className="text-xl font-bold">Bill Preview</h2>
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