import React, { useState, useRef } from 'react';
import { bringToLife } from '../services/gemini';
import { Cpu, Upload, FileText, Sparkles, RefreshCw, Send, Check, AlertCircle, PlayCircle, HelpCircle } from 'lucide-react';


export const NeevScanner: React.FC<any> = ({ addXp }) => {
  const [prompt, setPrompt] = useState('Build an interactive set of 5 flashcards covering Stoic Philosophy axioms based on Meditations.');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    { title: "Review Flashcards", cmd: "Build an interactive flashcard review companion about structural DBMS internals, locking, and ACID compliance, complete with click-to-flip animations." },
    { title: "Mind Map Summary", cmd: "Write a mind-map breakdown of Stephen Hawking's Brief History of Time, including interactive click nodes of black hole physics definitions." },
    { title: "Study Quiz Builder", cmd: "Construct an interactive 3-question multiple choice quiz with immediate grading feedback about the life and product philosophy of Steve Jobs." },
    { title: "Terminologies Glossary", cmd: "Extract a key glossaries cheat sheet detailing Keras layers, activation matrices, and standard learning optimizer functions." }
  ];

  // Helper converter
  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64String = reader.result as string;
      const base64Data = b64String.split(',')[1];
      setFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setMimeType(file.type);
      convertToBase64(file);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setMimeType(file.type);
      convertToBase64(file);
    }
  };

  const handleManualUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileBase64('');
    setMimeType('');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMessage('');
    
    try {
      // Direct call to standard bringToLife in services/gemini.ts!
      const html = await bringToLife(prompt, fileBase64 || undefined, mimeType || undefined);
      setGeneratedHtml(html);
      addXp(250); // High task output grants substantial XP
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'The Gemini connection timed out or is misconfigured. Verify environment variables.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-[20px] duration-500">
      
      {/* Intro section detail */}
      <section className="bg-muted/50/40 border border-border/60 rounded-2xl p-6 space-y-2">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
          <h2 className="text-base font-bold text-foreground tracking-tight">AI Book / Bookmark Scanner</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed font-light">
          We leverage Gemini AI reasoning to parse physical printed textbooks or handwritten margins notes. Snap a photo of book covers, bookmarks, or scribbles (or pick from suggestions below), and watch our scanner instantly generate interactive, custom study guides and widgets in real-time!
        </p>
      </section>

      {/* Control Input & Creation workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Creation settings on left */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleGenerate} className="bg-muted/50/30 border border-border/60 rounded-2xl p-5 space-y-4">
            
            {/* Drag and drop zone */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Input Document/Cover (Optional):</label>
              
              <div
                onDragEnter={onDrag}
                onDragOver={onDrag}
                onDragLeave={onDrag}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5 ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-950/20' 
                    : selectedFile 
                    ? 'border-emerald-800 bg-emerald-950/5' 
                    : 'border-border/60 hover:border-border bg-background/20'
                }`}
                onClick={handleManualUploadClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {selectedFile ? (
                  <>
                    <FileText className="w-8 h-8 text-emerald-400 animate-bounce" />
                    <p className="text-xs text-foreground/90 font-bold truncate max-w-full">{selectedFile.name}</p>
                    <p className="text-[9px] font-mono text-muted-foreground/60">{(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown MIME'}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                      className="text-[9px] font-mono text-muted-foreground hover:text-red-400 underline pt-1"
                    >
                      Clear selected file
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-zinc-650" />
                    <p className="text-xs text-muted-foreground font-medium">Drag Cover file here, or click to browse</p>
                    <p className="text-[9px] font-mono text-zinc-650">Supports JPG, PNG, WEBP, or PDF</p>
                  </>
                )}
              </div>
            </div>

            {/* Prompt textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Instructions / Target Output Format:</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                required
                placeholder="Excribe detailed prompt or instructions on how to synthesize the textbook resource..."
                className="w-full bg-background border border-border/60/80 rounded-xl p-3 text-xs focus:outline-none focus:border-purple-650 text-foreground placeholder-zinc-650 font-light resize-none"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 disabled:from-zinc-800 hover:from-purple-500 hover:to-indigo-505 disabled:text-muted-foreground/50 border border-purple-500/20 rounded-xl font-bold text-xs text-foreground tracking-wider flex items-center justify-center space-x-2 transition"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini synthesizing book...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Synthesize Phygital Companion (+250 XP)</span>
                </>
              )}
            </button>

            {/* Diagnostic error box */}
            {errorMessage && (
              <div className="bg-red-950/20 border border-red-900/60 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs text-red-400 font-light">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Scanner Error</p>
                  <p className="text-[11px] leading-snug">{errorMessage}</p>
                </div>
              </div>
            )}

          </form>

          {/* Prompt Suggestion Chips */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest font-semibold">Preset Quick-Shortcuts:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((sug, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => setPrompt(sug.cmd)}
                  className="p-3 text-left rounded-xl bg-muted/50/15 border border-border hover:border-border transition text-xs"
                >
                  <span className="font-semibold text-muted-foreground block mb-0.5">{sug.title}</span>
                  <span className="text-[10px] text-muted-foreground/60 line-clamp-1">{sug.cmd}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Generated Live Iframe Companion on right */}
        <div className="lg:col-span-3 flex flex-col justify-between h-full min-h-[450px]">
          <div className="bg-[#0b0b0d] border border-border/60 rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl">
            
            {/* Embedded Iframe Toolhead */}
            <div className="bg-[#121214] px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <PlayCircle className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-xs font-bold text-foreground/90">Interactive Companion Preview</span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground/60 uppercase bg-muted/50 border border-border px-2 rounded-md">Live Sandbox</span>
            </div>

            {/* Display canvas */}
            <div className="flex-1 w-full bg-background flex flex-col items-center justify-center p-4 relative min-h-[380px]">
              
              {generatedHtml ? (
                <iframe
                  title="Gemini Synthesized Study Node"
                  srcDoc={generatedHtml}
                  className="w-full h-full border-0 rounded-lg bg-muted/50 shadow-md"
                  sandbox="allow-scripts allow-modals"
                />
              ) : (
                <div className="text-center space-y-3 p-8">
                  {isGenerating ? (
                    <>
                      <div className="relative w-12 h-12 mx-auto flex items-center justify-center mb-2">
                        <div className="absolute inset-0 border border-purple-500/20 rounded-full animate-ping"></div>
                        <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                      </div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Compiling Study Guide</h4>
                      <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto">Gemini is harvesting book parameters and wrapping layouts in modern JS/CSS structures...</p>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-12 h-12 text-zinc-750 mx-auto" />
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Scanner Input</h4>
                      <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto">Submit custom prompts or click a preset shortcut chip on the left to fire up the Gemini node generator.</p>
                    </>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>

      </section>

    </div>
  );
};
