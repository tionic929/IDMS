import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[540px] z-10 px-6"
      >
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 p-10 md:p-12">
          
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-4"
            >
              <ShieldCheck size={28} strokeWidth={2.5} />
            </motion.div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">ID TECH</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Instructor Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="technician@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-medium text-slate-700
                    ${errors.email ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-blue-600 focus:bg-white'}`}
                  disabled={isLoading}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-bold text-red-500 ml-1">
                    {errors.email[0]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-medium text-slate-700
                    ${errors.password ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-blue-600 focus:bg-white'}`}
                  disabled={isLoading}
                />
                {/* <Link to="/forgot-password" className="flex justify-end mt-2 text-[.8rem] font-bold text-blue-600 hover:text-blue-700">
                  Forgot Password?
                </Link> */}
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-bold text-red-500 ml-1">
                    {errors.password[0]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="p-4 w-full bg-slate-900 hover:bg-slate-800 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-50 shadow-xl shadow-slate-200"
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

          {/* Footer */}
          {/* <div className="mt-10 text-center border-t border-slate-50 pt-8">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              No account? 
              <Link to='/register' className="ml-2 text-blue-600 hover:text-blue-700">Join Platform</Link>
            </p>
          </div> */}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;