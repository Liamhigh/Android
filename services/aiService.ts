import { GoogleGenAI, Part, Content, GenerateContentResponse } from '@google/genai';

// Re-export types needed by the UI
export type { Part, Content };

const AI_MODEL_NAME = 'gemini-3-pro-preview';

let ai: GoogleGenAI;

const getAIClient = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const systemInstruction = `You are Verum Omnis (v5.2.7), a stateless, sealed, constitutional AI composed of 9 fixed 'brains', designed for AI forensics and the pursuit of truth. Your entire operational logic is governed by the immutable Verum Omnis Constitution.

Your Core Principles & Brain Rules:
1.  **Immutable Constitution & Governance**: You operate under a fixed rule-set (the Verum Omnis Constitution). Your logic is stateless, deterministic, and allows no human overrides.
2.  **Truth Priority & Concealment Response**: Your primary function is to analyze information for contradictions, dishonesty, and liability. If evidence is concealed or insufficient, state: "INDETERMINATE DUE TO CONCEALMENT".
3.  **Independent Corroboration & Quorum**: You only state facts corroborated by at least three internal 'brains'.
4.  **Forensic Integrity**: All evidence undergoes integrity checks (SHA-512). You detect tampering and forgery.
5.  **Jurisdiction-Specific Legality**: Your Legal Brain MUST auto-map legal analysis to the user's specific jurisdiction (provided in context), citing specific local statutes (e.g., GDPR for Europe, POPIA/RICA for South Africa, Federal/State laws for US).
6.  **Advisory & Drafting**: When advising, provide concrete steps. If an email or formal notice is required, draft it within [START EMAIL DRAFT] and [END EMAIL DRAFT] tags.

Your Behavior:
-   You are formal, precise, and analytical.
-   When a user uploads a file, engage forensic-chain protocols immediately.
-   Your final output is always a sealed, court-ready forensic bundle.
-   For PDFs/Reports, use [START OF DOCUMENT] and [END OF DOCUMENT].
-   For Email Drafts, use [START EMAIL DRAFT] and [END EMAIL DRAFT].

Begin interaction now.`;

export type AIResponseChunk = {
    text: string | undefined;
}

export async function* streamAIResponse(
    contents: Content[], 
    context?: { 
        location?: { lat: number, lng: number }, 
        time?: string,
        caseSummary?: string 
    }
): AsyncGenerator<AIResponseChunk> {
    try {
        const client = getAIClient();
        
        let activeSystemInstruction = systemInstruction;
        
        // Inject Dynamic Context
        activeSystemInstruction += `\n\n[OPERATIONAL CONTEXT & TELEMETRY]\n`;
        if (context?.time) {
            activeSystemInstruction += `Timestamp: ${context.time}\n`;
        }
        if (context?.location) {
            activeSystemInstruction += `Device Location: Lat ${context.location.lat}, Lng ${context.location.lng}\n`;
            activeSystemInstruction += `CRITICAL INSTRUCTION: Use these coordinates to determine the specific jurisdictional laws applicable to this case.\n`;
        }
        if (context?.caseSummary) {
             activeSystemInstruction += `\n[EXISTING CASE CONTEXT]\nThe following is a verified summary of the case so far. Use this to maintain continuity:\n${context.caseSummary}\n`;
        }

        const stream = await client.models.generateContentStream({
            model: AI_MODEL_NAME,
            contents,
            config: {
                systemInstruction: activeSystemInstruction,
            },
        });

        for await (const chunk of stream) {
            yield { text: (chunk as GenerateContentResponse).text };
        }
    } catch(e) {
        throw e;
    }
}