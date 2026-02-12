import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E11] relative overflow-hidden">
    {/* Decorative Background Glow */}
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4F8CFF]/10 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[40%] bg-[#6366F1]/10 rounded-full blur-[120px]" />

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[820px] z-10 px-6"
    >
      <div className="flex justify-between items-center bg-gradient-to-b from-[#151922] to-[#11151D] rounded-[2.5rem] border border-[#232834] shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-10 gap-10">

        {/* Left / Branding */}
        <div className="flex flex-col items-center text-center min-w-[160px]">
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="rounded-2xl"
          >
            <img src={NCLOGO} alt="NC Logo" className="w-32 h-32" />
          </motion.div>

          <h1 className="mt-6 text-3xl font-bold text-[#E6E8EB] tracking-wide">
            NC ID
          </h1>

          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[#9AA0AA]">
            Card Management
          </p>
        </div>

        {/* Right / Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9AA0AA] ml-1">
              Email
            </label>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6B7280] group-focus-within:text-[#4F8CFF] transition-colors">
                <Mail size={18} />
              </div>

              <input
                type="email"
                placeholder="techsupp@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={`
                  w-full pl-12 pr-4 py-4
                  bg-[#0F131C]
                  border rounded-2xl
                  text-[#E6E8EB]
                  placeholder:text-[#6B7280]
                  outline-none transition-all
                  hover:border-[#2E3444]
                  focus:border-[#4F8CFF]
                  ${errors.email ? 'border-[#EF4444]/60' : 'border-[#232834]'}
                `}
              />
            </div>

            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] font-bold text-[#EF4444] ml-1"
                >
                  {errors.email[0]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9AA0AA] ml-1">
              Password
            </label>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6B7280] group-focus-within:text-[#4F8CFF] transition-colors">
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
                  bg-[#0F131C]
                  border rounded-2xl
                  text-[#E6E8EB]
                  placeholder:text-[#6B7280]
                  outline-none transition-all
                  hover:border-[#2E3444]
                  focus:border-[#4F8CFF]
                  ${errors.password ? 'border-[#EF4444]/60' : 'border-[#232834]'}
                `}
              />
            </div>

            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] font-bold text-[#EF4444] ml-1"
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
              w-full py-5 rounded-2xl
              bg-slate-100/10
              hover:bg-blue-900/20
              border border-slate-50/10
              text-white font-black text-xs uppercase tracking-[0.25em]
              flex items-center justify-center gap-3
              transition-all active:scale-[0.97]
              disabled:opacity-50
            "
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Login <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  </div>
  );
};

export default Login;