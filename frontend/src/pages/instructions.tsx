import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, UserCircle, FileText, CheckCircle, Send, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import nclogo from '../assets/nc_logo.png';

const NC_TEAL = '#00928a';

const steps = [
  {
    title: "Prepare Your Data",
    desc: "Gather your Student ID, course details, and educational history before starting.",
    icon: <UserCircle size={22} className="text-teal-600" />,
  },
  {
    title: "Fill the Application Form",
    desc: "Navigate to 'Submit Details' and ensure all personal information fields are correctly filled.",
    icon: <FileText size={22} className="text-teal-600" />,
  },
  {
    title: "Upload Documents",
    desc: "Attach a clear 2×2 profile picture and your signature as required by the system.",
    icon: <CheckCircle size={22} className="text-teal-600" />,
  },
  {
    title: "Final Submission",
    desc: "Review your summary and click 'Submit'. A confirmation message will appear once successful.",
    icon: <Send size={22} className="text-teal-600" />,
  },
];

const Instructions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-zinc-100 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={nclogo} alt="NC Logo" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-sm tracking-tight" style={{ color: NC_TEAL }}>NCnian School ID</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <HelpCircle size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Guide Center</span>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 text-sm font-bold transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 md:p-10"
        >
          {/* Title */}
          <div className="mb-10">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-3">
              How to Submit{' '}
              <span style={{ color: NC_TEAL }}>Details</span>
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Follow these simple steps to ensure your info is correctly recorded
              in the Northeastern College Institutional System.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-5">
                {/* Icon + connector */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-zinc-100 my-2" />
                  )}
                </div>
                {/* Text */}
                <div className="pb-8 pt-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Step {i + 1}</span>
                  </div>
                  <h3 className="text-base font-black text-zinc-800 mb-1">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            className="mt-2 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 text-white"
            style={{ backgroundColor: NC_TEAL }}
          >
            <div>
              <p className="font-black text-sm">Ready to start?</p>
              <p className="text-teal-100 text-xs mt-0.5">The process takes less than 5 minutes.</p>
            </div>
            <button
              onClick={() => navigate('/submit-details')}
              className="bg-white text-teal-700 px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-teal-50 transition-colors shadow-sm"
            >
              Start Submission
            </button>
          </div>
        </motion.div>

        {/* Footer note */}
        <p className="mt-6 text-center text-zinc-400 text-xs">
          Having trouble? Contact ICT Support at{' '}
          <a href="mailto:support@nc.edu.ph" className="underline" style={{ color: NC_TEAL }}>
            support@nc.edu.ph
          </a>
        </p>
      </div>
    </div>
  );
};

export default Instructions;