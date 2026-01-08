import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UserCircle, 
  FileText, 
  CheckCircle, 
  Send,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const Instructions: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      title: "Prepare Your Data",
      desc: "Gather your Student ID, Course details, and Educational history before starting.",
      icon: <UserCircle className="text-teal-600" size={24} />
    },
    {
      title: "Fill the Digital PDS",
      desc: "Navigate to 'Submit Details' and ensure all personal information fields are correctly filled.",
      icon: <FileText className="text-teal-600" size={24} />
    },
    {
      title: "Upload Documents",
      desc: "Attach a clear profile picture and your signature as required by the system.",
      icon: <CheckCircle className="text-teal-600" size={24} />
    },
    {
      title: "Final Submission",
      desc: "Review your summary and click 'Submit'. A confirmation message will appear once successful.",
      icon: <Send className="text-teal-600" size={24} />
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-10">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-colors"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="flex items-center gap-2 text-slate-400">
            <HelpCircle size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Guide Center</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12"
        >
          <div className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-4">
              How to Submit <span className="text-teal-600">Details</span>
            </h1>
            <p className="text-slate-500 leading-relaxed">
              Follow these simple steps to ensure your profiling information is correctly recorded in the Northeastern College Institutional System.
            </p>
          </div>

          {/* Steps List */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-teal-100 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  {index !== steps.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-lg font-black text-slate-800 mb-1">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-6 p-6 bg-teal-600 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-bold">Ready to start?</p>
              <p className="text-teal-100 text-xs">The process takes less than 5 minutes.</p>
            </div>
            <button 
              onClick={() => navigate('/submit-details')}
              className="bg-white text-teal-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-50 transition-colors shadow-lg shadow-teal-900/20"
            >
              Start Submission
            </button>
          </div>
        </motion.div>

        {/* Footer Support */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs font-medium">
            Having trouble? Contact ICT Support at <span className="text-teal-600 underline">support@nc.edu.ph</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Instructions;