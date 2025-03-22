
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const { login, isAuthenticated, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from || '/dashboard';
  
  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  useEffect(() => {
    // Show auth error if present
    if (error) {
      setLoginError(error);
    }
  }, [error]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (err) {
      setLoginError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Demo logins
  const demoUsers = [
    { role: 'Reader', email: 'reader@example.com', password: 'password123' },
    { role: 'Librarian', email: 'librarian@example.com', password: 'password123' },
    { role: 'Admin', email: 'admin@example.com', password: 'password123' },
  ];
  
  const loginAsUser = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    login(email, password);
  };
  
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Left side - Logo and Brand */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-gradient-to-br from-accent to-accent/20">
        <div className="text-center lg:text-left max-w-lg animate-fade-in">
          <div className="mb-6 flex justify-center lg:justify-start">
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">IBT Library</h1>
          <p className="text-lg text-muted-foreground mb-8">
            A modern library management system for readers and librarians.
          </p>
          <div className="hidden lg:block">
            <h2 className="text-xl font-medium mb-3">Key Features</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Browse and search the entire book catalog</li>
              <li>Keep track of your borrowed books</li>
              <li>Manage books and loans as a librarian</li>
              <li>Scan ISBN codes to quickly add new books</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md animate-slide-in-up">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-md text-sm bg-destructive/10 text-destructive">
                  {loginError}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            
            <div className="mt-6">
              <p className="text-sm text-center text-muted-foreground">
                Demo Accounts
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                {demoUsers.map((user) => (
                  <Button
                    key={user.role}
                    variant="outline"
                    size="sm"
                    onClick={() => loginAsUser(user.email, user.password)}
                    className="text-xs"
                  >
                    {user.role} Account
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
