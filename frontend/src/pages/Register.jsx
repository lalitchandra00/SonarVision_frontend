import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import { FaWater } from 'react-icons/fa';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', organization: '', role: 'researcher' });
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created successfully');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ocean-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-[480px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-[24px] p-8"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-4">
              <FaWater className="text-white text-xl" />
            </div>
            <h1 className="text-2xl font-bold">Join OceanSentinel</h1>
            <p className="text-sm text-white/50 mt-1">Create your marine research account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
                  placeholder="Dr. Sarah Ocean"
                />
              </div>
              <div>
                <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
                >
                  <option value="researcher">Researcher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
                placeholder="sarah@marine-research.org"
              />
            </div>

            <div>
              <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Organization</label>
              <input
                type="text"
                required
                value={form.organization}
                onChange={e => setForm({ ...form, organization: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
                placeholder="Marine Research Institute"
              />
            </div>

            <div>
              <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
                placeholder="Minimum 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
