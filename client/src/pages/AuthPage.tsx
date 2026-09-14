import React, { useState } from "react";
import { startGoogleLogin, signInWithEmail, signUpWithEmail, setupRecaptcha, sendPhoneOTP } from "@/const";
import { toast } from "sonner";
import { ArrowUpRight, ShieldCheck, Mail, Phone, Lock, User, Sparkles, LogIn, CheckCircle2 } from "lucide-react";
import { ConfirmationResult } from "firebase/auth";

export default function AuthPage({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "phone">("login");
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  
  // Email states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Phone states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const handleRoleSelection = (role: "user" | "admin") => {
    setSelectedRole(role);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await startGoogleLogin();
      if (user) {
        localStorage.setItem(`role_${user.uid}`, selectedRole);
        localStorage.setItem("activeRole", selectedRole);
        toast.success(`Logged in successfully as ${selectedRole === "admin" ? "Administrator" : "Learner"}`);
        if (onAuthSuccess) onAuthSuccess();
        window.location.href = selectedRole === "admin" ? "/admin" : "/";
      }
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      let user;
      if (mode === "signup") {
        if (!name) {
          toast.error("Please enter your full name");
          setLoading(false);
          return;
        }
        user = await signUpWithEmail(email, password, name);
        toast.success("Account created successfully!");
      } else {
        user = await signInWithEmail(email, password);
        toast.success("Signed in successfully!");
      }

      if (user) {
        localStorage.setItem(`role_${user.uid}`, selectedRole);
        localStorage.setItem("activeRole", selectedRole);
        if (onAuthSuccess) onAuthSuccess();
        window.location.href = selectedRole === "admin" ? "/admin" : "/";
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        toast.error("Invalid email or password");
      } else if (err.code === "auth/email-already-in-use") {
        toast.error("An account with this email already exists");
      } else if (err.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters");
      } else {
        toast.error(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast.error("Please enter a valid phone number (e.g. +1234567890)");
      return;
    }
    setLoading(true);
    try {
      const verifier = setupRecaptcha("recaptcha-container");
      const result = await sendPhoneOTP(phoneNumber, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast.success("OTP sent to your phone number!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send OTP. Check phone number format (+countrycode).");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !confirmationResult) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }
    setLoading(true);
    try {
      const res = await confirmationResult.confirm(otpCode);
      if (res.user) {
        localStorage.setItem(`role_${res.user.uid}`, selectedRole);
        localStorage.setItem("activeRole", selectedRole);
        toast.success("Phone verified successfully!");
        if (onAuthSuccess) onAuthSuccess();
        window.location.href = selectedRole === "admin" ? "/admin" : "/";
      }
    } catch (err: any) {
      toast.error("Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div id="recaptcha-container" />
      
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary font-bold text-xl mb-2">
            la
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome to learn at
          </h1>
          <p className="text-sm text-muted-foreground">
            Personal AI-Powered Skill Development & Capability Platform
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-muted p-1 rounded-xl flex gap-1">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "user"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleRoleSelection("user")}
          >
            <User size={14} /> Learner Account
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "admin"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleRoleSelection("admin")}
          >
            <ShieldCheck size={14} /> Admin Access
          </button>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex border-b border-border text-sm">
          <button
            className={`flex-1 py-2 font-medium transition-colors border-b-2 ${
              mode === "login"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setMode("login"); setOtpSent(false); }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 font-medium transition-colors border-b-2 ${
              mode === "signup"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setMode("signup"); setOtpSent(false); }}
          >
            Register
          </button>
          <button
            className={`flex-1 py-2 font-medium transition-colors border-b-2 ${
              mode === "phone"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setMode("phone"); setOtpSent(false); }}
          >
            Phone Login
          </button>
        </div>

        {/* Google OAuth Button */}
        {mode !== "phone" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-border transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-xs text-muted-foreground uppercase tracking-wider">
                Or with email
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>
          </div>
        )}

        {/* Email Form */}
        {(mode === "login" || mode === "signup") && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User size={13} /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail size={13} /> Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock size={13} /> Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
            >
              {loading ? (
                "Processing..."
              ) : mode === "signup" ? (
                <>Create Account <ArrowUpRight size={15} /></>
              ) : (
                <>Sign In <LogIn size={15} /></>
              )}
            </button>
          </form>
        )}

        {/* Phone OTP Form */}
        {mode === "phone" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone size={13} /> Phone Number (with country code)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Format: + [country code] [number] (e.g. +1 555 123 4567)
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
                >
                  {loading ? "Sending OTP..." : "Send Verification OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-green-500" /> Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-sm text-center tracking-widest font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
                >
                  {loading ? "Verifying..." : "Verify & Log In"}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-xs text-muted-foreground hover:underline text-center"
                >
                  Change phone number
                </button>
              </form>
            )}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
          Protected by Firebase Auth · Secure & Encrypted
        </div>
      </div>
    </div>
  );
}
