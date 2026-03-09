import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthenticatedImage from './AuthenticatedImage';

interface PaymentProofModalProps {
    url: string;
    onClose: () => void;
}

const PaymentProofModal: React.FC<PaymentProofModalProps> = ({ url, onClose }) => {
    const isPDF = url.toLowerCase().endsWith('.pdf');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
                            <FileText size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Payment Proof</h2>
                            <p className="text-[13px] font-bold text-zinc-500">View uploaded receipt</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                                <Download size={18} />
                            </Button>
                        </a>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-10 w-10 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-zinc-50/50 dark:bg-zinc-900/20 p-6 flex flex-col items-center justify-center min-h-[400px]">
                    {isPDF ? (
                        <iframe
                            src={url}
                            className="w-full h-full min-h-[60vh] rounded-xl border border-zinc-200 dark:border-zinc-800"
                            title="Payment Proof PDF"
                        />
                    ) : (
                        <AuthenticatedImage
                            src={url}
                            alt="Payment Proof"
                            className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
                        />
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PaymentProofModal;
