import { useEffect, useState } from 'react';
import { stockAPI } from '../utils/api';
import type { StockItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Pencil, Trash2, Package, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function StockManagement() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    purchaseRate: 0,
  });

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    try {
      const stock = await stockAPI.getAllStock();
      setStockItems(stock);
    } catch (error) {
      console.error('Error loading stock:', error);
      toast.error('Failed to load stock');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: 0,
      purchaseRate: 0,
    });
    setEditingItem(null);
  };

  const handleAdd = async () => {
    if (!formData.name || formData.quantity < 0) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await stockAPI.addStock({
        name: formData.name,
        quantity: formData.quantity,
        purchaseRate: formData.purchaseRate || undefined,
      });
      
      toast.success('Stock item added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      loadStock();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock item');
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !formData.name || formData.quantity < 0) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await stockAPI.updateStock(editingItem.id, {
        name: formData.name,
        quantity: formData.quantity,
        purchaseRate: formData.purchaseRate || undefined,
      });
      
      toast.success('Stock item updated successfully');
      setEditingItem(null);
      resetForm();
      loadStock();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await stockAPI.deleteStock(id);
      toast.success('Stock item deleted successfully');
      loadStock();
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast.error('Failed to delete stock item');
    }
  };

  const startEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      purchaseRate: item.purchaseRate || 0,
    });
  };

  const getTotalValue = () => {
    return stockItems.reduce((sum, item) => {
      return sum + (item.quantity * (item.purchaseRate || 0));
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Get stock level status and styling
  const getStockStatus = (quantity: number) => {
    if (quantity <= 10) {
      return {
        status: 'Low Stock',
        borderColor: 'border-l-4 border-red-500',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        icon: <AlertCircle className="h-4 w-4" />,
      };
    } else if (quantity <= 50) {
      return {
        status: 'Medium Stock',
        borderColor: 'border-l-4 border-yellow-500',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    } else {
      return {
        status: 'Good Stock',
        borderColor: 'border-l-4 border-green-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        icon: <CheckCircle className="h-4 w-4" />,
      };
    }
  };

  const getLowStockCount = () => {
    return stockItems.filter(item => item.quantity <= 10).length;
  };

  const getMediumStockCount = () => {
    return stockItems.filter(item => item.quantity > 10 && item.quantity <= 50).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Management</h1>
          <p className="text-muted-foreground">Manage your inventory</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Stock Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseRate">Purchase Rate (₹) (Optional)</Label>
                <Input
                  id="purchaseRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchaseRate}
                  onChange={(e) => setFormData({ ...formData, purchaseRate: Number(e.target.value) })}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Add Stock Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stock Level Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stockItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalValue())}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{getLowStockCount()}</div>
            <p className="text-xs text-red-600 mt-1">≤ 10 items</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{getMediumStockCount()}</div>
            <p className="text-xs text-yellow-600 mt-1">11-50 items</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Level Legend */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-red-700 font-medium">Low (≤10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-yellow-700 font-medium">Medium (11-50)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-green-700 font-medium">Good (50)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          {stockItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No stock items yet. Click "Add Stock" to start.
            </p>
          ) : (
            <div className="space-y-3">
              {stockItems
                .sort((a, b) => a.quantity - b.quantity) // Sort by quantity (lowest first)
                .map(item => {
                  const status = getStockStatus(item.quantity);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all ${status.borderColor} ${status.bgColor}`}
                    >
                      <div className="flex-1 flex items-start gap-3">
                        <div className={status.textColor}>
                          {status.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{item.name}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${status.textColor} bg-white border border-current`}>
                              {status.status}
                            </span>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className={`font-semibold ${status.textColor}`}>
                              Qty: {item.quantity}
                            </span>
                            {item.purchaseRate && (
                              <>
                                <span className="text-muted-foreground">
                                  Rate: {formatCurrency(item.purchaseRate)}
                                </span>
                                <span className="text-muted-foreground">
                                  Value: {formatCurrency(item.quantity * item.purchaseRate)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => {
                          if (!open) {
                            setEditingItem(null);
                            resetForm();
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button onClick={() => startEdit(item)} variant="outline" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Stock Item</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Product Name *</Label>
                                <Input
                                  id="edit-name"
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-quantity">Quantity *</Label>
                                <Input
                                  id="edit-quantity"
                                  type="number"
                                  min="0"
                                  value={formData.quantity}
                                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-purchaseRate">Purchase Rate (₹) (Optional)</Label>
                                <Input
                                  id="edit-purchaseRate"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.purchaseRate}
                                  onChange={(e) => setFormData({ ...formData, purchaseRate: Number(e.target.value) })}
                                />
                              </div>
                              <Button onClick={handleUpdate} className="w-full">
                                Update Stock Item
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}