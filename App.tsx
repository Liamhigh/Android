
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage as Message, CaseFile, CaseArtifact } from './types';
import { streamAIResponse, Content, Part } from './services/aiService';
import { fileToBase64, generateSha512, generateId, getCurrentTimestamp } from './utils/forensics';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import WelcomeScreen from './components/WelcomeScreen';
import CaseManager from './components/CaseManager';

const parseActions = (text: string): string[] => {
    const actions: string[] = [];
    const lines = text.split('\n');
    const actionRegex = /^\s*\*\s+\*\*Step\s[A-Z]:\*\*\s*(.+)/;

    for (const line of lines) {
        const match = line.match(actionRegex);
        if (match && match[1]) {
            let actionText = match[1].trim();
            if (actionText.toLowerCase().startsWith('submit the')) {
                actionText = actionText.replace(/immediately\.$/i, '').trim();
            }
            if (actionText.toLowerCase().startsWith('file the')) {
                actionText = actionText.replace(/complaint\.$/i, 'Complaint').trim();
            }
            actions.push(actionText);
        }
    }
    return actions.slice(0, 3);
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Verum Omnis session initialized. Forensic protocols engaged. Ready to apply AI forensics for truth in accordance with my constitutional mandate. How may I assist you?"
    }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Case Management State
  const [currentCase, setCurrentCase] = useState<CaseFile>(() => {
      const saved = localStorage.getItem('verum_omnis_active_case');
      if (saved) return JSON.parse(saved);
      return {
          caseId: generateId().toUpperCase(),
          created: getCurrentTimestamp(),
          artifacts: [],
          summaryContext: ''
      };
  });
  const [isCaseManagerOpen, setIsCaseManagerOpen] = useState(false);

  // Sync case to storage
  useEffect(() => {
      localStorage.setItem('verum_omnis_active_case', JSON.stringify(currentCase));
  }, [currentCase]);

  // Save context summary to storage as the "small file"
  useEffect(() => {
      if (currentCase.summaryContext) {
          localStorage.setItem('verum_omnis_case_context', currentCase.summaryContext);
      }
  }, [currentCase.summaryContext]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.warn("Verum Omnis: Geolocation access denied. Jurisdictional analysis will default to international standards.", err);
        }
      );
    }
  }, []);

  const addToCase = (artifact: CaseArtifact) => {
      setCurrentCase(prev => ({
          ...prev,
          artifacts: [artifact, ...prev.artifacts] // Newest first
      }));
  };

  const clearChat = () => {
      // Archive current case logic is handled in CaseManager confirmation, this resets state
      const newCase: CaseFile = {
          caseId: generateId().toUpperCase(),
          created: getCurrentTimestamp(),
          artifacts: [],
          summaryContext: ''
      };
      setCurrentCase(newCase);
      setMessages([{
        role: 'model',
        text: "Session cleared. New forensic timeline initialized."
      }]);
      localStorage.removeItem('verum_omnis_active_case');
      localStorage.removeItem('verum_omnis_case_context');
  };

  const handleSendMessage = useCallback(async (text: string, file: File | null) => {
    if (loading) return;

    setError(null);
    setLoading(true);

    let fileData: { name: string; type: string; data: string } | undefined;
    let contentToHash = text;

    if (file) {
        const data = await fileToBase64(file);
        fileData = { name: file.name, type: file.type, data };
        contentToHash += data;
        
        // Auto-add upload to case
        const uploadHash = await generateSha512(data);
        addToCase({
            id: generateId(),
            type: 'evidence',
            title: `Upload: ${file.name}`,
            content: `File Type: ${file.type}`,
            timestamp: getCurrentTimestamp(),
            seal: uploadHash
        });
    }

    const userSeal = await generateSha512(contentToHash);

    const userMessage: Message = { 
      role: 'user', 
      text,
      file: fileData,
      seal: userSeal,
      timestamp: getCurrentTimestamp(),
      location: location || undefined
    };
    
    // Add user message to case log roughly
    addToCase({
        id: generateId(),
        type: 'chat_log',
        title: 'User Inquiry',
        content: text,
        timestamp: getCurrentTimestamp(),
        seal: userSeal
    });

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);

    const aiMessagePlaceholder: Message = { role: 'model', text: '' };
    setMessages((prev) => [...prev, aiMessagePlaceholder]);

    try {
      const history: Content[] = currentMessages.map(msg => {
          const parts: Part[] = [];
          if (msg.text) {
              parts.push({ text: msg.text });
          }
          if (msg.file) {
              parts.push({
                  inlineData: {
                      mimeType: msg.file.type,
                      data: msg.file.data,
                  },
              });
          }
          return { role: msg.role, parts };
      }).filter(c => c.parts.length > 0);
      
      const userTurn = history.pop();
      if (!userTurn) throw new Error("Cannot send empty message.");
      
      const contents = [...history.slice(1), userTurn]; 

      // Inject context (Location, Time, & Case Summary) into the AI stream request
      const stream = streamAIResponse(contents, {
          location: location || undefined,
          time: new Date().toISOString(),
          caseSummary: currentCase.summaryContext
      });
      
      let fullResponse = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullResponse += chunkText;
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'model') {
              newMessages[newMessages.length - 1] = { ...lastMessage, text: fullResponse };
            }
            return newMessages;
          });
        }
      }

      if (fullResponse) {
          const seal = await generateSha512(fullResponse);
          const actions = parseActions(fullResponse);

          let isPdf = false;
          let pdfContent: string | undefined = undefined;
          const startTag = '[START OF DOCUMENT]';
          const endTag = '[END OF DOCUMENT]';

          if (fullResponse.includes(startTag) && fullResponse.includes(endTag)) {
              isPdf = true;
              const startIndex = fullResponse.indexOf(startTag) + startTag.length;
              const endIndex = fullResponse.lastIndexOf(endTag);
              pdfContent = fullResponse.substring(startIndex, endIndex).trim();
              
              // Auto-add Generated Report to Case
              addToCase({
                  id: generateId(),
                  type: 'report',
                  title: 'AI Forensic Report',
                  content: pdfContent.substring(0, 200) + '...',
                  timestamp: getCurrentTimestamp(),
                  seal: seal
              });
          }

          // Update context summary (Simulated: taking first 200 chars of last response as "summary" for now, ideally AI would summarize itself)
          const newContext = (currentCase.summaryContext + "\n" + fullResponse.substring(0, 150) + "...").substring(0, 2000);
          setCurrentCase(prev => ({ ...prev, summaryContext: newContext }));

          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            const lastMessage = newMessages[newMessages.length - 1];
             if (lastMessage && lastMessage.role === 'model') {
                newMessages[newMessages.length - 1] = { 
                    ...lastMessage, 
                    seal, 
                    actions: actions.length > 0 ? actions : undefined,
                    isPdfContent: isPdf,
                    pdfContent: pdfContent,
                    timestamp: getCurrentTimestamp(),
                    location: location || undefined
                };
             }
            return newMessages;
          });
      }

    } catch (e: any) {
      let errorMessage = 'An error occurred. Please try again.';
      if (e?.message) errorMessage = e.message;
      setError(errorMessage);
      setMessages((prev) => prev.slice(0, prev.length - (prev[prev.length -1].role === 'model' ? 2 : 1))); 
    } finally {
      setLoading(false);
    }
  }, [loading, messages, location, currentCase.summaryContext]);

  const handleManualSaveToCase = async (title: string, content: string, type: 'email_draft' | 'report') => {
      const seal = await generateSha512(content);
      addToCase({
          id: generateId(),
          type,
          title,
          content,
          timestamp: getCurrentTimestamp(),
          seal
      });
      // Visual feedback could be added here
      setIsCaseManagerOpen(true);
  };
  
  return (
    <div className="flex flex-col h-screen bg-[#0A192F] text-slate-300 font-sans overflow-hidden relative">
      <Header onOpenCaseManager={() => setIsCaseManagerOpen(true)} />
      
      <CaseManager 
        isOpen={isCaseManagerOpen} 
        onClose={() => setIsCaseManagerOpen(false)}
        currentCase={currentCase}
        onClearChat={clearChat}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 1 && !loading && <WelcomeScreen onPromptClick={(prompt) => handleSendMessage(prompt, null)} />}
          {messages.slice(1).map((msg, index) => (
            <ChatMessage 
                key={index} 
                message={msg} 
                onActionClick={(actionText) => handleSendMessage(`Based on your analysis, please: ${actionText}`, null)} 
                onSaveToCase={handleManualSaveToCase}
            />
          ))}
          {error && (
            <div className="my-4 p-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <div className="sticky bottom-0 bg-[#0A192F]/80 backdrop-blur-sm border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <ChatInput onSendMessage={handleSendMessage} loading={loading} />
             <div className="flex flex-col items-center mt-3 gap-1">
                <p className="text-xs text-slate-500 text-center">
                  Verum Omnis operates on fixed constitutional rules. All analysis is stateless & sealed.
                </p>
                {location && (
                  <p className="text-[10px] text-sky-500/70 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                    Jurisdiction Locked: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default App;
