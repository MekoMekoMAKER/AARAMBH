import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Moon, 
  Sun,
  LayoutDashboard,
  Settings,
  User as UserIcon,
  Map,
  Timer,
  Zap,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Globe,
  History as HistoryIcon,
  CloudOff,
  CloudRain,
  CloudDownload,
  CloudAlert
} from 'lucide-react';
import { BrainCircuit, Phoenix } from './components/Icons';
import React from 'react';
import { UserStats, TestResult, AppTheme, XP_PER_LEVEL, XP_PER_CORRECT, XP_COMPLETION_BONUS, AppData, BookmarkedQuestion, MistakeRecord, SyllabusState } from './types';
import { calculateLevel, cn, safeGet, safeSet } from './lib/utils';
import { differenceInDays, isYesterday, isToday } from 'date-fns';
import ThemeSwitcher from './components/ThemeSwitcher';

// Views
import DashboardView from './views/DashboardView';
import QuizView from './views/QuizView';
import ExamView from './views/ExamView';
import MapView from './views/MapView';
import SmartPredictionsView from './views/SmartPredictionsView';
import RevisionView from './views/RevisionView';
import ProfileView from './views/ProfileView';
import ForumView from './views/ForumView';
import AILabView from './views/AILabView';
import SyllabusView from './views/SyllabusView';

import { User as FirebaseUser } from 'firebase/auth';
import { auth, dataService } from './services/firebaseService';
import AuthOverlay from './components/AuthOverlay';

const INITIAL_STATS: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  totalQuestionsAttempted: 0,
  correctAnswers: 0,
  testHistory: [],
  performanceBySubject: {}
};

import { UPSC_SYLLABUS } from './data/syllabus';

