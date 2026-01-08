import React, { useState, useRef, useEffect } from "react";
import { importReports, getImportedReports } from "../../../api/reports";
import { AiOutlineCloudUpload, AiOutlineFileExcel, AiOutlineCheckCircle, AiOutlinePrinter } from "react-icons/ai";
import type { ImportedReportsPayload } from "../../../types/reports";

function ImportReports() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const [hasImported, setHasImported] = useState(false);

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

    const fetchImportedReports = async (page = 1, search = "") => {
        setLoading(true);
        try{
            const response = await getImportedReports(page, search);
            console.log(response);
            setImportedReports(response.data);
            setPage(response.current_page);
            setLastPage(response.last_page);
        } catch (err) {
            console.log(err);
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
            setHasImported(true);
            fetchImportedReports(1, searchQuery);
        } catch (error: any) {
            setStatus({ type: 'error', msg: error.response?.data?.message || "Import failed" });
        } finally {
            setUploading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= lastPage){
            fetchImportedReports(newPage, query);
        }
    };

    useEffect (() => {
        fetchImportedReports(currentPage, searchQuery);
    }, [currentPage]);

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center shadow-sm">
                <AiOutlineCloudUpload className="mx-auto text-6xl text-indigo-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Import Applicants</h2>
                <p className="text-slate-500 mt-2 mb-6 text-sm uppercase tracking-widest font-semibold">
                    Upload your .xlsx or .csv enrollment list
                </p>

                <input
                    title="fileChange"
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />

                {!file ? (
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                        >
                            Select Excel File
                        </button>
                        
                        {/* {hasImported && (
                            <button
                                onClick={() =>handleSave()}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <AiOutlinePrinter className="text-xl" />
                                Save to Students DB
                            </button>
                        )} */}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <AiOutlineFileExcel className="text-emerald-500 text-2xl" />
                            <span className="font-mono text-sm font-bold text-slate-700">{file.name}</span>
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setFile(null)}
                                className="px-6 py-3 text-slate-500 font-bold uppercase text-xs tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpload}
                                disabled={uploading}
                                className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200"
                            >
                                {uploading ? "Importing..." : "Confirm Upload"}
                            </button>
                        </div>
                    </div>
                )}

                {status && (
                    <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 justify-center ${
                        status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                        {status.type === 'success' && <AiOutlineCheckCircle />}
                        <span className="text-sm font-bold">{status.msg}</span>
                    </div>
                )}

                <div className="overflow-x-auto mt-6">
                    <table className="min-w-full bg-white border border-slate-200">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="p-3 text-left">ID Number</th>
                                <th className="p-3 text-left">Full Name</th>
                                <th className="p-3 text-left">Course</th>
                            </tr>
                        </thead>
                        <tbody>
                            {importedReports.length > 0 ? (
                                importedReports.map((report) => (
                                    <tr key={report.id} className="border-t border-slate-100">
                                        <td className="p-3 font-mono text-sm">{report.id_number}</td>
                                        <td className="p-3 text-left">
                                            {report.name}
                                        </td>
                                        <td className="p-3 text-left">{report.course}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-slate-400">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* PAGINATION SECTION */}
                <div className="flex justify-end items-center gap-4 mt-4">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Page {page} of {lastPage}</span>
                    <div className="flex gap-2">
                        <button 
                            disabled={page === 1 || loading} 
                            onClick={() => handlePageChange(page - 1)} 
                            className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            Prev
                        </button>
                        <button 
                            disabled={page === lastPage || loading} 
                            onClick={() => handlePageChange(page + 1)} 
                            className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImportReports;