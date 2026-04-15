import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import API from '../api/api';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState('request');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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

  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!forgotEmail.trim()) {
      setError('Please enter admin email.');
      return;
    }

    try {
      setForgotLoading(true);
      const response = await API.post('/admin/auth/forgot-password/send-otp', {
        email: forgotEmail.trim().toLowerCase()
      });

      setSuccess(response?.data?.message || 'OTP sent successfully.');
      setForgotStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send OTP.');
      console.error('Forgot password send OTP error:', err);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!forgotOtp.trim()) {
      setError('Please enter OTP.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    try {
      setForgotLoading(true);
      const response = await API.post('/admin/auth/forgot-password/reset', {
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });

      setSuccess(response?.data?.message || 'Password reset successful.');
      setView('login');
      setForgotStep('request');
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setShowForgotPassword(false);
      setShowForgotConfirmPassword(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.');
      console.error('Forgot password reset error:', err);
    } finally {
      setForgotLoading(false);
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
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg ${
            isDark ? 'bg-slate-700/50' : 'bg-white'
          }`}>
            <img src="/logo.png" alt="Token Logo" className="w-full h-full object-contain p-1" />
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {view === 'login' ? 'Welcome Back' : 'Forgot Password'}
          </h1>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {view === 'login'
              ? 'Sign in to your admin account'
              : 'Reset admin password using OTP on email'}
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

        {success && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            isDark
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            {success}
          </div>
        )}

        {view === 'login' ? (
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
                autoComplete="username"
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
                autoComplete="current-password"
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

          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
              setView('forgot');
              setForgotStep('request');
              setForgotEmail(email || forgotEmail);
            }}
            className={`w-full text-sm font-medium transition-colors ${
              isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-500'
            }`}
          >
            Forgot Password?
          </button>
        </form>
        ) : (
        <form onSubmit={forgotStep === 'request' ? handleForgotRequestOtp : handleForgotResetPassword} className="space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Admin Email
            </label>
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                disabled={forgotStep === 'reset'}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                  isDark
                    ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } ${forgotStep === 'reset' ? 'opacity-80 cursor-not-allowed' : ''}`}
                placeholder="admin@realestate.com"
              />
            </div>
          </div>

          {forgotStep === 'reset' && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  OTP
                </label>
                <input
                  type="text"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    isDark
                      ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-400'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="Enter 6-digit OTP"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showForgotPassword ? 'text' : 'password'}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                    className={`w-full px-4 pr-12 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      isDark
                        ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showForgotPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showForgotConfirmPassword ? 'text' : 'password'}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    required
                    className={`w-full px-4 pr-12 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      isDark
                        ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showForgotConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={forgotLoading}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              forgotLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
            } text-white`}
          >
            {forgotLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Please wait...
              </>
            ) : forgotStep === 'request' ? (
              'Send OTP'
            ) : (
              'Reset Password'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
              setView('login');
              setForgotStep('request');
            }}
            className={`w-full text-sm font-medium transition-colors ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Back to Login
          </button>
        </form>
        )}

        {/* Footer */}
        <p className={`mt-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Admin Panel • Secure Login
        </p>
      </div>
    </div>
  );
}
