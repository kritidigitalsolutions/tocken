import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import toast, { Toaster } from "react-hot-toast";
import {
  Settings as SettingsIcon,
  Mail,
  Lock,
  Send,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { sendCredentialOtp, verifyCredentialOtp, updateCredentials } from "../../../api/admin.auth.api";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const STEPS = { INPUT: 1, OTP: 2, SUCCESS: 3 };

// ─── OTP Input component ───────────────────────────────────────────────────────
const OtpInput = ({ value, onChange, isDark }) => {
  const digits = value.split("");
  while (digits.length < 6) digits.push("");

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = [...digits];
    arr[index] = val;
    onChange(arr.join(""));
    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center my-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className={`w-11 h-12 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200 focus:scale-105 ${
            isDark
              ? "bg-slate-800 border-slate-600 text-white focus:border-indigo-500 focus:bg-slate-700"
              : "bg-gray-50 border-gray-300 text-gray-900 focus:border-indigo-500 focus:bg-white"
          }`}
        />
      ))}
    </div>
  );
};

// ─── A single card section ─────────────────────────────────────────────────────
const SectionCard = ({ children, isDark }) => (
  <div
    className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 ${
      isDark
        ? "bg-slate-900 border-slate-800"
        : "bg-white border-gray-200"
    }`}
  >
    {children}
  </div>
);

// ─── Step indicator ────────────────────────────────────────────────────────────
const StepBar = ({ step, isDark }) => {
  const steps = ["Enter Details", "Verify OTP", "Done"];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done
                    ? "bg-green-500 text-white"
                    : active
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-200/50"
                    : isDark
                    ? "bg-slate-700 text-slate-400"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <CheckCircle2 size={14} /> : num}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  active
                    ? "text-indigo-600"
                    : done
                    ? "text-green-600"
                    : isDark
                    ? "text-slate-500"
                    : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`flex-1 h-0.5 w-6 rounded transition-all duration-300 ${
                  done ? "bg-green-400" : isDark ? "bg-slate-700" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Email Update Section ──────────────────────────────────────────────────────
const EmailUpdateSection = ({ isDark }) => {
  const [step, setStep] = useState(STEPS.INPUT);
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep(STEPS.INPUT);
    setNewEmail("");
    setOtp("");
  };

  const handleSendOtp = async () => {
    if (!newEmail.trim()) return toast.error("Please enter a new email address");
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(newEmail)) return toast.error("Enter a valid email address");
    setLoading(true);
    try {
      await sendCredentialOtp("email_change", newEmail.trim());
      toast.success("OTP sent to your current registered email!");
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      await verifyCredentialOtp("email_change", otp);
      toast.success("OTP verified!");
      // immediately apply the change
      await updateCredentials("email_change");
      toast.success("Email updated successfully!");
      setStep(STEPS.SUCCESS);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard isDark={isDark}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Mail size={18} className="text-white" />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
            Change Email Address
          </h3>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            OTP will be sent to your current registered email
          </p>
        </div>
      </div>

      <StepBar step={step} isDark={isDark} />

      {/* Step 1 — Enter new email */}
      {step === STEPS.INPUT && (
        <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
              New Email Address
            </label>
            <div className="relative">
              <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newemail@example.com"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white"
                }`}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {/* Step 2 — Enter OTP */}
      {step === STEPS.OTP && (
        <div className="space-y-4">
          <p className={`text-sm text-center ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Enter the 6-digit OTP sent to your current email
          </p>
          <OtpInput value={otp} onChange={setOtp} isDark={isDark} />
          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length < 6}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            {loading ? "Verifying..." : "Verify & Update Email"}
          </button>
          <button
            onClick={() => setStep(STEPS.INPUT)}
            className={`w-full py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
              isDark
                ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 3 — Success */}
      {step === STEPS.SUCCESS && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} className="text-green-500" />
          </div>
          <div>
            <p className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
              Email Updated!
            </p>
            <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Your admin email has been successfully changed to{" "}
              <span className="font-medium text-indigo-500">{newEmail}</span>
            </p>
          </div>
          <button
            onClick={reset}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
              isDark
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <RotateCcw size={14} /> Change Again
          </button>
        </div>
      )}
    </SectionCard>
  );
};

// ─── Password Update Section ───────────────────────────────────────────────────
const PasswordUpdateSection = ({ isDark }) => {
  const [step, setStep] = useState(STEPS.INPUT);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep(STEPS.INPUT);
    setNewPassword("");
    setConfirmPassword("");
    setOtp("");
  };

  const strength = (() => {
    if (!newPassword) return { label: "", color: "", width: 0 };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: 25 };
    if (score === 2) return { label: "Fair", color: "bg-yellow-500", width: 50 };
    if (score === 3) return { label: "Good", color: "bg-blue-500", width: 75 };
    return { label: "Strong", color: "bg-green-500", width: 100 };
  })();

  const handleSendOtp = async () => {
    if (!newPassword) return toast.error("Enter a new password");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await sendCredentialOtp("password_change");
      toast.success("OTP sent to your registered email!");
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (otp.length < 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      await verifyCredentialOtp("password_change", otp);
      await updateCredentials("password_change", { newPassword });
      toast.success("Password updated successfully!");
      setStep(STEPS.SUCCESS);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard isDark={isDark}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Lock size={18} className="text-white" />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
            Change Password
          </h3>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            OTP will be sent to your registered email for verification
          </p>
        </div>
      </div>

      <StepBar step={step} isDark={isDark} />

      {/* Step 1 — Enter new password */}
      {step === STEPS.INPUT && (
        <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
          {/* New password */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
              New Password
            </label>
            <div className="relative">
              <KeyRound size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:bg-white"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-slate-300" : "text-gray-400 hover:text-gray-600"}`}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength bar */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.width}%` }}
                  />
                </div>
                <p className={`text-xs font-medium ${
                  strength.width === 100 ? "text-green-500" :
                  strength.width === 75 ? "text-blue-500" :
                  strength.width === 50 ? "text-yellow-500" : "text-red-500"
                }`}>
                  {strength.label} password
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                placeholder="Re-enter new password"
                className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:bg-white"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-slate-300" : "text-gray-400 hover:text-gray-600"}`}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Send OTP
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Step 2 — OTP */}
      {step === STEPS.OTP && (
        <div className="space-y-4">
          <p className={`text-sm text-center ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Enter the 6-digit OTP sent to your registered email
          </p>
          <OtpInput value={otp} onChange={setOtp} isDark={isDark} />
          <button
            onClick={handleVerifyAndUpdate}
            disabled={loading || otp.length < 6}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            {loading ? "Updating..." : "Verify & Update Password"}
          </button>
          <button
            onClick={() => setStep(STEPS.INPUT)}
            className={`w-full py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
              isDark
                ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 3 — Success */}
      {step === STEPS.SUCCESS && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} className="text-green-500" />
          </div>
          <div>
            <p className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
              Password Updated!
            </p>
            <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Your admin password has been successfully changed. Next login will use the new password.
            </p>
          </div>
          <button
            onClick={reset}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
              isDark
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <RotateCcw size={14} /> Change Again
          </button>
        </div>
      )}
    </SectionCard>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const Settings = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen p-6 space-y-6 ${isDark ? "bg-slate-950" : "bg-gray-50"}`}>
      <Toaster position="top-right" />

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
          <SettingsIcon size={22} className="text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            Account Settings
          </h1>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Update your admin email and password securely using OTP verification
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
        isDark
          ? "bg-indigo-900/20 border-indigo-800/40 text-indigo-300"
          : "bg-indigo-50 border-indigo-200 text-indigo-700"
      }`}>
        <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
        <p className="text-sm">
          For security, any credential change requires OTP verification sent to your{" "}
          <strong>current registered email</strong>. OTP expires in <strong>10 minutes</strong>.
        </p>
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmailUpdateSection isDark={isDark} />
        <PasswordUpdateSection isDark={isDark} />
      </div>
    </div>
  );
};

export default Settings;
