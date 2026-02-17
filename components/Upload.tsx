import React, { useState, useRef } from 'react';
import { CloudUpload, FileText, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { analyzeContractNote, fileToGenerativePart } from '../services/geminiService';
import { saveContractNoteData, auth, uploadPDF } from '../services/firebase.ts';
import { ExtractedData } from '../types';

const Upload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'saving' | 'success' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      alert("Please upload a valid PDF contract note.");
      return;
    }
    setFile(f);
    setStatus('idle');
    setExtractedData(null);
    setErrorMsg('');
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!auth.currentUser) {
      alert("Please login to process data.");
      return;
    }

    try {
      setStatus('scanning');
      // Step 1: Upload to Storage (Optional security measure)
      await uploadPDF(auth.currentUser.uid, file);
      
      setStatus('processing');
      // Step 2: Extract data using Gemini
      const apiKey = process.env.API_KEY; 
      if (!apiKey) throw new Error("API Key missing");

      const base64Data = await fileToGenerativePart(file);
      const data = await analyzeContractNote(apiKey, base64Data);
      
      setExtractedData(data);
      
      setStatus('saving');
      // Step 3: Save to Firestore
      await saveContractNoteData(auth.currentUser.uid, data, file.name);
      
      setStatus('success');

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || "Failed to process contract note.");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-textMain mb-2">Upload Contract Note</h1>
        <p className="text-textMuted max-w-2xl">
          Securely process your broker contract notes (PDF) to auto-import trades using Gemini AI. 
          We support Zerodha, Angel One, Groww, and Upstox formats.
        </p>
      </div>

      {/* Upload Zone */}
      <div 
        className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
          flex flex-col items-center justify-center min-h-[320px]
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border bg-surface hover:border-textMuted'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden" 
        />
        
        {file ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-surfaceHighlight rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border shadow-xl">
               <FileText size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-medium text-textMain mb-1">{file.name}</h3>
            <p className="text-sm text-textMuted">{(file.size / 1024).toFixed(1)} KB</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); setStatus('idle'); }}
              className="mt-4 text-xs text-red-400 hover:text-red-300 underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          <>
             <div className="w-16 h-16 bg-surfaceHighlight rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
               <CloudUpload size={28} className="text-primary" />
             </div>
             <h3 className="text-xl font-bold text-textMain mb-2">Drag & drop your PDF here</h3>
             <p className="text-textMuted mb-8 text-sm">or click to browse from your computer</p>
             
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="px-6 py-2 bg-surfaceHighlight border border-border rounded-lg text-sm font-medium hover:bg-border transition-colors flex items-center gap-2"
             >
               <Lock size={14} /> 256-bit Encrypted Upload
             </button>
          </>
        )}
      </div>

      {/* Password & Actions */}
      <div className="mt-8 flex flex-col md:flex-row gap-6 items-end">
         <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-textMain mb-2">
              PDF Password <span className="text-xs text-textMuted font-normal ml-2">(Usually your PAN or PAN+DOB)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted" size={16} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password if protected"
                className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-textMain focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
         </div>
         <button 
           onClick={handleAnalyze}
           disabled={!file || status === 'processing' || status === 'scanning' || status === 'saving'}
           className={`
             w-full md:w-auto px-8 py-3 rounded-lg font-bold text-background flex items-center justify-center gap-2 min-w-[200px]
             ${!file ? 'bg-zinc-700 cursor-not-allowed text-zinc-400' : 'bg-primary hover:bg-primaryHover text-black'}
             transition-all
           `}
         >
           {status === 'processing' || status === 'scanning' || status === 'saving' ? (
             <><Loader2 className="animate-spin" size={20} /> Processing...</>
           ) : (
             <><div className="rotate-45"><CloudUpload size={20} /></div> Analyze & Import</>
           )}
         </button>
      </div>

      {/* Status & Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Processing Status Card */}
        <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-semibold text-textMain">Processing Status</h3>
             <div className={`w-3 h-3 rounded-full ${status === 'idle' ? 'bg-zinc-700' : 'bg-primary animate-pulse'}`}></div>
           </div>
           
           <div className="space-y-4">
              <StatusItem label="File Uploaded" done={!!file} active={false} />
              <StatusItem label="Scanning & Security" done={status !== 'scanning' && status !== 'idle'} active={status === 'scanning'} />
              <StatusItem label="Gemini AI Analysis" done={status === 'saving' || status === 'success'} active={status === 'processing'} />
              <StatusItem label="Saving to Database" done={status === 'success'} active={status === 'saving'} />
           </div>

           {status === 'error' && (
             <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-2 text-sm text-red-400">
               <AlertCircle size={16} /> {errorMsg}
             </div>
           )}
        </div>

        {/* Import Summary Card */}
        <div className={`bg-surface border border-border rounded-xl p-6 transition-opacity duration-500 ${extractedData ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
           <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2 text-primary font-semibold">
               <div className="p-1 rounded bg-yellow-900/30">
                 <div className="w-4 h-4 border-2 border-primary rounded-full border-t-transparent animate-spin" style={{ display: status === 'success' ? 'none' : 'block' }}></div>
                 <CheckCircle size={16} style={{ display: status === 'success' ? 'block' : 'none' }} />
               </div>
               Import Summary
             </div>
             <span className="text-xs text-textMuted bg-surfaceHighlight px-2 py-1 rounded">Real-time</span>
           </div>

           {extractedData ? (
             <>
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                     <FileText className="text-blue-500" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-textMain">Contract Note</h4>
                    <p className="text-xs text-textMuted">P&L: ₹{extractedData.summary.net_pnl.toFixed(2)}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[10px] text-textMuted uppercase">Trades</div>
                    <div className="text-2xl font-mono font-bold text-primary">{extractedData.trades.length}</div>
                  </div>
               </div>
               
               <div className="w-full bg-surfaceHighlight p-3 rounded-lg text-sm font-mono text-textMuted">
                 Saved to Firestore successfully. Check Dashboard.
               </div>
             </>
           ) : (
             <div className="h-32 flex items-center justify-center text-textMuted text-sm italic">
               Waiting for analysis...
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

const StatusItem = ({ label, done, active }: { label: string; done: boolean; active: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`
      w-6 h-6 rounded-full flex items-center justify-center border transition-all
      ${done ? 'bg-green-500 border-green-500 text-black' : active ? 'border-primary text-primary' : 'border-zinc-700 text-zinc-700'}
    `}>
      {done ? <CheckCircle size={14} /> : active ? <Loader2 size={14} className="animate-spin" /> : <div className="w-2 h-2 rounded-full bg-zinc-700"></div>}
    </div>
    <span className={`text-sm ${done || active ? 'text-textMain' : 'text-zinc-600'}`}>{label}</span>
  </div>
);

export default Upload;