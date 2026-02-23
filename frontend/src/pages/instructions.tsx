import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, UserCircle, FileText, CheckCircle, Send, HelpCircle,
  Sparkles, Contact, ShieldCheck, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import nclogo from '@/assets/nc_logo.png';

// shadcn UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NC_TEAL = '#00928a';

const steps = [
  {
    title: "Prepare Your Data",
    desc: "Gather your Student ID, course details, and educational history before starting.",
    icon: <UserCircle className="h-5 w-5" />,
  },
  {
    title: "Fill the Application Form",
    desc: "Navigate to 'Submit Details' and ensure all personal information fields are correctly filled.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Upload Documents",
    desc: "Attach a clear 2×2 profile picture and your signature as required by the system.",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    title: "Final Submission",
    desc: "Review your summary and click 'Submit'. A confirmation message will appear once successful.",
    icon: <Send className="h-5 w-5" />,
  },
];

const Instructions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans pb-20">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/5 p-1.5 rounded-xl border border-primary/10">
            <img src={nclogo} alt="NC Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-black text-xl tracking-tighter text-foreground uppercase italic pb-1">NC<span className="text-primary">nian</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-border/40">
            Process Guide v1.0
          </Badge>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2 text-muted-foreground hover:text-foreground font-bold mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Portal</span>
        </Button>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="border-none shadow-2xl shadow-primary/5 overflow-hidden rounded-[2.5rem] bg-card">
            <div className="h-2 w-full bg-gradient-to-r from-primary to-blue-600" />
            <CardContent className="p-8 md:p-12">
              {/* Title */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Onboarding Workflow</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">
                  How to Submit{' '}
                  <span className="text-primary italic">Details.</span>
                </h1>
                <p className="text-muted-foreground text-base md:text-lg font-medium leading-relaxed max-w-xl">
                  Follow our streamlined process to ensure your information is correctly synchronized with the NC Identity Core.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-0">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-8 group">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 group-hover:scale-110 text-primary">
                        {step.icon}
                      </div>
                      {i < steps.length - 1 && (
                        <div className="w-[2px] flex-1 bg-border/40 my-3 group-hover:bg-primary/20 transition-colors" />
                      )}
                    </div>
                    {/* Text */}
                    <div className="pb-10 pt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Milestone 0{i + 1}</span>
                      </div>
                      <h3 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium max-w-md">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-6 p-8 rounded-[2.5rem] bg-zinc-900 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none transition-transform group-hover:scale-110 duration-700">
                  <Zap size={160} className="fill-current" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <p className="font-black text-xs uppercase tracking-widest">Ready to initiate?</p>
                    </div>
                    <p className="text-zinc-400 text-xs font-medium">The verification sequence takes approximately 3 minutes.</p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => navigate('/submit-details')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 group-hover:-translate-y-1 transition-all active:scale-95"
                  >
                    Begin Application
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer note */}
        <div className="mt-12 text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted/30 border border-border/40 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Support Protocol: <a href="mailto:support@nc.edu.ph" className="text-foreground hover:text-primary transition-colors">support@nc.edu.ph</a>
          </div>
          <p className="text-muted-foreground/40 text-[9px] font-bold uppercase tracking-[0.3em]">
            System Operational · Node: 0xF29A
          </p>
        </div>
      </div>
    </div>
  );
};

export default Instructions;