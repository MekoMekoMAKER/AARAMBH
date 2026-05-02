import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  Target, 
  Zap, 
  ChevronRight,
  BookOpen,
  Sparkles,
  Loader2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Bookmark
} from 'lucide-react';
import { BrainCircuit } from '../components/Icons';
import { UserStats, XP_PER_LEVEL, StudyPlan, BookmarkedQuestion, MistakeRecord } from '../types';
import { getXPProgress, cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { generateStudyPlan } from '../services/geminiService';

const categories = [
  { name: 'Polity', color: 'bg-blue-500', icon: '⚖️' },
  { name: 'History', color: 'bg-amber-600', icon: '📜' },
  { name: 'Geography', color: 'bg-emerald-500', icon: '🌏' },
  { name: 'Economy', color: 'bg-indigo-500', icon: '📈' },
  { name: 'Environment', color: 'bg-green-600', icon: '🌿' },
  { name: 'Science', color: 'bg-purple-500', icon: '🔬' },
];

export default function DashboardView({ 
  stats, 
  bookmarks = [], 
  mistakes = [] 
}: { 
  stats: UserStats;
  bookmarks: BookmarkedQuestion[];
  mistakes: MistakeRecord[];
}) {
  const progress = getXPProgress(stats.xp);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(() => {
    const saved = localStorage.getItem('upsc_study_plan');
    return saved ? JSON.parse(saved) : null;
  });
  const [generating, setGenerating] = useState(false);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const planData = await generateStudyPlan(stats);
      if (planData) {
        const newPlan: StudyPlan = {
          userId: 'local',
          planData,
          generatedAt: new Date().toISOString()
        };
        setStudyPlan(newPlan);
        localStorage.setItem('upsc_study_plan', JSON.stringify(newPlan));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 pb-12 text-theme-primary"
    >
      {/* Profile & Level Card */}
      <section className="glass rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Trophy size={100} />
        </div>
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {stats.level}
            </div>
            <div className="absolute -bottom-2 -right-2 glass border-white/20 p-1.5 rounded-lg shadow-sm">
              <Trophy className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Welcome, Officer!</h2>
            <p className="text-sm opacity-60 font-medium tracking-tight">
              Aspirant Level {stats.level} • {Math.max(0, XP_PER_LEVEL - (stats.xp % XP_PER_LEVEL))} XP to next rank
            </p>
          </div>
        </div>
        
        <div className="space-y-2 relative z-10">
          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
             <span>Progression Level {stats.level}</span>
             <span>{stats.xp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</span>
             <span>Phase {stats.level + 1}</span>
          </div>
        </div>
      </section>

      {/* AI Study Plan Section */}
      <section className="glass rounded-3xl p-6 border-white/5 shadow-xl bg-indigo-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-400" />
            <h3 className="font-black text-lg">AI Mentor Plan</h3>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/ai-lab"
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10"
            >
              AI Lab
            </Link>
            <button 
              onClick={handleGeneratePlan}
              disabled={generating}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : 'Refresh Plan'}
            </button>
          </div>
        </div>

        {!studyPlan ? (
          <div className="text-center py-6 space-y-4">
             <Calendar className="mx-auto text-slate-700 w-8 h-8" />
             <p className="text-sm text-slate-400 font-medium">No personalized plan detected. Let AI analyze your performance.</p>
             <button 
                onClick={handleGeneratePlan}
                className="bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-[0.2em] px-6 py-2 rounded-xl"
             >
                Initialize Strategy
             </button>
          </div>
        ) : (
          <div className="space-y-4 text-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Focus Mode</p>
                 <p className="text-sm font-bold text-white line-clamp-1">{studyPlan.planData.prioritySubjects?.[0] || 'General'}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Critical Weakness</p>
                 <p className="text-sm font-bold text-white line-clamp-1">{studyPlan.planData.weakAreas?.[0] || 'N/A'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Next Objectives</p>
               {studyPlan.planData.dailyTargets?.slice(0, 2).map((target, i) => (
                 <div key={i} className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-xl text-[10px] font-medium text-emerald-100">
                    <CheckCircle2 size={12} className="text-emerald-400" /> {target}
                 </div>
               ))}
            </div>
          </div>
        )}
      </section>

      {/* Revision & Mistakes Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          to="/revision"
          className="glass p-6 rounded-3xl border border-white/5 hover:bg-white/5 transition-all flex items-center justify-between group interactive-tap"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 text-rose-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black text-white leading-tight">Mistake Tracker</h4>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                {mistakes.length > 0 ? `${mistakes.length} Weak Topics Detected` : 'Clean Sheet - Practice Now'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link 
          to="/revision"
          className="glass p-6 rounded-3xl border border-white/5 hover:bg-white/5 transition-all flex items-center justify-between group interactive-tap"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-500">
               <Bookmark size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black text-white leading-tight">Revision Vault</h4>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                {bookmarks.length > 0 ? `${bookmarks.length} Bookmarks Saved` : 'No Bookmarks Yet'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Flame className="text-orange-400" />} 
          label="Streak" 
          value={`${stats.streak} Days`}
          subtext="Unbeatable focus"
        />
        <StatCard 
          icon={<Target className="text-indigo-400" />} 
          label="Accuracy" 
          value={stats.totalQuestionsAttempted > 0 ? `${Math.round((stats.correctAnswers / stats.totalQuestionsAttempted) * 100)}%` : '0%'}
          subtext="Correct Precision"
        />
        <StatCard 
          icon={<BrainCircuit className="text-indigo-400" />} 
          label="Level" 
          value={stats.level.toString()}
          subtext="Mastery Level"
        />
        <StatCard 
          icon={<Zap className="text-indigo-400" />} 
          label="Total XP" 
          value={stats.xp.toLocaleString()}
          subtext="Experience Gained"
        />
      </section>

      {/* AI Smart Matrix Prediction Banner */}
      <Link 
        to="/predictions"
        className="block glass bg-gradient-to-br from-indigo-900 to-indigo-950 border-indigo-500/30 rounded-[2.5rem] p-8 hover:scale-[1.01] transition-all overflow-hidden relative group shadow-2xl border interactive-tap"
      >
        <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:rotate-12 transition-transform duration-700">
           <Zap size={180} className="text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                <Sparkles size={24} className="text-yellow-300" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400">Quantum Analysis Active</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter text-white">Smart Matrix Forecast</h3>
            <p className="text-indigo-200/60 font-medium max-w-md">Identify high-probability topics and strategic geography hotspots using AI-driven UPSC pattern recognition.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-6 py-4 bg-indigo-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-500/40 flex items-center gap-2 group-hover:gap-4 transition-all">
               Analyze Probability <ChevronRight size={18} />
             </div>
          </div>
        </div>
      </Link>

      {/* Syllabus Level Up Card */}
      <Link 
        to="/syllabus"
        className="block glass border-orange-500/30 rounded-3xl p-6 hover:scale-[1.02] transition-transform overflow-hidden relative group shadow-xl interactive-tap"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10 group-hover:from-orange-600/20 group-hover:to-red-600/20 transition-all duration-500" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-orange-400 mb-1">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Monarch Protocol</span>
            </div>
            <h3 className="text-xl font-black tracking-tight">Syllabus Expansion</h3>
            <p className="text-xs opacity-60 font-medium">Track your study progress & earn rewards.</p>
          </div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-end"
          >
            <Zap className="text-orange-500 mb-1" size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Track Mastery</span>
          </motion.div>
        </div>
      </Link>

      {/* Categories */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h3 className="font-black text-lg">Subject Quizzes</h3>
          <Link to="/quiz?category=Custom" className="bg-white/5 border border-white/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 interactive-tap self-start">
            <Zap size={14} /> Custom Challenge
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link 
              key={cat.name} 
              to={`/quiz?category=${cat.name}`}
              className="glass p-5 rounded-2xl border-white/5 flex flex-col gap-3 hover:bg-white/10 hover:border-white/20 transition-all group interactive-hover"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg", cat.color.replace('bg-', 'bg-opacity-20 bg-') + " border border-" + cat.color.split('-')[1] + "-500/30")}>
                {cat.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight text-slate-400">Practice Now</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <Link 
        to="/exam"
        className="block glass border-indigo-500/30 rounded-3xl p-8 hover:scale-[1.02] transition-transform overflow-hidden relative group shadow-2xl interactive-tap"
      >
        <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-sm group-hover:bg-indigo-600/30 transition-colors" />
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-2">Ready for Prelims?</h3>
          <p className="opacity-70 text-sm mb-6 max-w-md">Take a full-length simulated mock test to gauge your rank and identify weak spots.</p>
          <div className="inline-flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg shadow-indigo-500/30">
            Start Exam <ChevronRight size={18} />
          </div>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform group-hover:opacity-10 hidden sm:block">
          <BookOpen size={160} />
        </div>
      </Link>
    </motion.div>
  );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext: string }) {
  return (
    <div className="glass p-6 rounded-3xl border-white/5 shadow-xl interactive-hover">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-lg">
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black tracking-tighter">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight opacity-80">{subtext}</p>
      </div>
    </div>
  );
}
