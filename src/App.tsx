import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { CreateBill } from './components/CreateBill';
import { BillHistory } from './components/BillHistory';
import { Reports } from './components/Reports';
import { StockManagement } from './components/StockManagement';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { User } from './types';
import { supabase } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import {
  LayoutDashboard,
  FileText,
  History,
  BarChart3,
  Package,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

type Page = 'dashboard' | 'create-bill' | 'history' | 'reports' | 'stock' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.access_token) {
        // Fetch user details
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f305f05f/get-user`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        const result = await response.json();

        if (result.success) {
          setUser(result.user);
          setAccessToken(session.access_token);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (loggedInUser: User, token: string) => {
    setUser(loggedInUser);
    setAccessToken(token);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setCurrentPage('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

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
        return <CreateBill user={user} />;
      case 'history':
        return <BillHistory />;
      case 'reports':
        return <Reports />;
      case 'stock':
        return <StockManagement />;
      case 'settings':
        return <Settings user={user} accessToken={accessToken} />;
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
          <div>
            <h1 className="text-xl">Sales & Billing</h1>
            <p className="text-xs text-muted-foreground">{user.name}</p>
          </div>
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
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
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
          <div className="p-3 mt-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
            <aside className="bg-white w-64 min-h-screen">
              <div className="p-6 flex items-center justify-between border-b">
                <div>
                  <h2>Menu</h2>
                  <p className="text-sm text-muted-foreground mt-1">{user.name}</p>
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
              <div className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
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