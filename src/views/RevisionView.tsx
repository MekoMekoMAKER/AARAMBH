import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bookmark, 
  Trash2, 
  AlertCircle, 
  History, 
  ArrowRight, 
  BookOpen,
  Calendar,
  Zap,
  Target,
  ChevronRight,
  Activity,
  Award
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BookmarkedQuestion, MistakeRecord } from '../types';
import { cn } from '../lib/utils';

export default function RevisionView({ 
  bookmarks, 
  setBookmarks, 
  mistakes, 
  setMistakes 
}: { 
  bookmarks: BookmarkedQuestion[]; 
  setBookmarks: (val: BookmarkedQuestion[]) => void;
  mistakes: MistakeRecord[];
  setMistakes: (val: MistakeRecord[]) => void;
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'mistakes'>('bookmarks');

  const clearBookmarks = () => {
    if (confirm("Clear all bookmarks?")) {
      setBookmarks([]);
    }
  };

  const removeBookmark = (id: string) => {
    const newBookmarks = bookmarks.filter(b => b.questionId !== id);
    setBookmarks(newBookmarks);
  };

  const weakAreas = mistakes
    .reduce((acc, curr) => {
      acc[curr.subject] = (acc[curr.subject] || 0) + curr.incorrectCount;
      return acc;
    }, {} as Record<string, number>);

  const sortedWeakAreas = Object.entries(weakAreas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-indigo-950 p-10 text-white shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <History size={180} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Activity size={20} className="text-indigo-400" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400">Intelligence Node</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-4">Revision Vault</h1>
          <p className="text-slate-400 font-medium max-w-md">Transform your weaknesses into strategic advantages through targeted review of gaps and bookmarks.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10 w-fit">
        <button 
          onClick={() => setActiveTab('bookmarks')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'bookmarks' ? "bg-indigo-500 text-white shadow-lg" : "text-slate-500 hover:text-white"
          )}
        >
          <Bookmark size={14} /> Bookmarks ({bookmarks.length})
        </button>
        <button 
          onClick={() => setActiveTab('mistakes')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'mistakes' ? "bg-rose-500 text-white shadow-lg" : "text-slate-500 hover:text-white"
          )}
        >
          <AlertCircle size={14} /> Mistakes ({mistakes.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTab === 'bookmarks' ? (
              <motion.div 
                key="bookmarks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <Bookmark size={20} className="text-indigo-500" />
                    Saved for Review
                  </h2>
                  {bookmarks.length > 0 && (
                    <button onClick={clearBookmarks} className="text-[10px] font-black uppercase text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-1">
                      <Trash2 size={12} /> Clear All
                    </button>
                  )}
                </div>

                {bookmarks.length === 0 ? (
                  <div className="py-20 text-center glass rounded-[2rem] border-white/5">
                    <Bookmark size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No bookmarks yet</p>
                  </div>
                ) : (
                  bookmarks.map((b) => (
                    <div key={b.questionId} className="glass p-6 rounded-3xl border border-white/10 group hover:border-indigo-500/30 transition-all flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{b.subject}</span>
                          <span className="text-[8px] font-medium text-slate-600 bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                            <Calendar size={10} /> {new Date(b.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white leading-relaxed">{b.question}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => removeBookmark(b.questionId)}
                          className="p-2 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 rounded-xl border border-transparent transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/quiz?topic=${b.topic}`)}
                          className="p-2 hover:bg-indigo-500/10 text-slate-600 hover:text-indigo-400 rounded-xl border border-transparent transition-all"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="mistakes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <AlertCircle size={20} className="text-rose-500" />
                    Error Patterns
                  </h2>
                  <button 
                    onClick={() => navigate('/quiz?special=mistakes')}
                    className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-rose-500/20 hover:scale-105 transition-transform"
                  >
                    Practice Mistakes
                  </button>
                </div>

                {mistakes.length === 0 ? (
                  <div className="py-20 text-center glass rounded-[2rem] border-white/5">
                    <Award size={48} className="mx-auto mb-4 text-emerald-500/30" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Clean Sheet! No mistakes tracked.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {mistakes.sort((a, b) => b.incorrectCount - a.incorrectCount).map((m) => (
                      <div key={m.questionId} className="glass p-6 rounded-3xl border border-white/10 flex items-center justify-between gap-6 border-l-4 border-l-rose-500">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.subject}</span>
                            <span className="text-[8px] font-black uppercase tracking-tighter text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                              Repeated {m.incorrectCount}x
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white line-clamp-1">{m.question}</p>
                        </div>
                        <button 
                          onClick={() => navigate(`/quiz?topic=${m.topic}`)}
                          className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 hover:bg-white/5 p-2 rounded-xl"
                        >
                          Revise <ChevronRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <Zap size={18} className="text-yellow-400" />
              Weakness Map
            </h3>
            
            <div className="space-y-4">
              {sortedWeakAreas.length > 0 ? sortedWeakAreas.map(([subject, count]) => (
                <div key={subject} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className="text-slate-400">{subject}</span>
                    <span className="text-rose-400">{count} Errors</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(count * 20, 100)}%` }}
                      className="h-full bg-rose-500"
                    />
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-slate-500 uppercase font-black">No data available yet</p>
              )}
            </div>

            <div className="pt-6 border-t border-white/5">
              <button 
                onClick={() => navigate('/predictions')}
                className="w-full flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl group hover:bg-indigo-500/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Award size={20} className="text-indigo-400" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Mastery Level</p>
                    <p className="text-xs font-bold text-white">View Forecast</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border border-white/10 bg-indigo-600/5">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Exam Strategy</h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Based on your bookmarks, you are prioritizing <span className="text-indigo-400 font-black">Core Subjects</span>. Consider adding more <span className="text-indigo-400 font-black">Current Affairs</span> bookmarks for a balanced score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
