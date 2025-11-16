import { useState } from 'react';
import { billAPI } from '../utils/api';
import type { SalesReport } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart3, TrendingUp, FileText, IndianRupee, Percent } from 'lucide-react';
import { toast } from 'sonner';

export function Reports() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const generateReport = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      // Don't send sellerId at all if we want all sellers
      const reportData = await billAPI.getReport(startDate, endDate);
      setReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const getTodayReport = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    generateReport(today.toISOString(), endDate.toISOString());
  };

  const getMonthlyReport = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    generateReport(startOfMonth.toISOString(), endOfMonth.toISOString());
  };

  const getFinancialYearReport = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Financial year in India: April 1 to March 31
    let startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const startDate = new Date(startYear, 3, 1); // April 1
    const endDate = new Date(startYear + 1, 2, 31, 23, 59, 59, 999); // March 31
    
    generateReport(startDate.toISOString(), endDate.toISOString());
  };

  const getCustomReport = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    end.setHours(23, 59, 59, 999);
    
    if (start > end) {
      toast.error('Start date must be before end date');
      return;
    }
    
    generateReport(start.toISOString(), end.toISOString());
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <p className="text-muted-foreground">Generate and view sales reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick">Quick Reports</TabsTrigger>
              <TabsTrigger value="custom">Custom Date Range</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quick" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={getTodayReport} variant="outline" disabled={loading}>
                  <FileText className="mr-2 h-4 w-4" />
                  Today's Report
                </Button>
                <Button onClick={getMonthlyReport} variant="outline" disabled={loading}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  This Month
                </Button>
                <Button onClick={getFinancialYearReport} variant="outline" disabled={loading}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Financial Year
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={getCustomReport} disabled={loading} className="w-full">
                Generate Custom Report
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Generating report...</p>
          </div>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(report.totalSales)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {report.totalBills} bills
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalBills}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Bill Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.totalBills > 0 ? report.totalSales / report.totalBills : 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per transaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(report.totalDiscount || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {formatCurrency(report.averageDiscount || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Mode Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(report.paymentModes).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No payment mode data available</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(report.paymentModes)
                    .sort(([, a], [, b]) => b - a)
                    .map(([mode, amount]) => (
                      <div key={mode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="font-medium">{mode}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(amount)}</div>
                          <div className="text-xs text-muted-foreground">
                            {((amount / report.totalSales) * 100).toFixed(1)}% of total
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
              <CardTitle>Bill Details ({report.bills.length} bills)</CardTitle>
            </CardHeader>
            <CardContent>
              {report.bills.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bills found for this period</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {report.bills.map(bill => (
                    <div
                      key={bill.billNumber}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{bill.billNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {bill.customerName || 'Walk-in Customer'}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(bill.date)}
                          </p>
                          {bill.sellerName && (
                            <p className="text-xs text-muted-foreground">
                              • Seller: {bill.sellerName}
                            </p>
                          )}
                        </div>
                        {bill.discountAmount && bill.discountAmount > 0 && (
                          <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                            <Percent className="h-3 w-3" />
                            Discount: {formatCurrency(bill.discountAmount)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {bill.subtotal && bill.subtotal !== bill.grandTotal && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatCurrency(bill.subtotal)}
                          </p>
                        )}
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(bill.grandTotal)}
                        </p>
                        {bill.paymentMode && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {bill.paymentMode}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}