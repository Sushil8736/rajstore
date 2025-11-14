import { useEffect, useState } from 'react';
import { stockAPI } from '../utils/api';
import type { StockItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
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
          <h1>Stock Management</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stockItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {stockItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(getTotalValue())}</div>
          </CardContent>
        </Card>
      </div>

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
              {stockItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p>{item.name}</p>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Qty: {item.quantity}</span>
                      {item.purchaseRate && (
                        <>
                          <span>Rate: {formatCurrency(item.purchaseRate)}</span>
                          <span>Value: {formatCurrency(item.quantity * item.purchaseRate)}</span>
                        </>
                      )}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
