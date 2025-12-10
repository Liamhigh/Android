
import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { ChatMessage as Message } from '../types';
import { UserIcon, VerumOmnisLogo, PaperclipIcon, ShieldCheckIcon, DownloadIcon, ArchiveBoxIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  onActionClick: (actionText: string) => void;
  onSaveToCase?: (title: string, content: string, type: 'email_draft' | 'report') => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onActionClick, onSaveToCase }) => {
  const isModel = message.role === 'model';
  const pdfContentRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    const source = pdfContentRef.current;
    if (!source || !message.seal) return;

    // Generate QR Code containing the seal hash
    const qrCodeDataUrl = await QRCode.toDataURL(`VERUM-OMNIS-SEAL:${message.seal}`, { width: 100, margin: 0 });

    html2canvas(source, {
      scale: 2,
      backgroundColor: '#0A192F',
      useCORS: true,
      windowWidth: 800, // Fixed width for consistency
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasAspectRatio = canvas.width / canvas.height;
      const imgWidth = pdfWidth;
      const imgHeight = pdfWidth / canvasAspectRatio;
      
      const addFooter = (pageNumber: number) => {
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        pdf.setFontSize(8);
        pdf.setTextColor('#94a3b8'); // slate-400
        
        // 1. Watermark Tick (Bottom Left)
        // "Verum Omnis patent Pending [Tick Symbol]"
        // Using a checkmark-like character
        const watermarkText = "Verum Omnis patent Pending \u2713"; 
        pdf.text(watermarkText, 10, pageHeight - 10);
        
        // 2. Partial Hash + Page Num (Bottom Center-ish)
        const partialHash = message.seal ? `Hash: ${message.seal.substring(0, 12)}...` : 'Unsealed';
        pdf.text(`${partialHash} | Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        // 3. QR Code (Bottom Right)
        // Draw image at x, y, w, h. 
        // 20x20mm QR code
        pdf.addImage(qrCodeDataUrl, 'PNG', pageWidth - 25, pageHeight - 25, 15, 15);
      };

      let heightLeft = imgHeight;
      let position = 0;
      let page = 1;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      addFooter(page);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight; // Move to next page area
        pdf.addPage();
        page++;
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        addFooter(page);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Verum_Omnis_Case_${message.seal?.substring(0,8)}.pdf`);
    });
  };

  const renderContent = (content: string) => {
    // Simple markdown renderer for the chat/pdf
    const lines = content.split('\n');
    const elements: React.JSX.Element[] = [];
    let inTable = false;
    let tableRows: React.JSX.Element[] = [];
    let tableHeader: React.JSX.Element | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect Email Draft Blocks
        if (line.includes('[START EMAIL DRAFT]')) {
             elements.push(<div key={`email-start-${i}`} className="my-4 p-2 bg-yellow-500/10 border-l-4 border-yellow-500 text-yellow-200 text-xs font-mono uppercase tracking-widest">Begin Draft</div>);
             continue;
        }
        if (line.includes('[END EMAIL DRAFT]')) {
             elements.push(<div key={`email-end-${i}`} className="my-4 p-2 bg-yellow-500/10 border-l-4 border-yellow-500 text-yellow-200 text-xs font-mono uppercase tracking-widest">End Draft</div>);
             continue;
        }

        if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
                inTable = true;
            }
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            
            if (lines[i+1] && lines[i+1].match(/^\|\s*:-/)) {
                 tableHeader = <thead key={`th-${i}`}><tr>{cells.map((cell, c_idx) => <th key={`th-cell-${i}-${c_idx}`} style={{border: '1px solid #475569', padding: '8px', textAlign: 'left', backgroundColor: '#1e293b' }}>{cell}</th>)}</tr></thead>;
            } else if (!line.match(/^\|\s*:-/)) { 
                tableRows.push(<tr key={`tr-${i}`}>{cells.map((cell, c_idx) => <td key={`td-${i}-${c_idx}`} style={{border: '1px solid #475569', padding: '8px'}}>{cell}</td>)}</tr>);
            }
        } else {
            if (inTable) {
                elements.push(
                    <table key={`table-${i - 1}`} style={{borderCollapse: 'collapse', width: '100%', margin: '1em 0', border: '1px solid #475569', fontSize: '14px'}}>
                        {tableHeader}
                        <tbody>{tableRows}</tbody>
                    </table>
                );
                tableRows = [];
                tableHeader = null;
                inTable = false;
            }

            if (line.match(/^#\s/)) elements.push(<h1 key={i} style={{color: '#cbd5e1', fontSize: '2em', margin: '0.67em 0', fontWeight: 'bold'}}>{line.substring(2)}</h1>);
            else if (line.match(/^##\s/)) elements.push(<h2 key={i} style={{color: '#cbd5e1', fontSize: '1.5em', margin: '0.83em 0', fontWeight: 'bold'}}>{line.substring(3)}</h2>);
            else if (line.match(/^###\s/)) elements.push(<h3 key={i} style={{color: '#cbd5e1', fontSize: '1.17em', margin: '1em 0', fontWeight: 'bold'}}>{line.substring(4)}</h3>);
            else if (line.trim() === '---') elements.push(<hr key={i} style={{borderTop: '1px solid #475569', margin: '1em 0'}} />);
            else elements.push(<p key={i} style={{ margin: '0.5em 0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{line || '\u00A0'}</p>);
        }
    }
    
    if (inTable) {
        elements.push(
            <table key="table-end" style={{borderCollapse: 'collapse', width: '100%', margin: '1em 0', border: '1px solid #475569'}}>
                {tableHeader}
                <tbody>{tableRows}</tbody>
            </table>
        );
    }
    return elements;
  };

  const extractEmailContent = (text: string) => {
      const start = text.indexOf('[START EMAIL DRAFT]');
      const end = text.indexOf('[END EMAIL DRAFT]');
      if (start !== -1 && end !== -1) {
          return text.substring(start + '[START EMAIL DRAFT]'.length, end).trim();
      }
      return null;
  };

  const emailDraft = extractEmailContent(message.text);

  return (
    <div className={`flex items-start gap-4 my-6 ${!isModel ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isModel ? 'bg-slate-700' : 'bg-sky-800'}`}>
        {isModel ? <VerumOmnisLogo className="h-5 w-5 text-slate-300" /> : <UserIcon className="h-5 w-5 text-sky-200" />}
      </div>
      <div className={`prose prose-invert prose-p:text-slate-300 prose-p:my-0 max-w-full rounded-xl p-4 break-words ${isModel ? 'bg-slate-800' : 'bg-sky-900/50'}`}>
        {message.text === '' && isModel ? 
          <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div></div> 
          : <div className="whitespace-pre-wrap">{message.text.split('[START OF DOCUMENT]')[0].split('[START EMAIL DRAFT]')[0]}</div>
        }
        
        {message.file && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-600/70 bg-slate-700/50 p-2 text-xs text-slate-400">
                <PaperclipIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate font-mono">{message.file.name}</span>
            </div>
        )}
        
        {message.seal && (
            <div className="mt-4 border-t border-slate-700 pt-3">
                <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-sky-400/80">
                        <ShieldCheckIcon className="h-4 w-4" />
                        Forensic Seal
                    </h4>
                    {message.location && (
                        <span className="text-[10px] font-mono text-slate-600">
                            LAT:{message.location.lat.toFixed(2)} LNG:{message.location.lng.toFixed(2)}
                        </span>
                    )}
                </div>
                <p className="mt-1 font-mono text-[10px] text-slate-500 break-all">{message.seal}</p>
            </div>
        )}

        {/* Email Draft Action */}
        {emailDraft && onSaveToCase && (
             <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                 <h5 className="text-yellow-500 text-xs font-bold mb-2 uppercase">Advisory Draft Detected</h5>
                 <p className="text-xs text-slate-400 mb-3 line-clamp-2">{emailDraft}</p>
                 <button 
                    onClick={() => onSaveToCase("Advisory Email Draft", emailDraft, 'email_draft')}
                    className="flex items-center gap-2 text-xs bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 px-3 py-2 rounded transition-colors"
                 >
                     <ArchiveBoxIcon className="h-4 w-4" />
                     Seal & Save to Case File
                 </button>
             </div>
        )}

        {/* PDF / Document Section */}
        {message.isPdfContent && message.pdfContent && (
            <>
                {/* Hidden Render Container */}
                <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '800px', fontFamily: 'sans-serif' }}>
                  <div ref={pdfContentRef} className="p-8 bg-[#0A192F] text-slate-300 min-h-[1100px] relative">
                      <div className="mb-6 border-b border-slate-600 pb-4">
                        <h1 className="text-2xl font-bold text-slate-200">FORENSIC REPORT</h1>
                        <p className="text-xs font-mono text-slate-400">REF: {message.seal?.substring(0,16)}</p>
                      </div>
                      {renderContent(message.pdfContent)}
                  </div>
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                    <button
                        onClick={handleDownloadPdf}
                        className="flex-1 flex items-center justify-center gap-2 p-3 text-sm bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-sky-300"
                    >
                        <DownloadIcon className="h-5 w-5" />
                        Download Certified PDF
                    </button>
                    {onSaveToCase && (
                        <button
                            onClick={() => onSaveToCase("Forensic Report", message.pdfContent!, 'report')}
                            className="flex-shrink-0 flex items-center justify-center p-3 text-sm bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-slate-300"
                            title="Save to Case File"
                        >
                            <ArchiveBoxIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </>
        )}
        
        {message.actions && message.actions.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {message.actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => onActionClick(action)}
                        className="w-full text-left p-3 text-xs bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-slate-200"
                    >
                        {action}
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
