
import React from 'react';
import { CaseFile, CaseArtifact } from '../types';
import { ShieldCheckIcon, DownloadIcon, ArchiveBoxIcon, XCircleIcon, PaperclipIcon } from './Icons';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
    PDFLayoutManager,
    getSafeTextArea,
    addFooterAboveQRZone,
    MARGINS,
    PAGE_DIMENSIONS,
} from '../utils/pdfLayout';

interface CaseManagerProps {
    isOpen: boolean;
    onClose: () => void;
    currentCase: CaseFile;
    onClearChat: () => void;
}

const CaseManager: React.FC<CaseManagerProps> = ({ isOpen, onClose, currentCase, onClearChat }) => {
    if (!isOpen) return null;

    const handleExportTimeline = async () => {
        // Generate QR code for the case ID
        const qrData = await QRCode.toDataURL(currentCase.caseId);
        
        // Initialize PDF layout manager
        const layoutManager = new PDFLayoutManager();
        const doc = layoutManager.getPDF();
        const safeArea = getSafeTextArea();
        
        // Set QR code to be added to all pages at the end
        layoutManager.setQRCode(qrData);

        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        layoutManager.addText("VERUM OMNIS: MASTER CASE FILE", {
            fontSize: 22,
            align: 'left',
        });
        layoutManager.addSpacing(5);
        
        // Case metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        layoutManager.addText(`Case ID: ${currentCase.caseId}`, { fontSize: 10 });
        layoutManager.addText(`Created: ${new Date(currentCase.created).toLocaleString()}`, { fontSize: 10 });
        layoutManager.addSpacing(10);

        // Separator line
        const currentY = layoutManager.getCurrentY();
        doc.setLineWidth(0.5);
        doc.line(MARGINS.LEFT, currentY, PAGE_DIMENSIONS.WIDTH - MARGINS.RIGHT, currentY);
        layoutManager.setCurrentY(currentY + 10);

        // Artifacts
        for (const artifact of currentCase.artifacts) {
             // Artifact title
             doc.setFontSize(14);
             doc.setTextColor(0, 0, 0);
             layoutManager.addText(artifact.title, { fontSize: 14 });
             layoutManager.addSpacing(3);

             // Artifact metadata
             doc.setFontSize(8);
             doc.setTextColor(100, 100, 100);
             layoutManager.addText(
                 `${artifact.type.toUpperCase()} | ${new Date(artifact.timestamp).toLocaleString()}`,
                 { fontSize: 8 }
             );
             
             doc.setFont("courier");
             layoutManager.addText(`SEAL: ${artifact.seal.substring(0, 32)}...`, { fontSize: 8 });
             doc.setFont("helvetica");
             layoutManager.addSpacing(5);

             // Content preview
             doc.setFontSize(10);
             doc.setTextColor(50, 50, 50);
             const contentPreview = artifact.content.length > 300 
                 ? artifact.content.substring(0, 300) + "..." 
                 : artifact.content;
             layoutManager.addText(contentPreview, { fontSize: 10 });
             layoutManager.addSpacing(10);
        }
        
        // Final Certification Page
        layoutManager.addPage();
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        layoutManager.addText("CRYPTOGRAPHIC CERTIFICATION", { fontSize: 18 });
        layoutManager.addSpacing(5);
        
        doc.setFontSize(10);
        layoutManager.addText(
            "This document constitutes a cryptographically sealed timeline of all artifacts.",
            { fontSize: 10 }
        );
        
        // Add footer with watermark on all pages
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooterAboveQRZone(
                doc,
                "Verum Omnis patent Pending \u2713",
                `Case ID: ${currentCase.caseId.substring(0, 12)}... | Page ${i} of ${totalPages}`,
                undefined
            );
        }
        
        // Finalize: Add QR codes to all pages in the reserved zone
        layoutManager.finalize();

        doc.save(`Master_Case_${currentCase.caseId}.pdf`);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[#0f172a] h-full shadow-2xl border-l border-slate-700 flex flex-col">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#1e293b]">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <ArchiveBoxIcon className="h-6 w-6 text-sky-400" />
                            Case Manager
                        </h2>
                        <p className="text-xs text-slate-400 font-mono mt-1">ID: {currentCase.caseId}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <XCircleIcon className="h-8 w-8" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Case Context</h3>
                        <div className="text-xs text-slate-400 max-h-32 overflow-y-auto font-mono bg-black/20 p-2 rounded">
                            {currentCase.summaryContext || "No context established yet."}
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mt-6 mb-2">Artifact Timeline</h3>
                    {currentCase.artifacts.length === 0 ? (
                        <p className="text-slate-500 text-center italic py-8">No artifacts collected.</p>
                    ) : (
                        currentCase.artifacts.map((art) => (
                            <div key={art.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-sky-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                        art.type === 'email_draft' ? 'bg-yellow-900/40 text-yellow-400' :
                                        art.type === 'evidence' ? 'bg-red-900/40 text-red-400' :
                                        'bg-sky-900/40 text-sky-400'
                                    }`}>{art.type.replace('_', ' ')}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(art.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <h4 className="text-slate-200 text-sm font-medium truncate">{art.title}</h4>
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                    <ShieldCheckIcon className="h-3 w-3" />
                                    <span className="truncate">{art.seal}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-slate-700 bg-[#1e293b] space-y-3">
                    <button 
                        onClick={handleExportTimeline}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-sky-900/20"
                    >
                        <DownloadIcon className="h-5 w-5" />
                        Export Master Case File
                    </button>
                    <button 
                        onClick={() => {
                            if(window.confirm("Are you sure? This will archive the current case locally and clear the workspace.")) {
                                onClearChat();
                                onClose();
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                    >
                        <XCircleIcon className="h-5 w-5" />
                        Clear Workspace & New Case
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CaseManager;
