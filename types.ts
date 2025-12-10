
export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  text: string;
  file?: {
    name:string;
    type: string;
    data: string;
  };
  seal?: string;
  actions?: string[];
  isPdfContent?: boolean;
  pdfContent?: string;
  timestamp?: string;
  location?: { lat: number; lng: number };
}

export interface CaseArtifact {
  id: string;
  type: 'evidence' | 'report' | 'email_draft' | 'chat_log';
  title: string;
  content: string; // Text summary or base64
  timestamp: string;
  seal: string;
  metadata?: any;
}

export interface CaseFile {
  caseId: string;
  created: string;
  artifacts: CaseArtifact[];
  summaryContext: string; // The "small file" for AI context
}
