import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Upload, 
  FileText, 
  Search, 
  CheckCircle2, 
  BrainCircuit, 
  Zap, 
  Loader2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  BookOpen,
  History,
  Target,
  FileSearch,
  BookMarked
} from 'lucide-react';
import { analyzeAndGenerateQuestions } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function AILabView({ stats }: { stats?: any }) {
  const isOnline = useOnlineStatus();
  const [input, setInput] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'notes'>('analysis');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const performanceHint = stats ? `Aspirant Level: ${stats.level}, Accuracy: ${Math.round((stats.correctAnswers / (stats.totalQuestionsAttempted || 1)) * 100)}%` : '';
      const result = await analyzeAndGenerateQuestions(input, difficulty, performanceHint);
      if (result) {
        setAnalysis(result);
      }
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (!analysis) return;
    // Pass questions to QuizView via state or specialized route
    navigate('/quiz?category=AI Lab', { state: { questions: analysis.questions } });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
          <BrainCircuit className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">AI Analysis Lab</h2>
          <p className="text-xs opacity-50 font-bold uppercase tracking-widest">Cognitive UPSC Extraction</p>
        </div>
      </div>

      {!analysis ? (
        <section className="glass rounded-3xl p-6 border-white/10 space-y-6">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
            <ShieldCheck className="text-emerald-400" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Google Search Grounding Active: All generated facts are cross-verified against current UPSC standards in parallel.
            </p>
          </div>

            <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intelligent Extraction Mode</label>
              <div className="flex gap-2">
                 {(['Easy', 'Medium', 'Hard', 'Mixed'] as const).map(d => (
                   <button 
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "text-[8px] font-black uppercase px-2 py-1 rounded-md border transition-all",
                      difficulty === d ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white/5 border-white/10 text-slate-500"
                    )}
                   >
                     {d}
                   </button>
                 ))}
              </div>
            </div>
            
            <textarea 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste UPSC source text, MCQs, or notes here for deep processing..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-theme-primary text-sm leading-relaxed outline-none focus:border-indigo-500/40 transition-all min-h-[300px] resize-none"
            />

            <button 
              onClick={handleAnalyze}
              disabled={loading || !input.trim() || !isOnline}
              className={cn(
                "w-full font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all",
                isOnline ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-slate-800 text-slate-500 cursor-not-allowed"
              )}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
              {isOnline ? 'Execute Deep Analysis' : 'Connect to Analyze'}
            </button>
            {!isOnline && (
              <p className="text-[10px] text-center font-bold text-rose-400 mt-2">
                AI Lab requires an internet connection for real-time cognitive processing.
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass rounded-3xl p-6 border-white/10 bg-indigo-500/5"
          >
            <div className="flex items-center justify-between mb-6">
               <div className="flex gap-4">
                 <button 
                  onClick={() => setActiveTab('analysis')}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all",
                    activeTab === 'analysis' ? "border-indigo-500" : "border-transparent opacity-50"
                  )}
                 >
                   Deep Analysis
                 </button>
                 <button 
                  onClick={() => setActiveTab('notes')}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all",
                    activeTab === 'notes' ? "border-indigo-500" : "border-transparent opacity-50"
                  )}
                 >
                   Revision Hub
                 </button>
               </div>
               <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/30 font-black text-[10px] uppercase">
                 <Search size={12} /> Verified: {analysis.analysis.relevanceScore}%
               </div>
            </div>

            {activeTab === 'analysis' ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Subject Vector</p>
                    <p className="font-bold">{analysis.analysis.subject}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Extracted Topics</p>
                    <p className="font-bold text-xs truncate">{analysis.analysis.topics.join(', ')}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8 text-slate-100">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Core Concepts Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.analysis.concepts.map((concept: string, i: number) => (
                      <span key={i} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-300">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={startQuiz}
                  className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                >
                  Start Generated Challenge ({analysis.questions.length} MCQs) <ChevronRight size={18} />
                </button>
              </>
            ) : (
              <div className="space-y-6 text-slate-100">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-3 flex items-center gap-2">
                     <BookMarked size={14} /> Quick Revision Notes
                   </h4>
                   <div className="prose prose-invert prose-xs max-w-none">
                     <ReactMarkdown>{analysis.notes.shortNotes}</ReactMarkdown>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Key Highlights</p>
                    <ul className="space-y-2">
                      {analysis.notes.upscHighlights.map((point: string, i: number) => (
                        <li key={i} className="text-xs flex gap-2 text-slate-300">
                          <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <button 
               onClick={() => setAnalysis(null)}
               className="w-full mt-6 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
            >
               Process New Document
            </button>
          </motion.div>
        </section>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6">
          <div className="relative">
             <div className="w-24 h-24 border-4 border-indigo-500/20 rounded-full animate-pulse" />
             <div className="absolute inset-0 flex items-center justify-center">
               <Cpu className="text-indigo-400 animate-spin-slow" size={32} />
             </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-white">Cognitive Processing...</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em]">Querying Global Knowledge Vaults</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-bold text-white text-sm">{value}</p>
    </div>
  );
}
