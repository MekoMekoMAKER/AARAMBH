import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  X,
  Info,
  Clock,
  Layout,
  Target,
  Bookmark,
  Zap,
  Timer,
  AlertCircle,
  Link2
} from 'lucide-react';
import { BrainCircuit } from '../components/Icons';
import { Question, QuestionCategory, TestResult, BookmarkedQuestion, MistakeRecord } from '../types';
import { generateQuestions } from '../services/gemini';
import { generateCustomQuestions } from '../services/geminiService';
import { libraryService } from '../services/firebaseService';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function QuizView({ 
  updateStats, 
  bookmarks, 
  setBookmarks, 
  mistakes, 
  setMistakes 
}: { 
  updateStats: (correct: number, total: number, testResult?: TestResult) => void;
  bookmarks: BookmarkedQuestion[];
  setBookmarks: (val: BookmarkedQuestion[]) => void;
  mistakes: MistakeRecord[];
  setMistakes: (val: MistakeRecord[]) => void;
}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const categoryFromUrl = searchParams.get('category') as QuestionCategory;
  const category = categoryFromUrl || 'Custom';
  
  // Custom mode states
  const isAILab = category === 'AI Lab';
  const [customTopic, setCustomTopic] = useState(categoryFromUrl && categoryFromUrl !== 'Custom' ? categoryFromUrl : '');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [questionFilter, setQuestionFilter] = useState<'PYQ_ONLY' | 'MIXED' | 'AI_ONLY'>('MIXED');
  const [isSetup, setIsSetup] = useState(!isAILab);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [isMistakePractice, setIsMistakePractice] = useState(false);

  const [results, setResults] = useState({ 
    correct: 0, 
    score: 0, 
    total: 0,
    timeTaken: 0, 
    subjectBreakdown: {} as Record<string, { correct: number; total: number }> 
  });
  
  // Timer states
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isEliminationMode, setIsEliminationMode] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [eliminationStats, setEliminationStats] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(60);
  const [autoNextTime, setAutoNextTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoNextRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAILab && location.state?.questions) {
      setQuestions(location.state.questions);
      setIsSetup(false);
    }
  }, [category, location.state]);

  useEffect(() => {
    if (!loading && questions.length > 0 && !isAnswered && !quizComplete) {
      setTimeLeft(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIndex, isAnswered, loading, questions, quizComplete]);

  const startQuizAction = async () => {
    if (isMistakePractice) {
      if (mistakes.length === 0) {
        alert("No mistakes tracked yet!");
        return;
      }
      // Reconstruct questions from mistake records (simplification for this prototype)
      setQuestions(mistakes.map((m, i) => ({
        id: m.questionId,
        question: m.question,
        options: ["Option A", "Option B", "Option C", "Option D"], // Placeholder if not stored
        correctAnswer: 0, // Placeholder
        explanation: "Revised error",
        difficulty: 'Medium',
        category: m.subject as any,
      } as any)));
      setIsSetup(false);
      return;
    }

    if (!customTopic.trim() && (category === 'Custom' || !categoryFromUrl)) return;
    setLoading(true);
    try {
      let data: Question[] = [];
      if (category === 'Custom' || !categoryFromUrl) {
        data = await generateCustomQuestions(customTopic, numQuestions, difficulty, questionFilter);
      } else {
        data = await generateQuestions(category, numQuestions);
      }
      setQuestions(data.map((q: any, i: number) => ({ 
        ...q, 
        id: `${category}-${Math.random().toString(36).substr(2, 9)}`, 
        category: q.category || category 
      })));
      setIsSetup(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoNextTime !== null && autoNextTime > 0) {
      if (autoNextRef.current) clearInterval(autoNextRef.current);
      autoNextRef.current = setInterval(() => {
        setAutoNextTime(prev => {
          if (prev !== null && prev <= 1) {
            handleNext();
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    } else if (autoNextTime === null) {
      if (autoNextRef.current) clearInterval(autoNextRef.current);
    }
    return () => { if (autoNextRef.current) clearInterval(autoNextRef.current); };
  }, [autoNextTime]);

  const handleTimeout = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    
    const currentSubject = questions[currentIndex].category || category || 'Custom';
    
    // Record as mistake since it was unattempted (incorrect)
    const newMistakes = [...mistakes];
    const q = questions[currentIndex];
    const existingIdx = newMistakes.findIndex(m => m.questionId === q.id);
    
    if (existingIdx > -1) {
      newMistakes[existingIdx].incorrectCount += 1;
      newMistakes[existingIdx].lastAttempt = new Date().toISOString();
    } else {
      newMistakes.push({
        questionId: q.id || `mistake-${Date.now()}`,
        question: q.question,
        topic: q.category || category,
        subject: q.category || category,
        incorrectCount: 1,
        lastAttempt: new Date().toISOString()
      });
    }
    setMistakes(newMistakes);

    setResults(prev => {
      const newBreakdown = { ...prev.subjectBreakdown };
      if (!newBreakdown[currentSubject]) newBreakdown[currentSubject] = { correct: 0, total: 0 };
      newBreakdown[currentSubject].total += 1;

      return {
        ...prev,
        subjectBreakdown: newBreakdown,
        total: prev.total + 1
      };
    });

    setAutoNextTime(10);
  };

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(idx);
    setIsAnswered(true);
    
    const isCorrect = idx === questions[currentIndex].correctAnswer;
    const currentSubject = questions[currentIndex].category || category || 'Custom';

    if (!isCorrect) {
      const newMistakes = [...mistakes];
      const q = questions[currentIndex];
      const existingIdx = newMistakes.findIndex(m => m.questionId === q.id);
      
      if (existingIdx > -1) {
        newMistakes[existingIdx].incorrectCount += 1;
        newMistakes[existingIdx].lastAttempt = new Date().toISOString();
      } else {
        newMistakes.push({
          questionId: q.id || `mistake-${Date.now()}`,
          question: q.question,
          topic: q.category || category,
          subject: q.category || category,
          incorrectCount: 1,
          lastAttempt: new Date().toISOString()
        });
      }
      setMistakes(newMistakes);
    }

    setResults(prev => {
      const newBreakdown = { ...prev.subjectBreakdown };
      if (!newBreakdown[currentSubject]) newBreakdown[currentSubject] = { correct: 0, total: 0 };
      newBreakdown[currentSubject].total += 1;
      if (isCorrect) newBreakdown[currentSubject].correct += 1;

      return {
        ...prev,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        score: isCorrect ? prev.score + 2 : prev.score,
        subjectBreakdown: newBreakdown,
        total: (prev as any).total + 1
      };
    });
  };

  const handleNext = () => {
    // If skipping an unattempted question, mark as wrong but move IMMEDIATELY
    if (!isAnswered) {
      // First, record as wrong
      const currentSubject = questions[currentIndex].category || category || 'Custom';
      const q = questions[currentIndex];
      const newMistakes = [...mistakes];
      const existingIdx = newMistakes.findIndex(m => m.questionId === q.id);
      
      if (existingIdx > -1) {
        newMistakes[existingIdx].incorrectCount += 1;
        newMistakes[existingIdx].lastAttempt = new Date().toISOString();
      } else {
        newMistakes.push({
          questionId: q.id || `mistake-${Date.now()}`,
          question: q.question,
          topic: q.category || category,
          subject: q.category || category,
          incorrectCount: 1,
          lastAttempt: new Date().toISOString()
        });
      }
      setMistakes(newMistakes);

      setResults(prev => {
        const newBreakdown = { ...prev.subjectBreakdown };
        if (!newBreakdown[currentSubject]) newBreakdown[currentSubject] = { correct: 0, total: 0 };
        newBreakdown[currentSubject].total += 1;
        return {
          ...prev,
          subjectBreakdown: newBreakdown,
          total: prev.total + 1
        };
      });
    }

    setAutoNextTime(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(60);
      setEliminatedOptions([]);
    } else {
      setQuizComplete(true);
      const testResult: TestResult = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        score: results.score,
        totalQuestions: questions.length,
        correct: results.correct,
        incorrect: questions.length - results.correct,
        skipped: 0,
        timeTaken: results.timeTaken,
        subjectBreakdown: results.subjectBreakdown,
        eliminationStats: eliminationStats.total > 0 ? eliminationStats : undefined
      };
      updateStats(results.correct, questions.length, testResult);
    }
  };

  const handleEliminate = (idx: number, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isAnswered) return;
    
    setEliminatedOptions(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      }
      
      const isActuallyIncorrect = idx !== questions[currentIndex].correctAnswer;
      setEliminationStats(s => ({
        correct: s.correct + (isActuallyIncorrect ? 1 : 0),
        total: s.total + 1
      }));
      
      return [...prev, idx];
    });
  };

  const toggleBookmark = () => {
    const q = questions[currentIndex];
    const isBookmarked = bookmarks.some(b => b.questionId === q.id);
    
    if (isBookmarked) {
      const newBookmarks = bookmarks.filter(b => b.questionId !== q.id);
      setBookmarks(newBookmarks);
    } else {
      const newBookmark: BookmarkedQuestion = {
        questionId: q.id || `q-${Date.now()}`,
        question: q.question,
        topic: q.category || category,
        subject: q.category || category,
        savedAt: new Date().toISOString()
      };
      setBookmarks([...bookmarks, newBookmark]);
    }
  };

  if (isSetup) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 border-white/10 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
            <Target size={32} />
          </div>
          <h2 className="text-2xl font-black">{category === 'Custom' ? 'Custom Challenge' : `${category} Quiz`}</h2>
          <p className="opacity-60 text-sm">Configure your session for precision practice</p>
        </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsMistakePractice(false)}
              className={cn(
                "p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all",
                !isMistakePractice ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white/5 border-white/10 text-slate-500"
              )}
            >
              <Target size={20} />
              Regular Quiz
            </button>
            <button 
              onClick={() => setIsMistakePractice(true)}
              className={cn(
                "p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all",
                isMistakePractice ? "bg-rose-500 border-rose-400 text-white" : "bg-white/5 border-white/10 text-slate-500"
              )}
            >
              <AlertCircle size={20} />
              Mistake Practice
            </button>
          </div>

          {!isMistakePractice && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  {category === 'Custom' ? 'Target Topic' : 'Focus Topic / Sub-topic (Optional)'}
                </label>
                <input 
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  placeholder={category === 'Custom' ? "e.g., Indus Valley Trade, Monetary Policy" : `Focus within ${category}...`}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-theme-primary font-bold outline-none focus:border-indigo-500/50 transition-all focus:bg-white/10 placeholder:text-slate-600"
                />
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Complexity Volume ({numQuestions} MCQs)</label>
                 <input 
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={numQuestions}
                  onChange={e => setNumQuestions(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                 />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Question Source (Prioritize PYQs)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PYQ_ONLY', label: 'Only PYQs', icon: <Target size={12} /> },
                    { id: 'MIXED', label: 'Mixed (UPSC)', icon: <Layout size={12} /> },
                    { id: 'AI_ONLY', label: 'Only AI mock', icon: <Zap size={12} /> }
                  ].map(f => (
                    <button 
                      key={f.id}
                      onClick={() => setQuestionFilter(f.id as any)}
                      className={cn(
                        "text-[9px] font-black uppercase py-3 rounded-xl border transition-all flex flex-col items-center gap-1",
                        questionFilter === f.id ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                      )}
                    >
                      {f.icon}
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                   {(['Easy', 'Medium', 'Hard', 'Mixed'] as const).map(d => (
                     <button 
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "text-[10px] font-black uppercase px-2 py-3 rounded-2xl border transition-all interactive-tap",
                        difficulty === d ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 border-white/10 text-slate-500"
                      )}
                     >
                       {d}
                     </button>
                   ))}
              </div>
            </div>
          )}

          <button 
            onClick={startQuizAction}
            disabled={(!isMistakePractice && !customTopic.trim() && category === 'Custom') || loading}
            className={cn(
              "w-full font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50",
              isMistakePractice ? "bg-rose-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-500"
            )}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
            {category === 'Custom' ? 'Generate Challenge' : `Start ${category} Quiz`}
          </button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs text-center px-6 leading-relaxed">
          Architecting UPSC Precision Questions...<br/>
          <span className="text-[10px] opacity-50">Synthesizing Historical & Constitutional logic</span>
        </p>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-8 border-white/10 text-center shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <CheckCircle2 size={120} />
        </div>
        <div className="relative z-10">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tight">Challenge Complete!</h2>
          <p className="opacity-50 font-medium mb-8">Spatial Intelligence & Logic synthesis success.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</p>
               <p className="text-2xl font-black text-indigo-400">{results.correct} / {questions.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Efficiency</p>
               <p className="text-2xl font-black text-emerald-400">{Math.round((results.correct / (questions.length || 1)) * 100)}%</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95 mb-4"
          >
            Return to Dashboard
          </button>

          <div className="text-left space-y-4">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Detailed Logic Review</h3>
             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold line-clamp-2">{q.question}</p>
                        {q.source && (
                          <p className="text-[8px] font-black uppercase text-indigo-400/60 mt-1">Source: {q.source}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[10px] leading-relaxed opacity-80">
                      <ReactMarkdown>{q.explanation}</ReactMarkdown>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 bg-slate-950 flex flex-col z-50 transition-colors duration-500",
        isFocusMode ? "bg-slate-950" : "bg-slate-950/95"
      )}
    >
      {/* Sticky Top Bar */}
      <header className="shrink-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-300"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1 line-clamp-1">
              {isAILab ? 'AI Lab Diagnostic' : (category === 'Custom' ? customTopic : category)}
            </span>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              Question {currentIndex + 1} of {questions.length}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEliminationMode(!isEliminationMode)}
            className={cn(
              "p-2 rounded-xl transition-all border flex items-center gap-2",
              isEliminationMode ? "bg-rose-500 border-rose-400 text-white" : "bg-white/5 border-white/10 text-slate-400"
            )}
            title="Elimination Mode"
          >
            <XCircle size={18} />
            <span className="hidden md:inline text-[9px] font-black uppercase">Elimination</span>
          </button>

          <button 
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={cn(
              "p-2 rounded-xl transition-all border",
              isFocusMode ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white/5 border-white/10 text-slate-400"
            )}
            title="Focus Mode"
          >
            <Target size={18} />
          </button>
          
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border font-black text-sm transition-all duration-500",
            timeLeft >= 30 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            timeLeft >= 15 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
            "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
          )}>
            <Timer size={16} />
            <span className="font-mono">{timeLeft}s</span>
          </div>
        </div>
      </header>

      {/* Thick Progress Bar */}
      <div className="shrink-0 h-1.5 w-full bg-white/5">
        <motion.div 
          className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / (questions.length || 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
      </div>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-transparent pb-32">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          
          <AnimatePresence mode="wait">
            <motion.section 
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Question Card */}
              <div className="glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                    currentQuestion?.difficulty === 'Hard' ? "bg-rose-500/20 text-rose-400" : "bg-indigo-500/20 text-indigo-400"
                  )}>
                    {currentQuestion?.difficulty || 'Standard'}
                  </span>
                  
                  {currentQuestion?.source && (
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                      currentQuestion.source.includes('PYQ') 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black" 
                        : "bg-white/5 text-slate-500 border-white/10"
                    )}>
                      {currentQuestion.source.includes('PYQ') ? `🔥 ${currentQuestion.source}` : `🤖 ${currentQuestion.source}`}
                    </span>
                  )}

                  {currentQuestion?.isRepeated && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                      <Zap size={10} /> Repeated Concept
                    </span>
                  )}

                  {currentQuestion?.frequency && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Trend: {currentQuestion.frequency}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <p className="text-lg md:text-xl font-bold leading-relaxed text-white tracking-tight">
                    {currentQuestion?.question}
                  </p>

                  {/* UPSC Statement Style Formatting */}
                  {currentQuestion?.type === 'StatementBased' && currentQuestion.statements && (
                    <div className="space-y-3 mt-6">
                      {currentQuestion.statements.map((stmt, i) => (
                        <div key={i} className="flex gap-4 text-sm md:text-base text-slate-300 bg-white/3 p-4 rounded-2xl border border-white/5 leading-relaxed hover:bg-white/5 transition-colors">
                          <span className="font-black text-indigo-400 shrink-0">{i + 1}.</span>
                          <span className="font-medium">{stmt}</span>
                        </div>
                      ))}
                      <p className="text-[10px] font-black text-slate-500 uppercase mt-4 tracking-tighter text-center">Which of the statements given above is/are correct?</p>
                    </div>
                  )}

                  {/* Assertion Reason Style */}
                  {currentQuestion?.type === 'AssertionReason' && (
                    <div className="space-y-4 mt-6">
                      <div className="p-5 bg-white/3 rounded-2xl border border-white/5 relative">
                        <span className="absolute -top-2 left-4 bg-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Assertion</span>
                        <p className="text-sm md:text-base font-semibold text-slate-200">{currentQuestion.assertion}</p>
                      </div>
                      <div className="p-5 bg-white/3 rounded-2xl border border-white/5 relative">
                        <span className="absolute -top-2 left-4 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Reason</span>
                        <p className="text-sm md:text-base font-semibold text-slate-200">{currentQuestion.reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Options Section */}
              <div className="space-y-3">
                {currentQuestion?.options?.map((option, idx) => {
                  const isCorrect = idx === currentQuestion.correctAnswer;
                  const isSelected = idx === selectedOption;
                  const isEliminated = eliminatedOptions.includes(idx);
                  
                  return (
                    <motion.div 
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onContextMenu={(e) => handleEliminate(idx, e)}
                      onClick={() => {
                        if (isEliminationMode) {
                          handleEliminate(idx);
                        } else if (!isEliminated) {
                          handleOptionSelect(idx);
                        }
                      }}
                      className={cn(
                        "w-full text-left p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between gap-4 group min-h-[44px] relative cursor-pointer",
                        !isAnswered && !isEliminated && "border-white/5 bg-white/3 hover:bg-white/8 hover:border-indigo-500/30",
                        !isAnswered && isEliminated && "border-white/5 bg-white/1 opacity-40 scale-[0.98]",
                        isAnswered && isCorrect && "border-emerald-500 bg-emerald-500/5 text-emerald-400",
                        isAnswered && isSelected && !isCorrect && "border-rose-500 bg-rose-500/5 text-rose-400",
                        isAnswered && !isCorrect && !isSelected && "opacity-30 border-white/5",
                        isAnswered && "cursor-default"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all",
                          !isAnswered && !isEliminated && "bg-white/5 border border-white/10 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-400",
                          !isAnswered && isEliminated && "bg-slate-800 text-slate-600 border-none",
                          isAnswered && isCorrect && "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]",
                          isAnswered && isSelected && !isCorrect && "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                        )}>
                          {isEliminated ? <X size={14} /> : String.fromCharCode(65 + idx)}
                        </div>
                        <span className={cn(
                          "font-bold text-sm md:text-base leading-snug text-slate-100",
                          isEliminated && "line-through text-slate-500"
                        )}>{option}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isAnswered && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEliminate(idx); }}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              isEliminated ? "bg-rose-500 text-white" : "bg-white/5 text-slate-600 hover:bg-rose-500/20 hover:text-rose-400"
                            )}
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        {isAnswered && isCorrect && <CheckCircle2 size={24} className="shrink-0 animate-in zoom-in" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle size={24} className="shrink-0 animate-in zoom-in" />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Explanation Panel */}
              <AnimatePresence>
                {isAnswered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="glass bg-indigo-500/10 border-indigo-500/30 p-8 rounded-[2.5rem] shadow-2xl">
                      <div className="flex items-center gap-3 mb-4 text-indigo-400">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                          <BrainCircuit size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.25em]">Strategic Context</span>
                          <p className="text-xs text-slate-400 font-bold">UPSC Core Concept Analysis</p>
                        </div>
                      </div>

                      {eliminatedOptions.length > 0 && (
                        <div className="mb-4 p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                          <Target size={14} className="text-emerald-400" />
                          <span className="text-[10px] font-bold text-slate-300">
                            Elimination Strategy: You correctly filtered out {
                              eliminatedOptions.filter(i => i !== currentQuestion.correctAnswer).length
                            } distraction{eliminatedOptions.length !== 1 ? 's' : ''}.
                          </span>
                        </div>
                      )}
                      <div className="text-sm md:text-base text-slate-200 leading-relaxed font-medium prose prose-invert max-w-none">
                        <ReactMarkdown>{currentQuestion?.explanation}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </AnimatePresence>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="shrink-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 p-4 flex items-center justify-between gap-4 z-30">
        <button 
          onClick={toggleBookmark}
          className={cn(
            "p-4 rounded-2xl border transition-all shrink-0",
            bookmarks.some(b => b.questionId === currentQuestion?.id)
              ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20" 
              : "bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400"
          )}
        >
          <Bookmark size={20} fill={bookmarks.some(b => b.questionId === currentQuestion?.id) ? "currentColor" : "none"} />
        </button>

        <button 
          onClick={handleNext}
          className={cn(
            "flex-1 font-black py-4 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden",
            isAnswered ? "bg-white text-slate-950" : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
          )}
        >
          {autoNextTime !== null && (
            <div className="absolute inset-0 bg-indigo-500/20 origin-left" style={{ width: `${(autoNextTime / 10) * 100}%` }} />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {currentIndex < questions.length - 1 
              ? (autoNextTime !== null ? `Next Concept in ${autoNextTime}s` : (isAnswered ? 'Proceed to Next Question' : 'Skip to Next Question')) 
              : (isAnswered ? 'Finalize Diagnostic' : 'Skip & Finalize')}
          </span>
        </button>
      </footer>
    </motion.div>
  );
}


