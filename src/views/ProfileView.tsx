import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  LogOut, 
  Trash2, 
  Award, 
  TrendingUp, 
  Target, 
  Zap,
  BarChart3,
  Bookmark,
  ChevronDown,
  FolderOpen,
  X,
  LogIn,
  AlertCircle,
  TrendingDown,
  Brain,
  History,
  RefreshCw,
  Cloud,
  CloudOff as CloudOffIcon
} from 'lucide-react';
import { UserStats, SavedQuestion, MistakeRecord } from '../types';
import { cn } from '../lib/utils';
import { libraryService, auth, signInWithGoogle } from '../services/firebaseService';
import { User as FirebaseUser } from 'firebase/auth';

export default function ProfileView({ stats, user, isGuest, setIsGuest, mistakes = [], onSync }: { 
  stats: UserStats; 
  user: FirebaseUser | null; 
  isGuest: boolean;
  setIsGuest: (val: boolean) => void;
  mistakes?: MistakeRecord[];
  onSync?: () => Promise<void>;
}) {
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(window.navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handleManualSync = async () => {
    if (!onSync || syncing || !isOnline) return;
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadLibrary();
    }
  }, [user]);

  const handleLinkAccount = async () => {
    try {
      await signInWithGoogle();
      setIsGuest(false);
      localStorage.removeItem('upsc_guest_mode');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const data = await libraryService.getSavedQuestions();
      setSavedQuestions(data || []);
    } finally {
      setLoading(false);
    }
  };

  const groupedQuestions = savedQuestions.reduce((acc, q) => {
    const subject = q.subject || 'Uncategorized';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(q);
    return acc;
  }, {} as Record<string, SavedQuestion[]>);

  const accuracy = stats.totalQuestionsAttempted > 0 
    ? Math.round((stats.correctAnswers / stats.totalQuestionsAttempted) * 100) 
    : 0;

  const weakSubjects = Object.entries(stats.performanceBySubject || {})
    .map(([subject, perf]) => ({
      subject,
      accuracy: Math.round((perf.correct / (perf.total || 1)) * 100)
    }))
    .filter(p => p.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy);

  const resetStats = () => {
    if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
      localStorage.removeItem('upsc_smart_quiz_stats');
      window.location.reload();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 pb-20"
    >
      <div className="text-center space-y-2 py-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]" />
        
        {user ? (
          <div className="relative z-10 space-y-4">
            <div className="w-24 h-24 rounded-3xl mx-auto border-4 border-indigo-500/30 overflow-hidden shadow-2xl rotate-3">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{user.displayName || 'Aspirant'}</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{user.email}</p>
          </div>
        ) : (
          <>
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black shadow-2xl rotate-3 relative z-10 border border-white/20">
              {stats.level}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight pt-2 relative z-10">Guest Aspirant</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none py-1 relative z-10">Session data is local only</p>
          </>
        )}
      </div>

      {!user && isGuest && (
        <div className="glass p-6 rounded-[2rem] border-amber-500/20 bg-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
               <AlertCircle size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-white">Guest Mode Active</p>
              <p className="text-xs text-slate-400 font-medium">Progress is not synced across devices. Sign in to protect your streak.</p>
            </div>
          </div>
          <button 
            onClick={handleLinkAccount}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-transform flex items-center gap-2"
          >
            <LogIn size={14} /> Sign In Now
          </button>
        </div>
      )}

      {/* Cloud Status Section */}
      {user && (
        <div className="glass p-6 rounded-[2rem] border-white/5 bg-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-left">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                isOnline ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              )}>
                {isOnline ? <Cloud size={24} /> : <CloudOffIcon size={24} />}
              </div>
              <div>
                <p className="font-black text-white">{isOnline ? 'Cloud Infrastructure Live' : 'Offline Mode'}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {isOnline ? 'Your data is being backed up in real-time.' : 'Changes will sync when you reconnect.'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleManualSync}
              disabled={syncing || !isOnline}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                isOnline 
                  ? "bg-white/5 text-white hover:bg-white/10" 
                  : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
              )}
            >
              <RefreshCw size={14} className={cn(syncing && "animate-spin")} />
              {syncing ? 'Syncing...' : 'Force Sync'}
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MiniStat value={`${accuracy}%`} label="Avg Accuracy" icon={<Target size={18} className="text-blue-400" />} sub="Goal: 85%+" />
        <MiniStat value={stats.xp.toLocaleString()} label="Total XP" icon={<Zap size={18} className="text-yellow-400" />} sub={`Level ${stats.level}`} />
        <MiniStat value={stats.streak} label="Current Streak" icon={<TrendingUp size={18} className="text-orange-400" />} sub="Days in a row" />
        <MiniStat value={mistakes?.length || 0} label="Mistake Count" icon={<Brain size={18} className="text-rose-400" />} sub="Needs Review" />
        <MiniStat 
          value={stats.eliminationStats && stats.eliminationStats.total > 0 ? `${Math.round((stats.eliminationStats.correct / stats.eliminationStats.total) * 100)}%` : '---'} 
          label="Elimination Skill" 
          icon={<Target size={18} className="text-rose-400" />} 
          sub="Filter accuracy" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Weak Areas Insight */}
        <section className="glass rounded-[2rem] p-8 border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">AI Diagnostic</h3>
              <p className="text-xs text-slate-500 font-medium">Subjects requiring immediate focus</p>
            </div>
            <Brain className="text-rose-500/30" />
          </div>
          
          <div className="space-y-4">
            {weakSubjects.length > 0 ? (
              weakSubjects.map((perf) => (
                <div key={perf.subject} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-bold text-white mb-0">{perf.subject}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-black">
                    <span className="text-slate-500 uppercase tracking-widest">Accuracy</span>
                    <span className="text-rose-400">{perf.accuracy}%</span>
                    <TrendingDown size={14} className="text-rose-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 space-y-2 opacity-50">
                <Target size={20} className="mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-white">All Clear</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">No major weak spots identified</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity Mini-List */}
        <section className="glass rounded-[2rem] p-8 border-white/5 space-y-6">
           <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Recent Progress</h3>
              <p className="text-xs text-slate-500 font-medium">Last session snapshots</p>
            </div>
            <History className="text-indigo-500/30" />
          </div>

          <div className="space-y-4">
            {stats.testHistory && stats.testHistory.slice(0, 3).map((test) => (
              <div key={test.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-left">
                  <p className="text-xs font-black text-white uppercase tracking-wider">{Object.keys(test.subjectBreakdown)[0] || 'Quiz'}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{new Date(test.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-indigo-400">+{test.correct * 10} XP</p>
                  <p className="text-[10px] text-slate-500 font-bold">{test.correct}/{test.totalQuestions}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Library Section */}
        <section className="glass rounded-[2rem] p-8 border-white/5 shadow-xl h-fit">
          <h3 className="font-black text-xl mb-6 flex items-center gap-2 tracking-tight text-white">
            <Bookmark className="text-indigo-400" /> Vault of Insight
          </h3>
          
          <div className="space-y-4">
            {Object.entries(groupedQuestions).length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl opacity-40 italic text-sm text-slate-400">
                No questions saved yet.
              </div>
            ) : (
              Object.entries(groupedQuestions).map(([subject, qs]) => (
                <div key={subject} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                  <button 
                    onClick={() => setExpandedFolder(expandedFolder === subject ? null : subject)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors interactive-tap"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen size={20} className="text-indigo-400" />
                      <span className="font-bold text-base text-white">{subject}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black bg-indigo-500/20 px-3 py-1 rounded-full text-indigo-300">{qs.length}</span>
                      <ChevronDown size={18} className={cn("text-slate-500 transition-transform duration-300", expandedFolder === subject && "rotate-180")} />
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {expandedFolder === subject && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-5 space-y-3"
                      >
                        {qs.map((sq) => (
                          <div key={sq.id} className="p-4 bg-white/3 rounded-xl border border-white/5 text-sm opacity-90 interactive-hover">
                            <p className="font-bold mb-3 line-clamp-2 leading-relaxed text-white">{sq.questionData.question}</p>
                            <div className="flex justify-between items-center opacity-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                               <span>Correct Opt: {String.fromCharCode(65 + sq.questionData.correctAnswer)}</span>
                               <span>{new Date(sq.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="space-y-8">
          <section className="glass rounded-[2rem] p-8 border-white/5 shadow-xl">
            <h3 className="font-black text-xl mb-8 flex items-center gap-3 tracking-tight text-white">
              <BarChart3 className="text-indigo-400" /> Mastery Scale
            </h3>
            
            <div className="space-y-8">
              <MetricBar 
                label="Accuracy Proficiency" 
                value={accuracy} 
                color="bg-emerald-500" 
              />
              <MetricBar 
                label="Curriculum Expansion" 
                value={Math.min(100, (stats.level / 20) * 100)} 
                color="bg-indigo-500" 
              />
              <MetricBar 
                label="Daily Discipline" 
                value={Math.min(100, (stats.streak / 30) * 100)} 
                color="bg-orange-500" 
              />
            </div>
          </section>

          <section className="glass rounded-[2rem] border-white/5 overflow-hidden shadow-2xl divide-y divide-white/5">
            <button 
              onClick={user ? handleSignOut : () => {}} 
              className={cn(
                "w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors group interactive-tap",
                !user && "opacity-30 cursor-not-allowed"
              )}
              disabled={!user}
            >
              <div className="flex items-center gap-4">
                <LogOut size={22} className="opacity-50 text-white" />
                <span className="font-bold text-base text-white">De-authorize Device</span>
              </div>
              <ChevronDown className="-rotate-90 text-slate-700" size={18} />
            </button>
            
            <button 
              onClick={resetStats} 
              className="w-full flex items-center justify-between p-6 hover:bg-rose-500/10 transition-colors group interactive-tap"
            >
              <div className="flex items-center gap-4 text-rose-400">
                <Trash2 size={22} />
                <span className="font-bold text-base">Purge Progress Database</span>
              </div>
              <Trash2 size={20} className="text-rose-900 group-hover:text-rose-500 transition-all group-hover:translate-x-1" />
            </button>
          </section>
        </div>
      </div>

      <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] pt-8 opacity-40">
        Consistency Is The Foundation.
      </p>
    </motion.div>
  );
}

function MiniStat({ value, label, icon, sub }: { value: number | string; label: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className={cn("glass p-5 rounded-[2rem] border-white/5 text-left interactive-hover")}>
      <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-lg">
        {icon}
      </div>
      <p className="text-2xl font-black tracking-tighter text-white leading-none mb-1">{value}</p>
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</p>
      {sub && <p className="text-[9px] text-slate-700 font-bold mt-1 uppercase tracking-tighter">{sub}</p>}
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="text-slate-500">{label}</span>
        <span className="text-white">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={cn("h-full rounded-full", color)}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

