import React, { useState } from "react";
import { User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E11] relative overflow-hidden">
      {/* Decorative glows */}
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
            <h1 className="mt-6 text-3xl font-bold text-[#E6E8EB] tracking-wide">NC ID</h1>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[#9AA0AA]">Create Account</p>
          </div>

          {/* Right / Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {fields.map(({ name, type, icon: Icon, placeholder, label }) => (
              <div key={name} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9AA0AA] ml-1">
                  {label}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6B7280] group-focus-within:text-[#4F8CFF] transition-colors">
                    <Icon size={16} />
                  </div>
                  <input
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-[#0F131C] border border-[#232834] rounded-2xl text-[#E6E8EB] placeholder:text-[#6B7280] outline-none transition-all hover:border-[#2E3444] focus:border-[#4F8CFF] text-sm"
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-slate-100/10 hover:bg-blue-900/20 border border-slate-50/10 text-white font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-50 mt-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <>Create Account <ArrowRight size={16} /></>}
            </button>

            <p className="text-center text-xs text-[#6B7280] pt-1">
              Already have an account?{" "}
              <Link to="/login" className="text-[#4F8CFF] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;