import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Youtube, ArrowRight, HelpCircle, ClipboardCheck } from 'lucide-react';
import nclogo from '../assets/nc_logo.png';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Simple Navigation Header */}
      <nav className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={nclogo} alt="NC Logo" className="w-10 h-10 object-contain" />
          <span className="font-extrabold text-lg tracking-tighter text-[#00928a]">NCnian School ID</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-bold text-slate-500">
          <button onClick={() => navigate('/how-to-submit')} className="hover:text-[#00928a] transition-colors">Help</button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative px-6 py-12 md:py-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online Registration is Open
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1]">
              Northeastern College <br />
              <span className="text-[#00928a]">ID</span> Application
            </h1>
            
            <p className="text-slate-500 text-lg md:text-xl max-w-lg mx-auto md:mx-0 leading-relaxed">
              Welcome to the NC'nian School ID Portal. Submit your details for your official school ID card.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
              <button 
                onClick={() => navigate('/submit-details')}
                className="group flex items-center justify-center gap-3 bg-[#00928a] hover:bg-[#007a73] text-white px-8 py-4 rounded-2xl font-black text-sm tracking-widest shadow-xl shadow-teal-900/20 transition-all hover:-translate-y-1 active:scale-95"
              >
                SUBMIT DETAILS
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => navigate('/how-to-submit')}
                className="flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-slate-50 transition-all active:scale-95"
              >
                HOW TO SUBMIT
              </button>
            </div>
          </motion.div>

          {/* Visual/Feature Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden md:block relative"
          >
            <div className="absolute inset-0 bg-teal-100 rounded-[3rem] rotate-3 -z-10"></div>
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-2xl relative">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
                    <ClipboardCheck className="text-teal-600" size={32} />
                    <h3 className="font-black text-sm">Quick Process</h3>
                    <p className="text-xs text-slate-400">Complete your profile in under 5 minutes.</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
                    <HelpCircle className="text-teal-600" size={32} />
                    <h3 className="font-black text-sm">Support</h3>
                    <p className="text-xs text-slate-400">Step-by-step instructions available.</p>
                  </div>
               </div>
               {/* <div className="mt-4 p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl text-white">
                  <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black text-white">Online Registration is Open</p>
               </div> */}
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 border-t border-slate-100 md:mt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex justify-center items-center gap-3 text-center md:text-left">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Connect with us</p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/NcNianIDv2" className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-[#00928a] hover:text-white transition-all"><Facebook size={20} /></a>
            </div>
          </div>
          <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
            © 2025 Northeastern College BSIT Department - All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;