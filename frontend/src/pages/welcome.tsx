import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, ArrowRight, HelpCircle, ClipboardCheck, ShieldCheck, Facebook } from 'lucide-react';
import nclogo from '@/assets/nc_logo.png';

// shadcn UI
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NC_TEAL = '#00928a';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/5 p-1.5 rounded-xl border border-primary/10">
            <img src={nclogo} alt="NC Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-black text-xl tracking-tighter text-foreground">
            NC<span className="text-primary">nian</span> ID
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/how-to-submit')}
            className="gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" /> Support
          </Button>
          <Button
            variant="default"
            size="sm"
            className="hidden sm:flex rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-widest"
            onClick={() => navigate('/submit-details')}
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-10"
        >
          {/* Live badge */}
          <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Application Status: Live
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[0.95] tracking-tight">
              A smarter way to get your <span className="text-primary italic">School ID.</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-lg font-medium leading-relaxed">
              Streamlining NorthEastern College identification — modern, secure, and entirely digital.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/submit-details')}
              className="group h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 gap-3"
            >
              Start Application
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/how-to-submit')}
              className="h-14 px-8 rounded-2xl border-border bg-background text-foreground hover:bg-accent font-black text-xs tracking-widest transition-all active:scale-95"
            >
              Read Instructions
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden flex items-center justify-center font-bold text-[10px] text-muted-foreground">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-muted-foreground">
              <span className="text-foreground">2,400+</span> Students processed this semester
            </p>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block relative"
        >
          <div className="absolute inset-x-0 -top-16 h-64 bg-primary/20 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />
          <div className="grid grid-cols-2 gap-6 relative z-10">
            <FeatureCard
              icon={<ClipboardCheck className="text-primary h-6 w-6" />}
              title="Rapid Issuance"
              desc="Automated validation ensures your ID is ready within days, not weeks."
              delay={0}
            />
            <FeatureCard
              icon={<ShieldCheck className="text-primary h-6 w-6" />}
              title="Secure Data"
              desc="Enterprise-grade encryption for all your personal academic records."
              delay={0.1}
            />
            <FeatureCard
              icon={<HelpCircle className="text-primary h-6 w-6" />}
              title="Full Support"
              desc="Need help? Our team and automated steps guide you through every pixel."
              delay={0.2}
            />
            <div className="p-8 rounded-[2.5rem] bg-zinc-950 text-white flex flex-col justify-end space-y-4 shadow-2xl border border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Identity v2.0</p>
                <h3 className="text-xl font-black tracking-tight mt-1">Ready to sync?</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">Join the modernized NCnian digital ecosystem.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Institutional Links</span>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-background border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm">
                <Facebook size={18} />
              </a>
              <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-background border border-border hover:bg-foreground hover:text-background hover:border-foreground transition-all shadow-sm">
                <Github size={18} />
              </a>
            </div>
          </div>
          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase text-center md:text-right">
            © {new Date().getFullYear()} Northeastern College · Refined by <span className="text-foreground">BSIT Software House</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay + 0.3 }}
    className="p-8 bg-card rounded-[2.5rem] space-y-4 border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
  >
    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
      {icon}
    </div>
    <div className="space-y-1">
      <h3 className="font-black text-sm text-foreground uppercase tracking-tight">{title}</h3>
      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{desc}</p>
    </div>
  </motion.div>
);

export default Welcome;