import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper function to verify auth
async function verifyAuth(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return null;
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }
  
  return user;
}

// Signup route
app.post('/make-server-f305f05f/signup', async (c) => {
  try {
    const { username, password, name, role } = await c.req.json();
    
    if (!username || !password || !name) {
      return c.json({ error: 'Missing required fields', success: false }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: `${username}@sales-billing.local`,
      password: password,
      user_metadata: { name, username, role: role || 'seller' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message, success: false }, 400);
    }

    // Store user info in KV
    const userInfo = {
      id: data.user.id,
      username,
      name,
      role: role || 'seller',
      createdAt: new Date().toISOString()
    };

    await kv.set(`user:${data.user.id}`, userInfo);

    return c.json({ success: true, user: userInfo });
  } catch (error) {
    console.log('Error in signup:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Get current user info
app.get('/make-server-f305f05f/get-user', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized', success: false }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return c.json({ error: 'User not found', success: false }, 404);
    }

    const userInfo = typeof userData === 'string' ? JSON.parse(userData) : userData;
    return c.json({ success: true, user: userInfo });
  } catch (error) {
    console.log('Error getting user:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Get all sellers (admin only)
app.get('/make-server-f305f05f/get-sellers', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized', success: false }, 401);
    }

    const currentUserData = await kv.get(`user:${user.id}`);
    const currentUser = typeof currentUserData === 'string' ? JSON.parse(currentUserData) : currentUserData;

    if (currentUser?.role !== 'admin') {
      return c.json({ error: 'Admin access required', success: false }, 403);
    }

    const sellers = await kv.getByPrefix('user:');
    const sellerList = sellers
      .map(item => typeof item === 'string' ? JSON.parse(item) : item)
      .sort((a, b) => a.name.localeCompare(b.name));

    return c.json({ success: true, sellers: sellerList });
  } catch (error) {
    console.log('Error getting sellers:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Delete seller (admin only)
app.delete('/make-server-f305f05f/delete-seller/:userId', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized', success: false }, 401);
    }

    const currentUserData = await kv.get(`user:${user.id}`);
    const currentUser = typeof currentUserData === 'string' ? JSON.parse(currentUserData) : currentUserData;

    if (currentUser?.role !== 'admin') {
      return c.json({ error: 'Admin access required', success: false }, 403);
    }

    const userId = c.req.param('userId');

    // Delete from KV store
    await kv.del(`user:${userId}`);

    // Delete from Supabase Auth
    await supabase.auth.admin.deleteUser(userId);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting seller:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Get next bill number
app.post('/make-server-f305f05f/get-next-bill-number', async (c) => {
  try {
    const counterKey = 'counter:bill';
    const counter = await kv.get(counterKey);
    const nextNumber = counter ? Number(counter) + 1 : 1;
    await kv.set(counterKey, nextNumber);
    
    // Format: BILL-YYYY-XXXX
    const year = new Date().getFullYear();
    const billNumber = `BILL-${year}-${String(nextNumber).padStart(4, '0')}`;
    
    return c.json({ billNumber, success: true });
  } catch (error) {
    console.log('Error getting next bill number:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Create a new bill
app.post('/make-server-f305f05f/create-bill', async (c) => {
  try {
    const bill = await c.req.json();
    
    // Store bill
    await kv.set(`bill:${bill.billNumber}`, bill);
    
    // Update stock quantities if items have stockIds
    if (bill.items && Array.isArray(bill.items)) {
      for (const item of bill.items) {
        if (item.stockId) {
          const stockItem = await kv.get(`stock:${item.stockId}`);
          if (stockItem) {
            const stock = typeof stockItem === 'string' ? JSON.parse(stockItem) : stockItem;
            stock.quantity = Math.max(0, stock.quantity - item.quantity);
            await kv.set(`stock:${item.stockId}`, stock);
          }
        }
      }
    }
    
    return c.json({ success: true, bill });
  } catch (error) {
    console.log('Error creating bill:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Get all bills
app.get('/make-server-f305f05f/get-bills', async (c) => {
  try {
    const bills = await kv.getByPrefix('bill:');
    const billObjects = bills
      .map(item => typeof item === 'string' ? JSON.parse(item) : item)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return c.json({ bills: billObjects, success: true });
  } catch (error) {
    console.log('Error getting bills:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Get bill by number
app.get('/make-server-f305f05f/get-bill/:billNumber', async (c) => {
  try {
    const billNumber = c.req.param('billNumber');
    const billData = await kv.get(`bill:${billNumber}`);
    
    if (!billData) {
      return c.json({ error: 'Bill not found', success: false }, 404);
    }
    
    const bill = typeof billData === 'string' ? JSON.parse(billData) : billData;
    return c.json({ bill, success: true });
  } catch (error) {
    console.log('Error getting bill:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Get sales report
app.post('/make-server-f305f05f/get-report', async (c) => {
  try {
    const { startDate, endDate, sellerId } = await c.req.json();

    const bills = await kv.getByPrefix('bill:');
    const billObjects = bills.map(item => typeof item === 'string' ? JSON.parse(item) : item);

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let filteredBills = billObjects.filter(bill => {
      const billDate = new Date(bill.date);
      return billDate >= start && billDate <= end;
    });

    // Filter by seller if specified
    if (sellerId && sellerId !== 'all') {
      filteredBills = filteredBills.filter(bill => bill.sellerId === sellerId);
    }

    const totalSales = filteredBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const totalBills = filteredBills.length;

    // Group by payment mode
    const paymentModes = filteredBills.reduce((acc, bill) => {
      const mode = bill.paymentMode || 'Not Specified';
      acc[mode] = (acc[mode] || 0) + bill.grandTotal;
      return acc;
    }, {} as Record<string, number>);

    return c.json({
      success: true,
      report: {
        totalSales,
        totalBills,
        paymentModes,
        bills: filteredBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
    });
  } catch (error) {
    console.log('Error generating report:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Update bill
app.put('/make-server-f305f05f/update-bill', async (c) => {
  try {
    const bill = await c.req.json();

    if (!bill.billNumber) {
      return c.json({ error: 'Bill number is required', success: false }, 400);
    }

    // Check if bill exists
    const existingBillData = await kv.get(`bill:${bill.billNumber}`);
    if (!existingBillData) {
      return c.json({ error: 'Bill not found', success: false }, 404);
    }

    // Store updated bill
    await kv.set(`bill:${bill.billNumber}`, bill);

    return c.json({ success: true, bill });
  } catch (error) {
    console.log('Error updating bill:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Delete bill
app.delete('/make-server-f305f05f/delete-bill/:billNumber', async (c) => {
  try {
    const billNumber = c.req.param('billNumber');
    await kv.del(`bill:${billNumber}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting bill:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Add stock item
app.post('/make-server-f305f05f/add-stock', async (c) => {
  try {
    const stockItem = await c.req.json();
    const stockId = `stock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const item = {
      ...stockItem,
      id: stockId,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`stock:${stockId}`, item);
    
    return c.json({ success: true, item });
  } catch (error) {
    console.log('Error adding stock item:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Get all stock items
app.get('/make-server-f305f05f/get-stock', async (c) => {
  try {
    const stockItems = await kv.getByPrefix('stock:');
    const items = stockItems
      .map(item => typeof item === 'string' ? JSON.parse(item) : item)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return c.json({ stock: items, success: true });
  } catch (error) {
    console.log('Error getting stock:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Update stock item
app.post('/make-server-f305f05f/update-stock', async (c) => {
  try {
    const { id, updates } = await c.req.json();
    
    const stockData = await kv.get(`stock:${id}`);
    if (!stockData) {
      return c.json({ error: 'Stock item not found', success: false }, 404);
    }
    
    const stock = typeof stockData === 'string' ? JSON.parse(stockData) : stockData;
    const updatedStock = { ...stock, ...updates };
    
    await kv.set(`stock:${id}`, updatedStock);
    
    return c.json({ success: true, item: updatedStock });
  } catch (error) {
    console.log('Error updating stock:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Delete stock item
app.delete('/make-server-f305f05f/delete-stock/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`stock:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting stock item:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Save business settings
app.post('/make-server-f305f05f/save-settings', async (c) => {
  try {
    const settings = await c.req.json();
    await kv.set('settings:business', settings);
    
    return c.json({ success: true, settings });
  } catch (error) {
    console.log('Error saving settings:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Get business settings
app.get('/make-server-f305f05f/get-settings', async (c) => {
  try {
    const settingsData = await kv.get('settings:business');
    const settings = settingsData ? (typeof settingsData === 'string' ? JSON.parse(settingsData) : settingsData) : null;
    
    return c.json({ success: true, settings });
  } catch (error) {
    console.log('Error getting settings:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Initialize admin user (one-time setup)
app.post('/make-server-f305f05f/init-admin', async (c) => {
  try {
    const { username, password, name } = await c.req.json();
    
    if (!username || !password || !name) {
      return c.json({ error: 'Missing required fields', success: false }, 400);
    }

    // Check if any admin exists
    const users = await kv.getByPrefix('user:');
    const admins = users
      .map(item => typeof item === 'string' ? JSON.parse(item) : item)
      .filter(user => user.role === 'admin');
    
    if (admins.length > 0) {
      return c.json({ error: 'Admin user already exists', success: false }, 400);
    }

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: `${username}@sales-billing.local`,
      password: password,
      user_metadata: { name, username, role: 'admin' },
      email_confirm: true
    });

    if (error) {
      console.log('Admin creation error:', error);
      return c.json({ error: error.message, success: false }, 400);
    }

    const userInfo = {
      id: data.user.id,
      username,
      name,
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    await kv.set(`user:${data.user.id}`, userInfo);

    return c.json({ success: true, user: userInfo });
  } catch (error) {
    console.log('Error initializing admin:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Check if admin exists (public endpoint for initial setup)
app.get('/make-server-f305f05f/check-admin-exists', async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    const admins = users
      .map(item => typeof item === 'string' ? JSON.parse(item) : item)
      .filter(user => user.role === 'admin');
    
    return c.json({ 
      success: true, 
      adminExists: admins.length > 0,
      hasUsers: users.length > 0 
    });
  } catch (error) {
    console.log('Error checking admin exists:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

Deno.serve(app.fetch);