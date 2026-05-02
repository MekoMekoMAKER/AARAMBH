import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight,
  BrainCircuit,
  Target,
  Sparkles,
  BookOpen,
  History,
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { TopicPrediction, UserStats } from '../types';
import { getTopicPredictions } from '../services/geminiService';
import { cn, safeGet } from '../lib/utils';

export default function SmartPredictionsView() {
  const [predictions, setPredictions] = useState<TopicPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const savedStats = safeGet('upsc_smart_quiz_stats', null);
    if (savedStats) setStats(savedStats);
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await getTopicPredictions();
      setPredictions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const weakSubjects = stats ? Object.entries({
    Polity: 70, // Mock values if real stats don't have per-subject breakdown yet
    Economy: 65,
    History: 40,
    Geography: 85,
    Environment: 55,
    'S&T': 60
  }).sort((a, b) => a[1] - b[1]).slice(0, 2) : [];

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-indigo-600 p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <BrainCircuit size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30">
              <Sparkles size={24} className="text-yellow-300" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-100">AI Forecasting Engine v2.0</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black tracking-tighter mb-6 leading-tight"
          >
            UPSC 2024-25 <br/>
            <span className="text-indigo-200">Probability Matrix</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-indigo-100/80 font-medium leading-relaxed"
          >
            Advanced trend analysis combining 10 years of PYQs with contemporary geopolitical shifts and economic indicators.
          </motion.p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Predictions List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <Target size={24} className="text-indigo-500" />
              High Probability Topics
            </h2>
            <button 
              onClick={fetchPredictions}
              disabled={loading}
              className="p-3 hover:bg-white/5 rounded-xl transition-all border border-white/5 disabled:opacity-50"
            >
              <RefreshCw size={18} className={cn("text-slate-400", loading && "animate-spin")} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-32 flex flex-col items-center justify-center gap-6"
              >
                <div className="relative">
                  <Loader2 size={64} className="animate-spin text-indigo-500" />
                  <div className="absolute inset-0 blur-2xl bg-indigo-500/20 animate-pulse" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Synthesizing Trends...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {predictions.map((item, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={item.id}
                    className="glass group hover:bg-white/5 p-6 rounded-3xl border border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                        item.priority === 'High' ? "bg-red-500/10 border-red-500/30 text-red-500" :
                        item.priority === 'Medium' ? "bg-orange-500/10 border-orange-500/30 text-orange-500" :
                        "bg-indigo-500/10 border-indigo-500/30 text-indigo-500"
                      )}>
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.subject}</span>
                          <span className={cn(
                            "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border",
                            item.priority === 'High' ? "bg-red-500/20 border-red-500/40 text-red-500" :
                            item.priority === 'Medium' ? "bg-orange-500/20 border-orange-500/40 text-orange-500" :
                            "bg-indigo-500/20 border-indigo-400/40 text-indigo-400"
                          )}>
                            {item.priority} Priority
                          </span>
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-white mb-2">{item.topic}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">{item.reason}</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/5 group-hover:scale-105">
                      View Study Notes
                      <ArrowUpRight size={14} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Intelligence Side Panel */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-8">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <BrainCircuit size={20} className="text-indigo-400" />
              Smart Insights
            </h2>

            <div className="space-y-6">
              <div className="p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldAlert size={60} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Critical Alert</p>
                <p className="text-sm font-bold text-white leading-relaxed">
                  Focus on <span className="text-indigo-400">Environment & Agriculture</span>. Trends show a 25% increase in conceptual questions from these sectors in recent tests.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject Weakness Guard</p>
                {weakSubjects.map(([subject, score]) => (
                  <div key={subject} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tighter">
                      <span className="text-white">{subject}</span>
                      <span className="text-red-400">{score}% Accuracy</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        className="h-full bg-red-500"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 italic">Recommendation: "Revise {subject} Fundamentals immediately"</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Preparation Velocity</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/3 rounded-2xl border border-white/5">
                    <p className="text-xl font-black text-white">{stats?.totalQuestionsAttempted || 0}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Qs</p>
                  </div>
                  <div className="text-center p-4 bg-white/3 rounded-2xl border border-white/5">
                    <p className="text-xl font-black text-emerald-400">{stats ? (stats.correctAnswers / (stats.totalQuestionsAttempted || 1) * 100).toFixed(0) : 0}%</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Avg Accuracy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border border-white/10 bg-emerald-500/5">
             <h2 className="text-lg font-black text-white flex items-center gap-3 mb-6">
               <History size={18} className="text-emerald-400" />
               PYQ Continuity
             </h2>
             <p className="text-xs text-slate-300 leading-relaxed font-medium">
               Topics like <span className="text-emerald-400 font-black">Buddhist Philosophy</span> and <span className="text-emerald-400 font-black">Money Multiplier</span> showing strong repetition patterns. Revision recommended.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
