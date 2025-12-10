import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { SendIcon, PaperclipIcon, XCircleIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (text: string, file: File | null) => void;
  loading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, loading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      // Max height for 6 rows of text roughly
      const maxHeight = 48 + 4 * 24;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [text]);

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if ((trimmedText || file) && !loading) {
      onSendMessage(trimmedText, file);
      setText('');
      setFile(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <div>
        <div className="flex items-end gap-2 bg-slate-800/50 border border-slate-700 rounded-xl p-2">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
        />
        <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-shrink-0 text-slate-400 hover:text-slate-200 disabled:text-slate-600 disabled:cursor-not-allowed rounded-lg h-10 w-10 flex items-center justify-center transition-colors duration-200"
            aria-label="Attach file"
        >
            <PaperclipIcon className="h-6 w-6" />
        </button>
        <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Verum Omnis or attach a file..."
            className="flex-1 bg-transparent p-2 text-slate-200 placeholder-slate-500 focus:outline-none resize-none"
            rows={1}
            disabled={loading}
        />
        <button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && !file)}
            className="flex-shrink-0 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg h-10 w-10 flex items-center justify-center transition-colors duration-200"
            aria-label="Send message"
        >
            <SendIcon className="h-5 w-5" />
        </button>
        </div>
        {file && (
            <div className="mt-2 flex items-center justify-between text-sm bg-slate-700/50 py-1 px-3 rounded-full">
                <div className="flex items-center gap-2 truncate">
                    <PaperclipIcon className="h-4 w-4 text-slate-400"/>
                    <span className="text-slate-300 truncate">{file.name}</span>
                </div>
                <button onClick={handleRemoveFile} className="text-slate-400 hover:text-white">
                    <XCircleIcon className="h-5 w-5"/>
                </button>
            </div>
        )}
    </div>
  );
};

export default ChatInput;