const INITIAL_SYLLABUS: SyllabusState = {
  subjects: UPSC_SYLLABUS,
  logs: [],
  streak: 0,
  lastLoggedDate: null
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('upsc_guest_mode') === 'true');
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<UserStats>(() => safeGet('upsc_smart_quiz_stats', INITIAL_STATS));
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>(() => safeGet('upsc_bookmarks', []));
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => safeGet('upsc_mistakes', []));
  const [syllabus, setSyllabus] = useState<SyllabusState>(() => safeGet('upsc_syllabus_v2', INITIAL_SYLLABUS));

  const [isOnline, setIsOnline] = useState(dataService.isOnline());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>(dataService.isOnline() ? 'synced' : 'offline');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    if (!user || !isOnline) return;
    setSyncStatus('syncing');
    try {
      const cloudData = await dataService.loadAppData();
      if (cloudData) {
        const localData: AppData = {
          stats: safeGet('upsc_smart_quiz_stats', INITIAL_STATS),
          bookmarks: safeGet('upsc_bookmarks', []),
          mistakes: safeGet('upsc_mistakes', []),
          syllabus: safeGet('upsc_syllabus_v2', INITIAL_SYLLABUS)
        };
        
        const merged = dataService.mergeData(localData, cloudData);
        setStats(merged.stats);
        setBookmarks(merged.bookmarks);
        setMistakes(merged.mistakes);
        setSyllabus(merged.syllabus || INITIAL_SYLLABUS);
        
        await dataService.saveAppData(merged);
      } else {
        const currentData: AppData = { stats, bookmarks, mistakes, syllabus };
        await dataService.saveAppData(currentData);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('offline');
    }
  };

  useEffect(() => {
    if (isOnline && user) {
      triggerSync();
    }
  }, [isOnline, user]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Fetch cloud data and merge
        const cloudData = await dataService.loadAppData();
        if (cloudData) {
          const localData: AppData = {
            stats: safeGet('upsc_smart_quiz_stats', INITIAL_STATS),
            bookmarks: safeGet('upsc_bookmarks', []),
            mistakes: safeGet('upsc_mistakes', []),
            syllabus: safeGet('upsc_syllabus_v2', INITIAL_SYLLABUS)
          };
          
          const merged = dataService.mergeData(localData, cloudData);
          setStats(merged.stats);
          setBookmarks(merged.bookmarks);
          setMistakes(merged.mistakes);
          setSyllabus(merged.syllabus || INITIAL_SYLLABUS);
          
          // Persistence sync
          await dataService.saveAppData(merged);
        } else {
          // New user, push current local data to cloud
          const currentData: AppData = { stats, bookmarks, mistakes, syllabus };
          await dataService.saveAppData(currentData);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGuestAccess = () => {
    setIsGuest(true);
    localStorage.setItem('upsc_guest_mode', 'true');
  };
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('upsc_theme') as AppTheme) || 'dark';
  });

  useEffect(() => {
    safeSet('upsc_smart_quiz_stats', stats);
    safeSet('upsc_bookmarks', bookmarks);
    safeSet('upsc_mistakes', mistakes);
    safeSet('upsc_syllabus_v2', syllabus);
    
    if (user) {
      dataService.saveAppData({ stats, bookmarks, mistakes, syllabus });
    }
  }, [stats, bookmarks, mistakes, syllabus, user]);

  useEffect(() => {
    localStorage.setItem('upsc_theme', theme);
    const themeClasses = ['theme-dark', 'theme-sepia', 'theme-dim-gray', 'theme-night-blue', 'theme-forest', 'theme-deep-purple', 'theme-white-classic'];
    document.body.classList.remove(...themeClasses);
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Streak logic
  useEffect(() => {
    if (!stats.lastActiveDate) return;
    
    const lastDate = new Date(stats.lastActiveDate);
    // If last activity was NOT today and NOT yesterday, reset streak
    if (!isToday(lastDate) && !isYesterday(lastDate)) {
      setStats(prev => ({ ...prev, streak: 0 }));
    }
  }, []);

  const recordActivity = () => {
    const today = new Date().toISOString();
    setStats(prev => {
      const lastDate = prev.lastActiveDate ? new Date(prev.lastActiveDate) : null;
      let newStreak = prev.streak;

      if (!lastDate || !isToday(lastDate)) {
        if (lastDate && isYesterday(lastDate)) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      return {
        ...prev,
        streak: newStreak,
        lastActiveDate: today
      };
    });
  };

  const updateStats = (correct: number, total: number, testResult?: TestResult) => {
    const today = new Date().toISOString();
    setStats(prev => {
      const lastDate = prev.lastActiveDate ? new Date(prev.lastActiveDate) : null;
      let newStreak = prev.streak;

      if (!lastDate || !isToday(lastDate)) {
        if (lastDate && isYesterday(lastDate)) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      const earnedXP = (correct * XP_PER_CORRECT) + (total > 0 ? XP_COMPLETION_BONUS : 0);
      const newXP = prev.xp + earnedXP;
      const newLevel = calculateLevel(newXP);

      // Adaptive Performance Tracking
      const newPerformance = { ...prev.performanceBySubject };
      if (testResult?.subjectBreakdown) {
        Object.entries(testResult.subjectBreakdown).forEach(([sub, data]) => {
          if (!newPerformance[sub]) newPerformance[sub] = { correct: 0, total: 0 };
          newPerformance[sub].correct += data.correct;
          newPerformance[sub].total += data.total;
        });
      }

      // Elimination Stats aggregate
      const newElimStats = { ...(prev.eliminationStats || { correct: 0, total: 0 }) };
      if (testResult?.eliminationStats) {
        newElimStats.correct += testResult.eliminationStats.correct;
        newElimStats.total += testResult.eliminationStats.total;
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: today,
        totalQuestionsAttempted: prev.totalQuestionsAttempted + total,
        correctAnswers: prev.correctAnswers + correct,
        performanceBySubject: newPerformance,
        eliminationStats: testResult?.eliminationStats ? newElimStats : prev.eliminationStats,
        testHistory: testResult ? [testResult, ...prev.testHistory] : prev.testHistory
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!user && !isGuest && <AuthOverlay onGuestAccess={handleGuestAccess} />}
      <div className="min-h-screen transition-colors duration-300 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -ml-48 -mb-48" />
        </div>

        <header className="fixed top-0 left-0 right-0 h-16 glass backdrop-blur-md border-b z-50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3 transition-transform hover:rotate-0">
              <Phoenix className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent">
              AARAMBH
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Sync Indicator */}
            <SyncIndicator status={syncStatus} />

            <motion.div 
              key={stats.streak}
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.2, 1],
                filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
              }}
              className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-bold border border-orange-500/30"
            >
              <Flame className="w-4 h-4 fill-current animate-pulse" />
              <span>{stats.streak}</span>
            </motion.div>
            
            <ThemeSwitcher currentTheme={theme} setTheme={setTheme} />

            {user ? (
              <Link to="/profile" className="w-10 h-10 rounded-full border-2 border-indigo-500/50 overflow-hidden hover:scale-105 transition-transform">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" referrerPolicy="no-referrer" />
              </Link>
            ) : (
              <button 
                onClick={() => {
                  setIsGuest(false);
                  localStorage.removeItem('upsc_guest_mode');
                }}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-all"
              >
                <UserIcon size={20} />
              </button>
            )}
          </div>
        </header>

        <main className="pt-20 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl lg:max-w-6xl mx-auto min-h-screen relative z-10">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<DashboardView stats={stats} bookmarks={bookmarks} mistakes={mistakes} />} />
              <Route path="/quiz" element={<QuizView updateStats={updateStats} bookmarks={bookmarks} setBookmarks={setBookmarks} mistakes={mistakes} setMistakes={setMistakes} />} />
              <Route path="/exam" element={<ExamView updateStats={updateStats} bookmarks={bookmarks} setBookmarks={setBookmarks} mistakes={mistakes} setMistakes={setMistakes} />} />
              <Route path="/predictions" element={<SmartPredictionsView />} />
              <Route path="/revision" element={<RevisionView bookmarks={bookmarks} setBookmarks={setBookmarks} mistakes={mistakes} setMistakes={setMistakes} />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/forum" element={<ForumView />} />
              <Route path="/ai-lab" element={<AILabView stats={stats} />} />
              <Route path="/profile" element={<ProfileView stats={stats} user={user} isGuest={isGuest} setIsGuest={setIsGuest} mistakes={mistakes} onSync={triggerSync} />} />
              <Route path="/syllabus" element={<SyllabusView stats={stats} syllabus={syllabus} setSyllabus={setSyllabus} recordActivity={recordActivity} />} />
            </Routes>
          </AnimatePresence>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 h-20 glass backdrop-blur-lg border-t z-50 flex items-center justify-around px-2 pb-safe md:h-24 md:px-12">
          <NavButton to="/" icon={<LayoutDashboard />} label="Dashboard" />
          <NavButton to="/quiz" icon={<BookOpen />} label="Quizzes" />
          <NavButton to="/exam" icon={<Timer />} label="Tests" />
          <NavButton to="/predictions" icon={<Zap />} label="Forecast" />
          <NavButton to="/revision" icon={<HistoryIcon />} label="Revision" />
          <NavButton to="/syllabus" icon={<ShieldCheck />} label="Syllabus" />
          <NavButton to="/map" icon={<Globe />} label="Maps" />
          <NavButton to="/profile" icon={<UserIcon />} label="Stats" />
        </nav>
      </div>
    </BrowserRouter>
  );
}

function SyncIndicator({ status }: { status: 'synced' | 'syncing' | 'offline' }) {
  const configs = {
    synced: { icon: <ShieldCheck className="text-emerald-500" />, label: 'Cloud Synced', color: 'bg-emerald-500/10 text-emerald-500' },
    syncing: { icon: <SyncIcon className="animate-spin text-indigo-400" />, label: 'Backing Up...', color: 'bg-indigo-500/10 text-indigo-400' },
    offline: { icon: <CloudOff className="text-slate-500" />, label: 'Offline Mode', color: 'bg-slate-500/10 text-slate-500' }
  };

  const current = configs[status];

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all",
      current.color
    )}>
      {current.icon}
      <span className="hidden xs:inline-block">{current.label}</span>
    </div>
  );
}

function SyncIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <path d="M22 2l-3 3" />
      <path d="M19 2l3 3" />
    </svg>
  );
}
function NavButton({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="relative flex flex-col items-center justify-center gap-1 py-1 px-3 min-w-[64px] group interactive-tap">
      <motion.div 
        className={cn(
          "p-2.5 rounded-2xl transition-all duration-300 md:p-3",
          isActive ? "bg-indigo-500/10 text-indigo-500 ring-2 ring-indigo-500/20" : "opacity-40 hover:opacity-100 transition-opacity"
        )}
      >
        {(icon as any).type ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) : icon}
      </motion.div>
      <span className={cn(
        "text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors",
        isActive ? "text-indigo-500" : "opacity-40"
      )}>
        {label}
      </span>
      {isActive && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute -bottom-1 w-8 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]"
        />
      )}
    </Link>
  );
}
