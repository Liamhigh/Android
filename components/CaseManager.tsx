
import React from 'react';
import { CaseFile, CaseArtifact } from '../types';
import { ShieldCheckIcon, DownloadIcon, ArchiveBoxIcon, XCircleIcon, PaperclipIcon } from './Icons';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface CaseManagerProps {
    isOpen: boolean;
    onClose: () => void;
    currentCase: CaseFile;
    onClearChat: () => void;
}

const CaseManager: React.FC<CaseManagerProps> = ({ isOpen, onClose, currentCase, onClearChat }) => {
    if (!isOpen) return null;

    const handleExportTimeline = async () => {
        const doc = new jsPDF();
        let yPos = 20;

        doc.setFontSize(22);
        doc.text("VERUM OMNIS: MASTER CASE FILE", 15, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Case ID: ${currentCase.caseId}`, 15, yPos);
        yPos += 6;
        doc.text(`Created: ${new Date(currentCase.created).toLocaleString()}`, 15, yPos);
        yPos += 15;

        doc.setLineWidth(0.5);
        doc.line(15, yPos, 195, yPos);
        yPos += 10;

        for (const artifact of currentCase.artifacts) {
             if (yPos > 250) {
                 doc.addPage();
                 yPos = 20;
             }

             doc.setFontSize(14);
             doc.setTextColor(0);
             doc.text(artifact.title, 15, yPos);
             yPos += 6;

             doc.setFontSize(8);
             doc.setTextColor(100);
             doc.text(`${artifact.type.toUpperCase()} | ${new Date(artifact.timestamp).toLocaleString()}`, 15, yPos);
             yPos += 5;
             doc.setFont("courier");
             doc.text(`SEAL: ${artifact.seal.substring(0, 32)}...`, 15, yPos);
             doc.setFont("helvetica");
             yPos += 8;

             // Preview content
             doc.setFontSize(10);
             doc.setTextColor(50);
             const contentPreview = artifact.content.length > 300 ? artifact.content.substring(0, 300) + "..." : artifact.content;
             const splitText = doc.splitTextToSize(contentPreview, 180);
             doc.text(splitText, 15, yPos);
             yPos += (splitText.length * 5) + 10;
        }
        
        // Final Certification
        doc.addPage();
        doc.setFontSize(18);
        doc.text("CRYPTOGRAPHIC CERTIFICATION", 15, 30);
        doc.setFontSize(10);
        doc.text("This document constitutes a cryptographically sealed timeline of all artifacts.", 15, 40);
        
        // Add Master QR
        const qrData = await QRCode.toDataURL(currentCase.caseId);
        doc.addImage(qrData, 'PNG', 150, 230, 40, 40);
        doc.text("Verum Omnis patent Pending \u2713", 15, 260);

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
