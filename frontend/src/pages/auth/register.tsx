import React, { useState } from "react";
import { User, Mail, Lock, ArrowRight, Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

// shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import NCLOGO from '../../assets/nc_logo.png';

const apiRegister = async (username: string, email: string, password: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Simulated registration for: ${username}, ${email}`);
      resolve({ success: true });
    }, 1500);
  });
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { username, email, password, confirmPassword } = formData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await apiRegister(username, email, password);
      toast.success("Registration successful! Please log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    { name: "username", type: "text", icon: User, placeholder: "Username", label: "Username" },
    { name: "email", type: "email", icon: Mail, placeholder: "name@nc.edu.ph", label: "Email" },
    { name: "password", type: "password", icon: Lock, placeholder: "••••••••", label: "Password" },
    { name: "confirmPassword", type: "password", icon: Lock, placeholder: "••••••••", label: "Confirm Password" },
  ] as const;

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* Decorative glows - refined for light mode */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[860px] z-10 px-6"
      >
        <Card className="border-slate-200 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left / Branding */}
            <div className="flex flex-col items-center justify-center text-center p-12 md:w-1/3 bg-slate-50/50">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                <img src={NCLOGO} alt="NC Logo" className="w-28 h-28 relative z-10 drop-shadow-sm" />
              </motion.div>

              <div className="mt-8 space-y-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic py-1">NC<span className="text-primary"> ID TECH</span></h1>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 leading-none">Access</p>
              </div>

              <div className="mt-auto pt-12 md:pt-24 opacity-60">
                <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400">System</p>
              </div>
            </div>

            {/* Right / Form */}
            <div className="p-12 md:w-2/3 bg-white">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Request Access</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Secure</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">Request Account</h2>
                <p className="text-sm text-slate-500 font-medium">Enter your details for verification.</p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {fields.map(({ name, type, icon: Icon, placeholder, label }) => (
                  <div key={name} className={cn("space-y-2", (name === 'username' || name === 'email') && "md:col-span-2")}>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      {label}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <Icon size={16} />
                      </div>
                      <Input
                        name={name}
                        type={type}
                        placeholder={placeholder}
                        value={(formData as any)[name]}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                        className="h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus-visible:ring-primary/10"
                      />
                    </div>
                  </div>
                ))}

                <div className="md:col-span-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary/10 transition-all active:scale-[0.98] gap-3"
                  >
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <>Submit Request <ArrowRight size={16} /></>}
                  </Button>

                  <p className="text-center text-[10px] text-slate-500 font-medium pt-6">
                    Already have access?{" "}
                    <Link to="/login" className="text-primary font-black hover:underline underline-offset-4 tracking-[0.1em]">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
