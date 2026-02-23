import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import NCLOGO from '../../assets/nc_logo.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string[]; password?: string[] }>({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      await login(email, password);
    } catch (err: any) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors);
        toast.error("Please verify your credentials.");
      } else if (err.response?.status === 403) {
        toast.warning(err.response.data.message || "Account pending approval.");
        navigate("/pending");
      } else if (err.response?.status === 401) {
        toast.error("Invalid email or password.");
      } else {
        toast.error("Server connection failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden font-sans">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[860px] z-10 px-6"
      >
        <Card className="border-border/40 bg-zinc-900/90 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <CardContent className="p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/40">
            {/* Left / Branding */}
            <div className="flex flex-col items-center justify-center text-center p-12 md:w-1/3 bg-zinc-900/30">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <img src={NCLOGO} alt="NC Logo" className="w-28 h-28 relative z-10" />
              </motion.div>

              <div className="mt-8 space-y-1">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic py-1">
                  NC<span className="text-primary">nian</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 leading-none">
                  Identity Core
                </p>
              </div>

              <div className="mt-auto pt-12 md:pt-24 opacity-40">
                <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Certified System</p>
              </div>
            </div>

            {/* Right / Form */}
            <div className="p-12 md:w-2/3">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-white tracking-tight mb-2">Welcome Back</h2>
                <p className="text-sm text-muted-foreground font-medium">Access the administrative command center.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">
                    Administrative Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Mail size={16} />
                    </div>
                    <Input
                      type="email"
                      placeholder="admin@nc.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className={cn(
                        "h-14 pl-12 bg-zinc-950/50 border-border/40 rounded-2xl text-white placeholder:text-muted-foreground/40 transition-all",
                        errors.email && "border-destructive/50 ring-destructive/20 focus-visible:ring-destructive/20"
                      )}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] font-bold text-destructive ml-1"
                      >
                        {errors.email?.[0]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                      Secure Password
                    </label>
                    <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-black text-primary/60 hover:text-primary uppercase tracking-widest transition-colors">
                      Recover
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                      <KeyRound size={16} />
                    </div>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className={cn(
                        "h-14 pl-12 bg-zinc-950/50 border-border/40 rounded-2xl text-white placeholder:text-muted-foreground/40 transition-all",
                        errors.password && "border-destructive/50 ring-destructive/20 focus-visible:ring-destructive/20"
                      )}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] font-bold text-destructive ml-1"
                      >
                        {errors.password?.[0]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-white/5 transition-all active:scale-[0.98] gap-3 mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      Sign In <ArrowRight size={16} />
                    </>
                  )}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground font-medium pt-4">
                  New personnel? <Link to="/register" className="text-primary font-black hover:underline underline-offset-4 tracking-[0.1em]">Create Access Request</Link>
                </p>
              </form>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;