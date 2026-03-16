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
            className="bg-card w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                        <FileText size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-foreground tracking-tight uppercase">Payment Proof</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">View uploaded receipt</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground">
                            <Download size={16} />
                        </Button>
                    </a>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-9 w-9 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <X size={18} />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-background/50 p-6 flex flex-col items-center justify-center min-h-[400px]">
                {isPDF ? (
                    <iframe
                        src={url}
                        className="w-full h-full min-h-[60vh] rounded-lg border border-border bg-white"
                        title="Payment Proof PDF"
                    />
                ) : (
                    <AuthenticatedImage
                        src={url}
                        alt="Payment Proof"
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    />
                )}
            </div>
        </motion.div>
        </motion.div>
    );
};

export default PaymentProofModal;
