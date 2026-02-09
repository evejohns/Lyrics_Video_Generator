import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response: any = await authApi.login({ email, password });
      // Response is already unwrapped by axios interceptor
      // Backend returns: { success: true, data: { user, token } }
      // Axios interceptor returns response.data, so we get the whole object
      setAuth(response.data.user, response.data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error?.error || error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipLogin = () => {
    // Dev mode: Skip authentication
    const mockUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@example.com',
      name: 'Dev User',
      plan: 'pro',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockToken = 'dev-token-placeholder';
    setAuth(mockUser as any, mockToken);
    toast.success('Logged in as Dev User (bypassed auth)');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-3xl font-display font-bold mb-6 text-center">Welcome Back</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Dev Mode: Skip Login */}
        <button
          onClick={handleSkipLogin}
          className="mt-4 w-full btn-secondary text-sm"
        >
          🚀 Skip Login (Dev Mode)
        </button>

        <p className="mt-6 text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-500 hover:text-primary-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
