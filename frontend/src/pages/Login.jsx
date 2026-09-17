import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import { FaWater, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ocean-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-[24px] p-8"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-4">
              <FaWater className="text-white text-xl" />
            </div>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-white/50 mt-1">Sign in to OceanSentinel AI</p>
          </div>

          <div className="mb-6 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <p className="text-[11px] mono text-cyan-400 uppercase tracking-widest mb-1">Demo Accounts</p>
            <p className="text-xs text-white/70">Researcher: researcher@oceansentinel.ai / researcher123</p>
            <p className="text-xs text-white/70">Admin: admin@oceansentinel.ai / admin123</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm transition"
                placeholder="you@marine.org"
              />
            </div>

            <div>
              <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm transition pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Don't have an account? <Link to="/register" className="text-cyan-400 hover:text-cyan-300">Register</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
