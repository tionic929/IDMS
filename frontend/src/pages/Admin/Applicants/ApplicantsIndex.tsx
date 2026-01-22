import { useEffect, useState, useCallback } from "react";
import { BsPerson, BsCheckCircle, BsClock, BsCreditCard, BsPlusLg } from "react-icons/bs";
import { FiFilter } from "react-icons/fi";
import MetricCard from "../../../components/SubComponents/MetricCard";
import ApplicantsTable from "../../../components/ApplicantsTable";
import { getApplicantsReport } from "../../../api/students";

const ApplicantsIndex: React.FC = () => {
  const [report, setReport] = useState({
    total: 0,
    pending: 0,
    issued: 0,
  });
  const [reportLoading, setReportLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const data = await getApplicantsReport();
      // Assuming your API returns these counts
      setReport({
        total: data.applicantsReport || 0,
        pending: data.pendingCount || 0,
        issued: data.issuedCount || 0,
      });
    } catch (err) { console.error(err); } 
    finally { setReportLoading(false); }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return (
    <div className="min-h-screen bg-[#f8fafc] px-8 py-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        
        {/* Sticky Enterprise Header */}
        <header className="sticky top-0 z-20 bg-[#f8fafc]/80 backdrop-blur-md pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <nav className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Dashboard / Registration
            </nav>
            <h1 className="text-3xl font-sans tracking-tight text-slate-900 uppercase">
              Applicants <span className="text-indigo-600">Central</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3 rounded-xl border transition-all ${isFilterOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              <FiFilter size={20} />
            </button>
          </div>
        </header>

        {/* KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={BsPerson} title="Total Applicants" value={report.total.toLocaleString()} color="bg-blue-500" />
          <MetricCard icon={BsClock} title="Pending Review" value={report.pending} color="bg-amber-500" />
          <MetricCard icon={BsCreditCard} title="IDs Issued" value={report.issued} color="bg-indigo-500" />
        </section>

        {/* Advanced Filter Panel (Collapsible) */}
        {isFilterOpen && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
               <select className="w-full border-slate-200 rounded-lg text-sm font-medium focus:ring-indigo-500"><option>All Departments</option></select>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase">NFC Status</label>
               <select className="w-full border-slate-200 rounded-lg text-sm font-medium focus:ring-indigo-500"><option>Any</option><option>Registered</option></select>
             </div>
             {/* Add more filters as needed */}
          </div>
        )}

        {/* Main Table Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <ApplicantsTable query={query} />
        </div>
      </div>
    </div>
  );
};

export default ApplicantsIndex;