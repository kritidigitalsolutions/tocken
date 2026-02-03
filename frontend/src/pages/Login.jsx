import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import API from '../api/api';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/admin/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        // Save token to localStorage
        localStorage.setItem('adminToken', response.data.token);
        
        // Save admin info
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
        
        // Redirect to dashboard
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      {/* Theme Toggle - Top Right */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 p-3 rounded-xl transition-all duration-300 shadow-lg ${
          isDark 
            ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' 
            : 'bg-white hover:bg-gray-100 text-indigo-600'
        }`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun size={22} /> : <Moon size={22} />}
      </button>

      {/* Login Card */}
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-8 transition-all duration-300 ${
        isDark 
          ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700' 
          : 'bg-white/80 backdrop-blur-xl border border-gray-100'
      }`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome Back
          </h1>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Sign in to your admin account
          </p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            isDark 
              ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Email Address
            </label>
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                  isDark 
                    ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="admin@realestate.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full pl-11 pr-12 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                  isDark 
                    ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
            } text-white`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className={`mt-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Admin Panel • Secure Login
        </p>
      </div>
    </div>
  );
}
