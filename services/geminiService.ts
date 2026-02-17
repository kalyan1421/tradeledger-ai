import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedData } from "../types";

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    trades: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          symbol: { type: Type.STRING },
          trade_type: { type: Type.STRING, enum: ["BUY", "SELL"] },
          quantity: { type: Type.NUMBER },
          price: { type: Type.NUMBER },
          order_value: { type: Type.NUMBER },
          exchange: { type: Type.STRING },
        },
        required: ["symbol", "trade_type", "quantity", "price", "order_value", "exchange"]
      }
    },
    charges: {
      type: Type.OBJECT,
      properties: {
        brokerage: { type: Type.NUMBER },
        stt: { type: Type.NUMBER },
        gst: { type: Type.NUMBER },
        stamp_duty: { type: Type.NUMBER },
        exchange_charges: { type: Type.NUMBER },
        sebi_charges: { type: Type.NUMBER },
        total_charges: { type: Type.NUMBER },
      },
      required: ["brokerage", "stt", "gst", "total_charges"]
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        gross_pnl: { type: Type.NUMBER },
        net_pnl: { type: Type.NUMBER },
      },
      required: ["gross_pnl", "net_pnl"]
    }
  },
  required: ["trades", "charges", "summary"]
};

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return await base64EncodedDataPromise;
};

export const analyzeContractNote = async (apiKey: string | undefined, pdfBase64: string): Promise<ExtractedData> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are an expert financial data analyst specializing in Indian Stock Market Contract Notes (Zerodha, AngelOne, etc.).
    Your task is to extract trading data, calculate charges, and summarize P&L from the provided PDF document.
    
    1. Identify the 'Trades' or 'Transactions' table. Extract Symbol, Buy/Sell type, Quantity, Price, and calculated Order Value.
    2. Identify the 'Charges' section (Brokerage, STT, GST, Exchange Txn, Sebi, Stamp Duty).
    3. Calculate Gross P&L (Sell Value - Buy Value) and Net P&L (Gross P&L - Total Charges).
    4. Ensure strict JSON output based on the schema.
    5. Ignore any non-trade related info.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64
            }
          },
          {
            text: "Extract trade details, charges, and summary from this contract note."
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1, 
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    return JSON.parse(jsonText) as ExtractedData;

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};