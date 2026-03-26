import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useAuth, UserRole, LoginFailureReason } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Mail, Lock, ArrowRight, Shield, Zap, CheckCircle2, Users, UserCog, Briefcase } from "lucide-react";
import { useTheme } from "next-themes";

const LOGO_BASE64 =
  "https://media.designrush.com/agencies/293509/Digital-Minds.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setTheme } = useTheme();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const getLoginMessage = (reason: LoginFailureReason) => {
    switch (reason) {
      case "invalid_credentials":
        return "Wrong email or password. Please check your credentials and try again.";
      case "blocked":
        return "Your account has been blocked from the system. Please contact the administrator.";
      case "role_mismatch":
        return "The selected role does not match your account. Please choose the correct role.";
      case "profile_not_found":
        return "Your account profile could not be found. Please contact the administrator.";
      default:
        return "Unable to sign in right now. Please try again.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSelectedRole(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error || !data.user) {
      setShowRoleSelection(false);
      toast.error(getLoginMessage("invalid_credentials"), {
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role, is_blocked")
      .eq("auth_id", data.user.id)
      .single();

    await supabase.auth.signOut();

    if (profileError || !profile) {
      setShowRoleSelection(false);
      toast.error(getLoginMessage("profile_not_found"), {
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }

    if (profile.is_blocked) {
      setShowRoleSelection(false);
      toast.error(getLoginMessage("blocked"), {
        duration: 6000,
      });
    } else {
      setShowRoleSelection(true);
      toast.success("Credentials verified! Please select your role.");
    }

    setIsLoading(false);
  };

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (selectedRole) {
      const result = await login(formData.email, formData.password, selectedRole);
      if (result.success) {
        toast.success(`Logged in as ${selectedRole}`);
        navigate("/dashboard");
      } else {
        toast.error(getLoginMessage(result.reason || "unknown"), {
          duration: result.reason === "blocked" ? 6000 : 5000,
        });

        if (result.reason === "blocked" || result.reason === "invalid_credentials") {
          setShowRoleSelection(false);
          setSelectedRole(null);
        }
      }
    }
  };

  const handleBackToLogin = () => {
    setShowRoleSelection(false);
    setSelectedRole(null);
  };

  const roles: Array<{ value: UserRole; icon: typeof Users; description: string }> = [
    {
      value: "Admin",
      icon: Shield,
      description: "Full system access and management"
    },
    {
      value: "IT Officers",
      icon: UserCog,
      description: "IT Department"
    },
    {
      value: "HR Officers",
      icon: Briefcase,
      description: "HR Department"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-white via-slate-50 to-amber-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(176,191,0,0.08)_0%,transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(31,79,140,0.08)_0%,transparent_45%)]" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#B0BF00]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-sky-200/40 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Company Info */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-8 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#B0BF00]/20 blur-2xl rounded-full group-hover:bg-[#B0BF00]/30 transition-all duration-500" />
              <img
                src={LOGO_BASE64}
                alt="Digital Minds BPO Services Inc."
                className="h-56 w-auto max-w-sm relative z-10 drop-shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_40px_rgba(176,191,0,0.6)]"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-base text-slate-600 mb-2">
            Inventory Management System
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-[#B0BF00]" />
              Efficient
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-[#B0BF00]" />
              Secure
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-[#B0BF00]" />
              Fast
            </span>
          </div>
        </div>

        {/* Login Form - Enhanced Glass-morphism */}
        {!showRoleSelection && (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#7f8f00] transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    required
                    disabled={isLoading}
                    className="h-12 pl-11 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#B0BF00] focus:ring-2 focus:ring-[#B0BF00]/15 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-slate-700 font-medium text-sm"
                >
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#7f8f00] transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    required
                    disabled={isLoading}
                    className="h-12 pl-11 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#B0BF00] focus:ring-2 focus:ring-[#B0BF00]/15 transition-all duration-200"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#B0BF00] hover:bg-[#9FAE00] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#B0BF00]/20 transition-all duration-300 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? "Signing in..." : "Sign In"}
                  {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#B0BF00] to-[#C5D400] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <button
                type="button"
                className="text-sm text-[#7f8f00] hover:text-[#5f6a00] font-medium hover:underline transition-colors"
              >
                Forgot your password?
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 text-slate-500">New to Digital Minds?</span>
                </div>
              </div>
              <div className="text-sm text-center text-slate-500">
                <p>Contact your system administrator to create an account</p>
              </div>
            </div>
          </div>
        )}

        {/* Role Selection */}
        {showRoleSelection && (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition-all duration-300">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Your Role</h2>
              <p className="text-sm text-slate-600">Choose your department to continue</p>
            </div>
            
            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.value}
                    onClick={() => handleRoleSelection(role.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                      selectedRole === role.value
                        ? "bg-[#f7fad8] border-[#B0BF00] shadow-lg shadow-[#B0BF00]/10"
                        : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                      selectedRole === role.value
                        ? "bg-[#B0BF00] text-white"
                        : "bg-[#f8fafc] text-[#7f8f00]"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-base font-semibold text-slate-900">{role.value}</h3>
                      <p className="text-xs text-slate-500">{role.description}</p>
                    </div>
                    {selectedRole === role.value && (
                      <CheckCircle2 className="w-5 h-5 text-[#B0BF00]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                type="button"
                onClick={handleBackToLogin}
                className="flex-1 h-12 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all duration-300"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={!selectedRole}
                className="flex-1 h-12 bg-[#B0BF00] hover:bg-[#9FAE00] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#B0BF00]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#B0BF00] to-[#C5D400] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-500 mb-4">
            © 2026 Digital Minds BPO Services Inc. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="text-xs text-slate-500 hover:text-[#7f8f00] transition-colors">
              Privacy Policy
            </button>
            <span className="text-slate-300">•</span>
            <button className="text-xs text-slate-500 hover:text-[#7f8f00] transition-colors">
              Terms of Service
            </button>
            <span className="text-slate-300">•</span>
            <button className="text-xs text-slate-500 hover:text-[#7f8f00] transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



