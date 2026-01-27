import { useEffect, useState, useCallback } from "react";
import { BsPerson, BsClock, BsCreditCard } from "react-icons/bs";
import { FiFilter, FiSearch } from "react-icons/fi";
import MetricCard from "../../../components/SubComponents/MetricCard";
import ApplicantsTable from "../../../components/ApplicantsTable";
import { getApplicantsReport } from "../../../api/students";

const ApplicantsIndex: React.FC = () => {
  const [report, setReport] = useState({ total: 0, pending: 0, issued: 0 });
  const [query, setQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
        
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 pb-8">
          <h1 className="text-3xl font-sans font-[600] text-slate-800 tracking-regular">
            Applicants <span className="text-indigo-600 font-medium">Registry</span>
          </h1>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72 group">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
              <input
                type="text"
                placeholder="Find applicant..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                isFilterOpen 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <FiFilter size={16} /> Filters
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard icon={BsPerson} title="Gross Applicants" value={report.total.toLocaleString()} color="bg-blue-600" />
          <MetricCard icon={BsClock} title="Awaiting Review" value={report.pending} color="bg-amber-500" />
          <MetricCard icon={BsCreditCard} title="Inventory Issued" value={report.issued} color="bg-indigo-600" />
        </section>

        {isFilterOpen && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
              <select title="Departments" className="w-full border-slate-200 rounded-lg text-xs font-semibold py-2 px-3 focus:ring-indigo-500/10 focus:border-indigo-500">
                <option>All Departments</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issuance Status</label>
              <select title="Status" className="w-full border-slate-200 rounded-lg text-xs font-semibold py-2 px-3 focus:ring-indigo-500/10 focus:border-indigo-500">
                <option>All Records</option>
                <option>Issued</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
        )}

        {/* Main Records Container */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">History</h3>
          </div>
          <ApplicantsTable query={query} />
        </div>
      </div>
    </div>
  );
};

export default ApplicantsIndex;