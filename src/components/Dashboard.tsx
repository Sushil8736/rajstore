import { useEffect, useState } from 'react';
import { billAPI } from '../utils/api';
import type { Bill } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { IndianRupee, FileText, TrendingUp, Calendar } from 'lucide-react';

export function Dashboard() {
  const [todayStats, setTodayStats] = useState({
    totalSales: 0,
    totalBills: 0,
    cashSales: 0,
    digitalSales: 0,
  });
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const bills = await billAPI.getAllBills();
      
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter today's bills
      const todayBills = bills.filter(bill => {
        const billDate = new Date(bill.date);
        billDate.setHours(0, 0, 0, 0);
        return billDate.getTime() === today.getTime();
      });
      
      // Calculate stats
      const totalSales = todayBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
      const cashSales = todayBills
        .filter(bill => bill.paymentMode === 'Cash')
        .reduce((sum, bill) => sum + bill.grandTotal, 0);
      const digitalSales = todayBills
        .filter(bill => bill.paymentMode === 'UPI' || bill.paymentMode === 'Card')
        .reduce((sum, bill) => sum + bill.grandTotal, 0);
      
      setTodayStats({
        totalSales,
        totalBills: todayBills.length,
        cashSales,
        digitalSales,
      });
      
      // Get recent 5 bills
      setRecentBills(bills.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">Overview of today's sales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(todayStats.totalSales)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{todayStats.totalBills}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Cash Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(todayStats.cashSales)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Digital Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(todayStats.digitalSales)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBills.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No bills created yet</p>
          ) : (
            <div className="space-y-4">
              {recentBills.map(bill => (
                <div
                  key={bill.billNumber}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p>{bill.billNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {bill.customerName || 'Walk-in Customer'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bill.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>{formatCurrency(bill.grandTotal)}</p>
                    {bill.paymentMode && (
                      <p className="text-sm text-muted-foreground">{bill.paymentMode}</p>
                    )}
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
