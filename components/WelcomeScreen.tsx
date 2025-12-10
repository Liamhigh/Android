import React from 'react';
import { VerumOmnisLogo } from './Icons';

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptClick }) => {
  const examplePrompts = [
    "What is the Triple Verification Doctrine?",
    "Analyze this contract for potential legal risks.",
    "Explain your constitutional principle of 'INDETERMINATE DUE TO CONCEALMENT'.",
    "Summarize the legal precedent of SAPS Case #126/4/2025.",
  ];

  return (
    <div className="text-center py-16 px-4">
      <div className="flex justify-center items-center mb-6">
        <VerumOmnisLogo className="h-20 w-20 text-slate-400" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-2">Verum Omnis</h1>
      <p className="text-slate-400 mb-10">The World's First Legally-Validated Forensic AI</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {examplePrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            className="text-left p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors duration-200"
          >
            <p className="text-slate-300 font-medium">{prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;