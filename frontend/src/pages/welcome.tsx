import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, ArrowRight, HelpCircle, ClipboardCheck, ShieldCheck } from 'lucide-react';
import nclogo from '../assets/nc_logo.png';

const NC_TEAL = '#00928a';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={nclogo} alt="NC Logo" className="w-9 h-9 object-contain" />
          <span className="font-extrabold text-base tracking-tight" style={{ color: NC_TEAL }}>
            NCnian School ID
          </span>
        </div>
        <button
          onClick={() => navigate('/how-to-submit')}
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <HelpCircle size={14} /> Help
        </button>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-7"
        >
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Online Registration is Open
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 leading-[1.08] tracking-tight">
            Northeastern College{' '}
            <span style={{ color: NC_TEAL }}>ID</span>{' '}
            Application
          </h1>

          <p className="text-zinc-500 text-base md:text-lg max-w-md leading-relaxed">
            Welcome to the NC'nian School ID Portal. Submit your details for
            your official school ID card — takes less than 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/submit-details')}
              className="group flex items-center justify-center gap-2.5 text-white px-7 py-3.5 rounded-xl font-black text-xs tracking-widest shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
              style={{ backgroundColor: NC_TEAL }}
            >
              Submit Details
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/how-to-submit')}
              className="flex items-center justify-center gap-2 border border-zinc-200 text-zinc-700 px-7 py-3.5 rounded-xl font-black text-xs tracking-widest hover:bg-zinc-50 transition-all active:scale-95"
            >
              How to Submit
            </button>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden md:block"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl rotate-2" style={{ backgroundColor: `${NC_TEAL}18` }} />
            <div className="bg-white border border-zinc-100 rounded-3xl p-7 shadow-xl shadow-zinc-200/50 relative grid grid-cols-2 gap-4">
              <FeatureCard icon={<ClipboardCheck className="text-teal-600" size={26} />} title="Quick Process" desc="Complete your profile in under 5 minutes." />
              <FeatureCard icon={<HelpCircle className="text-teal-600" size={26} />} title="Easy Steps" desc="Step-by-step instructions always available." />
              <FeatureCard icon={<ShieldCheck className="text-teal-600" size={26} />} title="Secure" desc="Your data is encrypted and protected." />
              <FeatureCard icon={<ClipboardCheck className="text-teal-600" size={26} />} title="Instant" desc="Real-time verification of your school data." />
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 py-8 px-6 mt-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Connect</span>
            <a
              href="https://www.facebook.com/NcNianIDv2"
              className="p-2.5 bg-zinc-100 rounded-full text-zinc-500 hover:text-white transition-all"
              style={{ ['--hover-bg' as any]: NC_TEAL }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = NC_TEAL)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
            >
              <Facebook size={16} />
            </a>
          </div>
          <p className="text-zinc-400 text-[10px] font-semibold tracking-widest uppercase text-center">
            © {new Date().getFullYear()} Northeastern College — BSIT Department
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="p-5 bg-zinc-50 rounded-2xl space-y-2.5 border border-zinc-100">
    {icon}
    <h3 className="font-black text-sm text-zinc-800">{title}</h3>
    <p className="text-[11px] text-zinc-400 leading-relaxed">{desc}</p>
  </div>
);

export default Welcome;