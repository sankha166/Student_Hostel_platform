import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Mail, Lock, User, Phone, MapPin, CreditCard,
  Eye, EyeOff, AlertCircle, CheckCircle, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/dataService";
import { renderGoogleButton, GOOGLE_CLIENT_ID, type GoogleUser } from "@/lib/googleAuth";
import { addItem, getCollection } from "@/lib/storageService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const defaultRole = (searchParams.get("role") as "student" | "owner") || "student";
  const [role, setRole] = useState<"student" | "owner">(defaultRole);
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [aadhar, setAadhar] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === "student" ? "/student" : "/owner", { replace: true });
    }
  }, [user, navigate]);

  // Render real Google button when role changes or component mounts
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const containerId = `google-btn-${role}`;
    renderGoogleButton(
      containerId,
      (googleUser: GoogleUser) => handleGoogleSuccess(googleUser),
      (err: Error) => setGoogleError(err.message)
    );
  }, [role, isLogin]);

  const resetForm = () => {
    setFullName(""); setEmail(""); setPassword(""); setConfirmPassword("");
    setPhone(""); setAddress(""); setAadhar("");
    setErrors({}); setSuccessMsg(""); setGoogleError("");
  };

  const handleRoleChange = (r: string) => {
    setRole(r as "student" | "owner");
    resetForm();
  };

  const handleToggleMode = () => {
    setIsLogin(v => !v);
    resetForm();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required";
    else if (!emailRegex.test(email)) errs.email = "Invalid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Minimum 6 characters";

    if (!isLogin) {
      if (!fullName.trim()) errs.fullName = "Full name is required";
      if (!phone.trim()) errs.phone = "Phone number is required";
      if (!address.trim()) errs.address = "Address is required";
      if (confirmPassword !== password) errs.confirmPassword = "Passwords don't match";
      if (role === "student" && aadhar.replace(/\s/g, "").length !== 12) {
        errs.aadhar = "Aadhaar must be exactly 12 digits";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(""); setErrors({});
    if (!validate()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const result = await authService.login(email, password);
        login({ ...result.user }, result.token);
        setSuccessMsg("Login successful! Redirecting...");
      } else {
        const result = await authService.signup({
          email: email.trim(), password, name: fullName.trim(),
          role, phone: phone.trim(), address: address.trim(),
        });
        login({ ...result.user }, result.token);
        setSuccessMsg("Account created! Redirecting...");
      }
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleUser: GoogleUser) => {
    setGoogleLoading(true);
    setGoogleError("");
    try {
      // Check if this Google user already has an account
      const users = authService.getUsers();
      const existing = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());

      if (existing) {
        // Log them in
        const token = `gtok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const { passwordHash: _, ...safeUser } = existing;
        login(safeUser, token);
      } else {
        // Create new account — need to ask for role
        // We use the current role tab selection
        const result = await authService.signup({
          email: googleUser.email,
          password: `google_${googleUser.sub}`, // Google users won't need this password
          name: googleUser.name,
          role,
          phone: "",
          address: "",
        });
        login({
          ...result.user,
          avatar: googleUser.picture,
        }, result.token);
      }
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Fallback demo Google login (when VITE_GOOGLE_CLIENT_ID not set)
  const handleDemoGoogleLogin = async () => {
    setGoogleLoading(true);
    await new Promise(r => setTimeout(r, 500));
    try {
      // Create or find demo user
      const demoEmail = `demo.${role}@gmail.com`;
      const demoName = role === "student" ? "Demo Student" : "Demo Owner";
      const users = authService.getUsers();
      let result;
      const existing = users.find(u => u.email === demoEmail);
      if (existing) {
        const token = `gtok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const { passwordHash: _, ...safeUser } = existing;
        result = { user: safeUser, token };
      } else {
        result = await authService.signup({
          email: demoEmail, password: "demo123456", name: demoName,
          role, phone: "+91 98765 43210", address: "Demo Address, Bangalore",
        });
      }
      login(result.user, result.token);
    } catch (err) {
      setGoogleError("Demo login failed. Please use email signup.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const tabContent = (r: "student" | "owner") => (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {errors.submit && (
        <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errors.submit}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex gap-2 p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle size={16} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Signup-only fields */}
      {!isLogin && (
        <>
          <div>
            <div className="relative">
              <User className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <Input
                placeholder="Full Name *"
                className={`pl-9 rounded-xl bg-secondary border-0 h-11 ${errors.fullName ? "ring-2 ring-destructive" : ""}`}
                value={fullName}
                onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: "" })); }}
                autoComplete="name"
              />
            </div>
            {errors.fullName && <p className="text-xs text-destructive mt-1 ml-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-muted-foreground" size={16} />
                <Input
                  placeholder="Phone *"
                  className={`pl-9 rounded-xl bg-secondary border-0 h-11 ${errors.phone ? "ring-2 ring-destructive" : ""}`}
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: "" })); }}
                  autoComplete="tel"
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive mt-1 ml-1">{errors.phone}</p>}
            </div>
            {r === "student" ? (
              <div>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Aadhaar (12 digits) *"
                    className={`pl-9 rounded-xl bg-secondary border-0 h-11 ${errors.aadhar ? "ring-2 ring-destructive" : ""}`}
                    value={aadhar}
                    maxLength={12}
                    onChange={e => { setAadhar(e.target.value.replace(/\D/g, "")); setErrors(p => ({ ...p, aadhar: "" })); }}
                  />
                </div>
                {errors.aadhar && <p className="text-xs text-destructive mt-1 ml-1">{errors.aadhar}</p>}
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Business Type"
                    className="pl-9 rounded-xl bg-secondary border-0 h-11"
                    autoComplete="organization"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <Input
                placeholder="Address *"
                className={`pl-9 rounded-xl bg-secondary border-0 h-11 ${errors.address ? "ring-2 ring-destructive" : ""}`}
                value={address}
                onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: "" })); }}
                autoComplete="street-address"
              />
            </div>
            {errors.address && <p className="text-xs text-destructive mt-1 ml-1">{errors.address}</p>}
          </div>
        </>
      )}

      {/* Email */}
      <div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 text-muted-foreground" size={16} />
          <Input
            type="email"
            placeholder="Email address *"
            className={`pl-9 rounded-xl bg-secondary border-0 h-11 ${errors.email ? "ring-2 ring-destructive" : ""}`}
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
            autoComplete="email"
          />
        </div>
        {errors.email && <p className="text-xs text-destructive mt-1 ml-1">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-muted-foreground" size={16} />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password *"
            className={`pl-9 pr-10 rounded-xl bg-secondary border-0 h-11 ${errors.password ? "ring-2 ring-destructive" : ""}`}
            value={password}
            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive mt-1 ml-1">{errors.password}</p>}
      </div>

      {!isLogin && (
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password *"
              className={`pl-9 pr-10 rounded-xl bg-secondary border-0 h-11 ${errors.confirmPassword ? "ring-2 ring-destructive" : ""}`}
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: "" })); }}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive mt-1 ml-1">{errors.confirmPassword}</p>}
        </div>
      )}

      <Button
        type="submit"
        className="w-full gradient-primary text-primary-foreground rounded-xl h-11 font-medium"
        disabled={loading || !!successMsg}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
            {isLogin ? "Logging in..." : "Creating account..."}
          </span>
        ) : (isLogin ? "Log In" : "Create Account")}
      </Button>

      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">or continue with</span>
        </div>
      </div>

      {/* Google Sign-In */}
      <div className="space-y-2">
        {googleError && (
          <p className="text-xs text-destructive text-center">{googleError}</p>
        )}

        {GOOGLE_CLIENT_ID ? (
          // Real Google button rendered by GSI
          <div
            id={`google-btn-${r}`}
            className="flex justify-center w-full min-h-[44px]"
          />
        ) : (
          // Demo fallback when client ID not configured
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl h-11 gap-2 font-medium"
              onClick={handleDemoGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google (Demo)
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Set <code className="bg-secondary px-1 rounded text-xs">VITE_GOOGLE_CLIENT_ID</code> in .env for real Google login
            </p>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground pt-1">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button type="button" onClick={handleToggleMode} className="text-primary font-semibold hover:underline">
          {isLogin ? "Sign Up Free" : "Log In"}
        </button>
      </p>
    </form>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="hidden lg:flex items-center justify-center gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(280_60%_55%/0.4),transparent)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10 p-12 max-w-md"
        >
          <img src="/iconn.png" alt="Logo" className="w-20 h-20 object-contain mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">Residential Nexus</h2>
          <p className="text-primary-foreground/80 text-lg">
            AI-powered student accommodation platform — find your perfect room or manage your properties.
          </p>
          <div className="mt-10 space-y-4 text-left">
            {[
              { title: "Smart AI Matching", desc: "Find rooms based on your lifestyle and budget" },
              { title: "Professional Booking", desc: "Digital agreements, ID verification, online rent" },
              { title: "Owner Dashboard", desc: "Manage tenants, track rent, generate receipts" },
              { title: "Home Food Delivery", desc: "Order homemade meals from local cooks" },
            ].map(f => (
              <div key={f.title} className="flex gap-3 text-primary-foreground/90">
                <Sparkles size={18} className="shrink-0 mt-1 text-primary-foreground/70" />
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-primary-foreground/65">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <img src="/iconn.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg text-foreground">Residential Nexus</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">
            {isLogin ? "Welcome Back 👋" : "Create Account"}
          </h1>
          <p className="text-muted-foreground mb-6 text-sm">
            {isLogin
              ? "Sign in to continue to your dashboard"
              : "Join thousands of students and property owners"}
          </p>

          <Tabs value={role} onValueChange={handleRoleChange}>
            <TabsList className="w-full mb-5 bg-secondary rounded-xl p-1 grid grid-cols-2 h-11">
              <TabsTrigger value="student" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm font-medium">
                🎓 I'm a Student
              </TabsTrigger>
              <TabsTrigger value="owner" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm font-medium">
                🏠 I'm an Owner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student">{tabContent("student")}</TabsContent>
            <TabsContent value="owner">{tabContent("owner")}</TabsContent>
          </Tabs>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>{" "}
            and{" "}
            <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
