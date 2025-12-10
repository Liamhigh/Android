
import React from 'react';
import { VerumOmnisLogo, ArchiveBoxIcon } from './Icons';

interface HeaderProps {
    onOpenCaseManager?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenCaseManager }) => {
  return (
    <header className="sticky top-0 z-10 bg-[#0A192F]/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
        <div className="w-10"></div> {/* Spacer for alignment */}
        
        <div className="flex flex-col items-center">
            <div className="flex items-center">
            <VerumOmnisLogo className="h-8 w-8 mr-3" />
            <h1 className="text-xl font-bold tracking-wider text-slate-200">
                VERUM OMNIS
            </h1>
            </div>
            <p className="text-xs text-sky-400/70 tracking-widest mt-1">AI FORENSICS FOR TRUTH</p>
        </div>

        <button 
            onClick={onOpenCaseManager}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Open Case Manager"
        >
            <ArchiveBoxIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
