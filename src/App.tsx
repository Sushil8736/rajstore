import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { CreateBill } from './components/CreateBill';
import { BillHistory } from './components/BillHistory';
import { Reports } from './components/Reports';
import { StockManagement } from './components/StockManagement';
import { Settings } from './components/Settings';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import {
  LayoutDashboard,
  FileText,
  History,
  BarChart3,
  Package,
  Settings as SettingsIcon,
  Menu,
  X,
} from 'lucide-react';

type Page = 'dashboard' | 'create-bill' | 'history' | 'reports' | 'stock' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-bill' as Page, label: 'Create Bill', icon: FileText },
    { id: 'history' as Page, label: 'Bill History', icon: History },
    { id: 'reports' as Page, label: 'Reports', icon: BarChart3 },
    { id: 'stock' as Page, label: 'Stock', icon: Package },
    { id: 'settings' as Page, label: 'Settings', icon: SettingsIcon },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'create-bill':
        return <CreateBill />;
      case 'history':
        return <BillHistory />;
      case 'reports':
        return <Reports />;
      case 'stock':
        return <StockManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl">Sales & Billing</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 min-h-screen bg-white border-r sticky top-0">
          <div className="p-6">
            <h1 className="text-2xl">Sales & Billing</h1>
            <p className="text-sm text-muted-foreground mt-1">Management System</p>
          </div>
          <nav className="px-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleNavigate(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
            <aside className="bg-white w-64 min-h-screen">
              <div className="p-6 flex items-center justify-between border-b">
                <div>
                  <h2>Menu</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="p-3 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => handleNavigate(item.id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderPage()}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
