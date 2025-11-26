import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { User } from '../types';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LoginProps {
  onLogin: (user: User, accessToken: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isInitAdmin, setIsInitAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f305f05f/check-admin-exists`
      );

      const result = await response.json();

      if (result.success && !result.adminExists) {
        setIsInitAdmin(true);
        setIsLogin(false);
      }
    } catch (error) {
      console.log('Error checking admin:', error);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || ((!isLogin || isInitAdmin) && !name)) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      if (isInitAdmin) {
        // Create first admin user
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f305f05f/init-admin`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              username,
              password,
              name,
            }),
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create admin user');
        }

        toast.success('Admin account created! Please login.');
        setIsInitAdmin(false);
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setName('');
      } else if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${username}@sales-billing.local`,
          password: password,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data.session) {
          throw new Error('No session returned');
        }

        // Fetch user details from backend
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f305f05f/get-user`,
          {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
            },
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to get user details');
        }

        toast.success('Login successful!');
        onLogin(result.user, data.session.access_token);
      } else {
        // Signup
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f305f05f/signup`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              username,
              password,
              name,
              role: 'seller',
            }),
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Signup failed');
        }

        toast.success('Account created! Please login.');
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setName('');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isInitAdmin ? 'Create Admin Account' : isLogin ? 'Login' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isInitAdmin 
              ? 'Create the first admin account to get started' 
              : isLogin 
              ? 'Enter your credentials to access the system' 
              : 'Create a new seller account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={loading}
              />
            </div>

            {(!isLogin || isInitAdmin) && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : isInitAdmin ? 'Create Admin' : isLogin ? 'Login' : 'Sign Up'}
            </Button>

            {!isInitAdmin && (
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                </button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}