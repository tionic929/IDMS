import React, { useState, useRef, useEffect } from "react";
import { importReports, getImportedReports } from "@/api/reports";
import {
    CloudUpload, FileSpreadsheet, CheckCircle2,
    Search, Inbox, AlertCircle, RefreshCw,
    X, ChevronLeft, ChevronRight
} from "lucide-react";
import type { ImportedReportsPayload } from "@/types/reports";

// shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        <div className="max-w-[1400px] mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Data Management</span>
                        <span className="text-border">/</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Import</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Report Importer</h1>
                    <p className="text-muted-foreground font-medium text-sm">Synchronize enrollment data through automated spreadsheet processing.</p>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Filter synchronization log..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchImportedReports(1, query)}
                        className="pl-10 h-11 shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* UPLOAD PANEL */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-xl shadow-primary/5 bg-gradient-to-b from-card to-muted/20">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold">Data Upload</CardTitle>
                            <CardDescription className="text-xs">Drag and drop your spreadsheet here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center gap-4 group cursor-pointer",
                                    file ? "border-emerald-500/50 bg-emerald-500/5" : "border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 hover:border-primary/50"
                                )}
                                onClick={() => !file && fileInputRef.current?.click()}
                            >
                                {!file ? (
                                    <>
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <CloudUpload className="h-7 w-7 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Click to browse</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">XLSX, CSV Supported</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                            <FileSpreadsheet className="h-7 w-7 text-emerald-500" />
                                        </div>
                                        <div className="w-full">
                                            <p className="text-sm font-bold truncate px-4">{file.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Ready for processing</p>
                                        </div>
                                        <div className="flex flex-col w-full gap-2 mt-2">
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                                disabled={uploading}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                            >
                                                {uploading ? (
                                                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing</>
                                                ) : "Initiate Import"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                className="h-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive"
                                            >
                                                Discard File
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <input
                                type="file" accept=".xlsx, .xls, .csv"
                                className="hidden" ref={fileInputRef} onChange={handleFileChange}
                            />

                            {status && (
                                <Alert variant={status.type === 'success' ? 'default' : 'destructive'} className={cn(
                                    "border-none shadow-sm",
                                    status.type === 'success' ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                                )}>
                                    {status.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    <AlertTitle className="text-xs font-bold uppercase tracking-widest mb-1">
                                        {status.type === 'success' ? "Success" : "Error"}
                                    </AlertTitle>
                                    <AlertDescription className="text-xs font-medium opacity-90">
                                        {status.msg}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardContent className="p-6 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Import Guidelines</h4>
                            <ul className="grid gap-2">
                                {[
                                    "Column headers must match schema",
                                    "ID numbers must be unique digits",
                                    "Courses names should be capitalized",
                                    "Maximum file size is 10MB"
                                ].map((item, i) => (
                                    <li key={i} className="text-[11px] font-medium flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-primary/40" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* LOG TABLE */}
                <Card className="lg:col-span-8 border-none shadow-xl shadow-primary/5 h-full flex flex-col min-h-[600px]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">Import History</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">Detailed log of previously imported student records.</CardDescription>
                    </CardHeader>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="pl-8 w-[180px]">ID Number</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead className="pr-8">Departmental Course</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(10)].map((_, i) => (
                                        <TableRow key={i} className="animate-pulse">
                                            <TableCell className="pl-8"><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-48 bg-muted rounded" /></TableCell>
                                            <TableCell className="pr-8"><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : importedReports.length > 0 ? (
                                    importedReports.map((report) => (
                                        <TableRow key={report.id} className="group transition-colors">
                                            <TableCell className="pl-8 font-mono text-[11px] font-bold text-primary">
                                                {report.id_number}
                                            </TableCell>
                                            <TableCell className="font-semibold text-foreground">
                                                {report.name}
                                            </TableCell>
                                            <TableCell className="pr-8">
                                                <div className="inline-flex items-center px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground uppercase border border-border">
                                                    {report.course}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-60 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Inbox className="h-10 w-10 text-muted-foreground/20" />
                                                <p className="text-sm font-medium text-muted-foreground">No synchronization logs available</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-6 border-t border-border flex items-center justify-between bg-card shrink-0">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Sync Page {page} <span className="mx-2 text-border">/</span> Total {lastPage}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                                className="h-9 px-4"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === lastPage || loading}
                                className="h-9 px-4"
                            >
                                Next <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default ImportReports;