import { useEffect, useState, useCallback } from "react";
import { 
  BsPerson, BsClock, BsCreditCard
} from "react-icons/bs";
import { FiFilter, FiSearch } from "react-icons/fi";
import MetricCard from "../../../components/SubComponents/MetricCard";
import ApplicantsTable from "../../../components/ApplicantsTable";
import { getApplicantsReport } from "../../../api/students";
import { type ApplicantCard } from "../../../types/card";

import ApplicantDetailsModal from "../../../components/Modals/ApplicantDetailsModal";

const ApplicantsIndex: React.FC = () => {
  const [report, setReport] = useState({ total: 0, pending: 0, issued: 0});
  const [query, setQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantCard | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      const data = await getApplicantsReport();
      setReport({
        total: data.applicantsReport || 0,
        pending: data.pendingCount || 0,
        issued: data.issuedCount || 0,
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-5 lg:p-8 font-sans selection:bg-indigo-100">
      <div className="mx-auto max-w-[1400px] space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-3xl font-sans font-[600] text-slate-800 tracking-tight">
              Applicants <span className="text-indigo-600 font-medium">Registry</span>
            </h1>
            <p className="text-slate-500 text-sm">Review, verify, and issue identification cards.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72 group">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Find applicant..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isFilterOpen ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FiFilter size={16} /> Filters
            </button>
          </div>
        </header>

        {/* METRICS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard icon={BsPerson} title="Total Applicants" value={report.total.toLocaleString()} color="bg-blue-600" />
          <MetricCard icon={BsClock} title="Pending Review" value={report.pending.toLocaleString()} color="bg-amber-500" />
          <MetricCard icon={BsCreditCard} title="Issued Cards" value={report.issued.toLocaleString()} color="bg-indigo-600" />
        </section>

        {/* FILTERS PANEL */}
        {isFilterOpen && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
              <select className="w-full border-slate-200 rounded-lg text-xs font-semibold py-2.5 px-3 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none">
                <option>All Departments</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issuance Status</label>
              <select className="w-full border-slate-200 rounded-lg text-xs font-semibold py-2.5 px-3 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none">
                <option>All Records</option>
                <option>Issued</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
        )}

        {/* DATA TABLE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">History Log</h3>
          </div>
          <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
            <ApplicantsTable 
              query={query} 
              onViewDetails={(applicant: ApplicantCard) => setSelectedApplicant(applicant)} 
            />
          </div>
        </div>
      </div>

      {selectedApplicant && (
        <ApplicantDetailsModal 
          data={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
        />
      )}
    </div>
  );
};

export default ApplicantsIndex;