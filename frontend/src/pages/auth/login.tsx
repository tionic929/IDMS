import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import NCLOGO from '../../assets/nc_logo.png';
import NCBG from '../../assets/ncbg.png';

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
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-white backdrop-blur-[5px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[820px] z-10 px-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50/5 backdrop-blur-md rounded-[2.5rem] border border-slate-300/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">

          {/* Left / Branding */}
          <div className="flex flex-col items-center justify-center text-center p-10 md:min-w-[280px] border-b md:border-b-0 md:border-r border-slate-100">
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
              <img src={NCLOGO} alt="NC Logo" className="w-32 h-32 relative z-10 drop-shadow-sm" />
            </motion.div>

            <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-regular uppercase">
              NC<span className="text-slate-900"> ID TECH</span>
            </h1>

            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">
              by vizcarra
            </p>
          </div>

          {/* Right / Form */}
          <div className="p-10 w-full">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">Sign In</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">
                  Email
                </label>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <Mail size={18} />
                  </div>

                  <input
                    type="email"
                    placeholder="admin@nc.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className={`
                    w-full pl-12 pr-4 py-4
                    bg-slate-50/50
                    border rounded-2xl
                    text-slate-900
                    placeholder:text-slate-400
                    outline-none transition-all
                    hover:border-slate-300
                    focus:border-primary focus:bg-white
                    ${errors.email ? 'border-destructive/60' : 'border-slate-200'}
                  `}
                  />
                </div>

                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-bold text-destructive ml-1"
                    >
                      {errors.email[0]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    Password
                  </label>
                  <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-black text-primary/60 hover:text-primary uppercase tracking-widest transition-colors">
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock size={18} />
                  </div>

                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className={`
                    w-full pl-12 pr-4 py-4
                    bg-slate-50/50
                    border rounded-2xl
                    text-slate-900
                    placeholder:text-slate-400
                    outline-none transition-all
                    hover:border-slate-300
                    focus:border-primary focus:bg-white
                    ${errors.password ? 'border-destructive/60' : 'border-slate-200'}
                  `}
                  />
                </div>

                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-bold text-destructive ml-1"
                    >
                      {errors.password[0]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                w-full py-4 rounded-2xl
                bg-primary
                hover:bg-primary/90
                text-white font-black text-xs uppercase tracking-[0.25em]
                flex items-center justify-center gap-3
                transition-all active:scale-[0.97]
                disabled:opacity-50
                shadow-xl shadow-primary/10
              "
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;