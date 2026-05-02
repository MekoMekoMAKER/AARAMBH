import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer as TimerIcon, 
  ChevronLeft, 
  ShieldAlert,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  Bookmark
} from 'lucide-react';
import { Question, TestResult, BookmarkedQuestion, MistakeRecord } from '../types';
import { generateQuestions } from '../services/gemini';
import { cn, formatTime } from '../lib/utils';

export default function ExamView({ 
  updateStats,
  bookmarks,
  setBookmarks,
  mistakes,
  setMistakes
}: { 
  updateStats: (correct: number, total: number, result: TestResult) => void;
  bookmarks: BookmarkedQuestion[];
  setBookmarks: (val: BookmarkedQuestion[]) => void;
  mistakes: MistakeRecord[];
  setMistakes: (val: MistakeRecord[]) => void;
}) {
  const navigate = useNavigate();
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noBacktracking, setNoBacktracking] = useState(false);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startExam = async () => {
    setLoading(true);
    try {
      // In a real app we'd fetch 100, but for demo let's fetch 10 balanced questions
      const categories = ['Polity', 'History', 'Geography', 'Economy', 'Science'];
      const allQs: Question[] = [];
      for (const cat of categories) {
        const qs = await generateQuestions(cat as any, 2);
        allQs.push(...qs);
      }
      setQuestions(allQs.sort(() => Math.random() - 0.5));
      setExamStarted(true);
      startTimer();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = (optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optionIdx }));
  };

  const submitExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    
    const newMistakes = [...mistakes];
    
    questions.forEach((q, idx) => {
      if (answers[idx] === undefined) skipped++;
      else if (answers[idx] === q.correctAnswer) correct++;
      else {
        incorrect++;
        // Track mistake
        const existingIdx = newMistakes.findIndex(m => m.questionId === q.id);
        if (existingIdx > -1) {
          newMistakes[existingIdx].incorrectCount += 1;
          newMistakes[existingIdx].lastAttempt = new Date().toISOString();
        } else {
          newMistakes.push({
            questionId: q.id || `mistake-${Date.now()}-${idx}`,
            question: q.question,
            topic: q.category || 'General',
            subject: q.category || 'General',
            incorrectCount: 1,
            lastAttempt: new Date().toISOString()
          });
        }
      }
    });

    setMistakes(newMistakes);

    const score = (correct * 2) - (incorrect * 0.66);
    
    const result: TestResult = {
      id: `test-${Date.now()}`,
      date: new Date().toISOString(),
      score: score,
      totalQuestions: questions.length,
      correct,
      incorrect,
      skipped,
      timeTaken: (120 * 60) - timeLeft,
      subjectBreakdown: {} // Simplified for now
    };

    updateStats(correct, questions.length, result);
    navigate('/');
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const toggleBookmark = () => {
    const q = questions[currentIndex];
    const isBookmarked = bookmarks.some(b => b.questionId === q.id);
    if (isBookmarked) {
      setBookmarks(bookmarks.filter(b => b.questionId !== q.id));
    } else {
      const newBookmark: BookmarkedQuestion = {
        questionId: q.id || `q-${Date.now()}`,
        question: q.question,
        topic: q.category || 'General',
        subject: q.category || 'General',
        savedAt: new Date().toISOString()
      };
      setBookmarks([...bookmarks, newBookmark]);
    }
  };

  if (!examStarted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="glass rounded-3xl p-8 border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <TimerIcon size={120} />
          </div>
          <div className="w-16 h-16 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <TimerIcon size={32} />
          </div>
          <h2 className="text-2xl font-black mb-4 tracking-tight">Simulation Prelims #1</h2>
          <div className="space-y-4 mb-8">
            <InstructionItem icon={<ShieldAlert className="text-rose-500" />} text="10 Balance Questions (Demo Edition)" />
            <InstructionItem icon={<TimerIcon className="text-blue-400" />} text="120 Minutes - Standard IAS Timer" />
            <InstructionItem icon={<AlertCircle className="text-orange-400" />} text="+2.0 Marks • -0.66 Negativity" />
          </div>

          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-8 flex items-center justify-between backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="font-bold text-sm">No Backtracking Mode</span>
              <span className="text-[10px] opacity-50 uppercase font-black tracking-widest leading-none mt-1">Foundational Discipline</span>
            </div>
            <button 
              onClick={() => setNoBacktracking(!noBacktracking)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative outline-none",
                noBacktracking ? "bg-indigo-500" : "bg-white/10"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-lg",
                noBacktracking ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <button 
            disabled={loading}
            onClick={startExam}
            className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Initiate Official Mock"}
          </button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between glass p-4 rounded-2xl border-white/10 sticky top-16 z-40 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <TimerIcon className={cn("w-5 h-5", timeLeft < 300 ? "text-rose-500 animate-pulse" : "text-indigo-400")} />
          <span className={cn("font-mono font-black text-lg", timeLeft < 300 && "text-rose-500")}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <button 
          onClick={() => { if(confirm('Final submission?')) submitExam(); }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
        >
          Submit Mock
        </button>
      </div>

      <div className="bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          <span>{currentQuestion.category}</span>
          <span>Question {currentIndex + 1} of {questions.length}</span>
        </div>

        <section className="glass rounded-3xl p-6 border-white/10 shadow-xl relative">
          <button 
            onClick={toggleBookmark}
            className={cn(
              "absolute top-6 right-6 p-2 border rounded-xl transition-all",
              bookmarks.some(b => b.questionId === currentQuestion.id)
                ? "bg-indigo-500 border-indigo-400 text-white" 
                : "bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400"
            )}
          >
            <Bookmark size={18} fill={bookmarks.some(b => b.questionId === currentQuestion.id) ? "currentColor" : "none"} />
          </button>
          <p className="text-lg font-black leading-relaxed tracking-tight pr-12">{currentQuestion.question}</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((opt, idx) => (
            <button
               key={idx}
               onClick={() => handleAnswer(idx)}
               className={cn(
                 "text-left p-6 rounded-3xl border-2 transition-all font-bold group interactive-tap",
                 answers[currentIndex] === idx 
                   ? "border-indigo-500 bg-indigo-500/10" 
                   : "border-white/5 bg-white/3 hover:bg-white/8 hover:border-white/20 opacity-80 interactive-hover"
               )}
            >
              <div className="flex gap-4 items-center">
                <span className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                  answers[currentIndex] === idx ? "bg-indigo-500 border-indigo-400 shadow-lg text-white" : "bg-white/5 border-white/10 group-hover:border-white/20"
                )}>{String.fromCharCode(65 + idx)}</span>
                <span className="text-base leading-snug">{opt}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
             disabled={currentIndex === 0 || noBacktracking}
             onClick={() => setCurrentIndex(prev => prev - 1)}
             className="flex-1 glass bg-white/5 border-white/10 p-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-20 text-slate-400 interactive-tap"
          >
            <ChevronLeft size={18} /> Back
          </button>
          <button
             onClick={() => {
               if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
               else submitExam();
             }}
             className="flex-1 bg-white text-slate-950 p-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl interactive-tap"
          >
            {currentIndex === questions.length - 1 ? 'Analyze & Score' : 'Next Question'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function InstructionItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
      {icon}
      <span className="text-xs font-bold opacity-80">{text}</span>
    </div>
  );
}

