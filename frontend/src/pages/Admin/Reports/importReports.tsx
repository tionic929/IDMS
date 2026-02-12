import React, { useState, useRef, useEffect } from "react";
import { importReports, getImportedReports } from "../../../api/reports";
import { AiOutlineCloudUpload, AiOutlineFileExcel, AiOutlineCheckCircle, AiOutlineSearch, AiOutlineInbox } from "react-icons/ai";
import { Loader2 } from "lucide-react"; // Optional: for a smoother spinner
import type { ImportedReportsPayload } from "../../../types/reports";

function ImportReports() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [importedReports, setImportedReports] = useState<ImportedReportsPayload[]>([]);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const fetchImportedReports = async (pageNum = 1, search = "") => {
        setLoading(true);
        try {
            const response = await getImportedReports(pageNum, search);
            setImportedReports(response.data);
            setPage(response.current_page);
            setLastPage(response.last_page);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        try {
            await importReports(formData);
            setStatus({ type: 'success', msg: "Data imported successfully!" });
            setFile(null);
            fetchImportedReports(1, query);
        } catch (error: any) {
            setStatus({ type: 'error', msg: error.response?.data?.message || "Import failed" });
        } finally {
            setUploading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= lastPage) {
            fetchImportedReports(newPage, query);
        }
    };

    useEffect(() => {
        fetchImportedReports(1, query);
    }, []);

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Report Importer</h1>
                    <p className="text-slate-500 font-medium">Manage and review your enrollment data uploads</p>
                </div>
                
                {/* SEARCH BAR */}
                <div className="relative group w-full md:w-72">
                    <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search records..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchImportedReports(1, query)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: UPLOAD CARD */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                        
                        <div className={`border-2 border-dashed rounded-2xl p-6 transition-all ${file ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                            {!file ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <AiOutlineCloudUpload className="text-3xl text-indigo-600" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">Select File</h3>
                                    <p className="text-xs text-slate-500 mt-1 mb-4 uppercase tracking-tighter">XLSX, CSV supported</p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all"
                                    >
                                        Browse Files
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <AiOutlineFileExcel className="text-4xl text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-700 truncate mb-4">{file.name}</p>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            {uploading ? "Importing..." : "Confirm Import"}
                                        </button>
                                        <button 
                                            onClick={() => setFile(null)}
                                            className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <input 
                            type="file" accept=".xlsx, .xls, .csv" 
                            className="hidden" ref={fileInputRef} onChange={handleFileChange}
                        />

                        {status && (
                            <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${
                                status.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                                {status.type === 'success' && <AiOutlineCheckCircle size={16}/>}
                                <span>{status.msg}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: DATA TABLE */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">ID Number</th>
                                    <th className="px-6 py-4">Full Name</th>
                                    <th className="px-6 py-4">Course</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={3} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                        </tr>
                                    ))
                                ) : importedReports.length > 0 ? (
                                    importedReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{report.id_number}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{report.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                <span className="px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-bold uppercase tracking-tight">{report.course}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-20 text-center">
                                            <AiOutlineInbox className="mx-auto text-4xl text-slate-200 mb-2" />
                                            <p className="text-slate-400 font-medium">No records found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION FOOTER */}
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {page} of {lastPage}
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transition-all"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === lastPage || loading}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImportReports;