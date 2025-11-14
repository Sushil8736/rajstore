import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { User } from '../types';
import { UserPlus, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SellerManagementProps {
  accessToken: string;
  currentUser: User;
}

export function SellerManagement({ accessToken, currentUser }: SellerManagementProps) {
  const [sellers, setSellers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSeller, setNewSeller] = useState({
    username: '',
    password: '',
    name: '',
  });

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f305f05f/get-sellers`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setSellers(result.sellers);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error loading sellers:', error);
      toast.error('Failed to load sellers');
    }
  };

  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSeller.username || !newSeller.password || !newSeller.name) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f305f05f/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...newSeller,
            role: 'seller',
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Seller added successfully');
        setNewSeller({ username: '', password: '', name: '' });
        setIsDialogOpen(false);
        loadSellers();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error adding seller:', error);
      toast.error(error.message || 'Failed to add seller');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeller = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this seller?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f305f05f/delete-seller/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Seller deleted successfully');
        loadSellers();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error deleting seller:', error);
      toast.error('Failed to delete seller');
    }
  };

  // Only admins can manage sellers
  if (currentUser.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seller Management</CardTitle>
          <CardDescription>Only administrators can manage sellers</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Seller Management</CardTitle>
            <CardDescription>Manage seller accounts</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Seller
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Seller</DialogTitle>
                <DialogDescription>Create a new seller account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSeller} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newSeller.username}
                    onChange={(e) => setNewSeller({ ...newSeller, username: e.target.value })}
                    placeholder="Enter username"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newSeller.name}
                    onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                    placeholder="Enter full name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newSeller.password}
                    onChange={(e) => setNewSeller({ ...newSeller, password: e.target.value })}
                    placeholder="Enter password"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Seller'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.map((seller) => (
              <TableRow key={seller.id}>
                <TableCell>{seller.name}</TableCell>
                <TableCell>{seller.username}</TableCell>
                <TableCell>
                  <Badge variant={seller.role === 'admin' ? 'default' : 'secondary'}>
                    {seller.role}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(seller.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {seller.id !== currentUser.id && seller.role !== 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSeller(seller.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sellers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No sellers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
