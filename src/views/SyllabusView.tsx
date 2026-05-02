import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Flame, 
  Zap, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  History, 
  Target, 
  TrendingUp, 
  Sword,
  Search,
  Check,
  BookOpen
} from 'lucide-react';
import { SyllabusState, SyllabusSubject, StudyLog, UserStats } from '../types';
import { UPSC_SYLLABUS } from '../data/syllabus';
import FireProgressBar from '../components/FireProgressBar';
import { cn } from '../lib/utils';
import { isToday, isYesterday, differenceInDays } from 'date-fns';

export default function SyllabusView({ 
  stats,
  syllabus, 
  setSyllabus,
  recordActivity
}: { 
  stats: UserStats;
  syllabus: SyllabusState; 
  setSyllabus: React.Dispatch<React.SetStateAction<SyllabusState>>; 
  recordActivity: () => void;
}) {
  const [studyInput, setStudyInput] = useState('');
  const [activeSubject, setActiveSubject] = useState<string>('Polity');
  const [isMatching, setIsMatching] = useState(false);

  // Calculate Overall Progress
  const totalTopics = syllabus.subjects.reduce((sum, s) => sum + s.topics.length, 0);
  const completedTopics = syllabus.subjects.reduce((sum, s) => sum + s.topics.filter(t => t.isCompleted).length, 0);
  const overallCompletion = Math.round((completedTopics / totalTopics) * 100);

  // Rank System
  const getRank = (percent: number) => {
    if (percent < 10) return { title: 'Beginner', level: 'E' };
    if (percent < 30) return { title: 'Aspirant', level: 'D' };
    if (percent < 50) return { title: 'Elite', level: 'C' };
    if (percent < 75) return { title: 'Shadow Walker', level: 'B' };
    if (percent < 90) return { title: 'Monarch', level: 'A' };
    return { title: 'Topper of Shadows', level: 'S' };
  };

  const rank = getRank(overallCompletion);

  const logStudy = async () => {
    if (!studyInput.trim()) return;

    setIsMatching(true);
    // Mimic Smart Matching
    setTimeout(() => {
      const newLog: StudyLog = {
        date: new Date().toISOString(),
        topic: studyInput,
        subject: activeSubject
      };

      const lowerInput = studyInput.toLowerCase();
      
      const updatedSubjects = syllabus.subjects.map(subject => {
        if (subject.name === activeSubject) {
          return {
            ...subject,
            topics: subject.topics.map(topic => {
              // Smart check: keyword matching
              const topicKeywords = topic.topic.toLowerCase().split(/\s+/).filter(k => k.length > 3);
              const isMatch = topicKeywords.some(keyword => lowerInput.includes(keyword));
              
              if (isMatch) return { ...topic, isCompleted: true };
              return topic;
            })
          };
        }
        return subject;
      });

      // Centralized Activity Record
      recordActivity();

      setSyllabus(prev => ({
        ...prev,
        subjects: updatedSubjects,
        logs: [newLog, ...prev.logs].slice(0, 50),
        lastLoggedDate: new Date().toISOString()
      }));

      setStudyInput('');
      setIsMatching(false);
    }, 800);
  };

  const toggleTopic = (subjectName: string, topicId: string) => {
    const updatedSubjects = syllabus.subjects.map(s => {
      if (s.name === subjectName) {
        return {
          ...s,
          topics: s.topics.map(t => {
            if (t.id === topicId) return { ...t, isCompleted: !t.isCompleted };
            return t;
          })
        };
      }
      return s;
    });
    recordActivity();
    setSyllabus(prev => ({ 
      ...prev, 
      subjects: updatedSubjects,
      lastLoggedDate: new Date().toISOString()
    }));
  };

  const currentSubjectData = syllabus.subjects.find(s => s.name === activeSubject);
  const subjectCompletion = currentSubjectData 
    ? Math.round((currentSubjectData.topics.filter(t => t.isCompleted).length / currentSubjectData.topics.length) * 100)
    : 0;

  // Daily Target Suggestion
  const remainingInSubject = currentSubjectData?.topics.filter(t => !t.isCompleted).length || 0;
  const targetRecommendation = Math.min(2, remainingInSubject);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 pb-12"
    >
      {/* Monarch Header */}
      <section className="glass rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border-orange-500/20">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <ShieldCheck size={180} className="text-orange-500" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 shadow-xl flex items-center justify-center text-3xl font-black text-white border border-white/20">
                {rank.level}
              </div>
              <div>
                <div className="flex items-center gap-2 text-orange-500 mb-1">
                  <Flame size={14} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Level Up</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-white">Rank: {rank.title}</h2>
              </div>
            </div>

            <FireProgressBar progress={overallCompletion} label="Syllabus Integration Completion" />
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 shrink-0">
             <div className="text-center px-4 border-r border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Streak</p>
                <div className="flex items-center gap-1 justify-center">
                  <Flame size={18} className="text-orange-500" />
                  <span className="text-xl font-black text-white">{stats.streak}</span>
                </div>
             </div>
             <div className="text-center px-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Daily Target</p>
                <p className="text-xl font-black text-orange-500">+{targetRecommendation}</p>
             </div>
          </div>
        </div>
      </section>

      {/* Target Recommendation Alert */}
      {targetRecommendation > 0 && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Sword size={20} />
          </div>
          <p className="text-sm font-medium">
            <span className="font-black text-orange-500">Shadow Monarch Suggestion:</span> Complete {targetRecommendation} more topics in {activeSubject} to stay on track for the Prelims Gate.
          </p>
        </motion.div>
      )}

      {/* Daily Input Section */}
      <section className="glass rounded-[2rem] p-6 border-white/10">
        <h3 className="font-black text-lg mb-4 flex items-center gap-2">
          <History className="text-indigo-400" /> Daily Study Log
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input 
              value={studyInput}
              onChange={e => setStudyInput(e.target.value)}
              placeholder="What topics did you conquer today?"
              onKeyDown={e => e.key === 'Enter' && logStudy()}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-theme-primary font-bold outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-600"
            />
            {isMatching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Zap size={18} className="text-orange-500 animate-spin" />
              </div>
            )}
          </div>
          <button 
            onClick={logStudy}
            disabled={!studyInput.trim() || isMatching}
            className="bg-orange-600 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-orange-900/20 interactive-tap disabled:opacity-50"
          >
            LOG PROGRESS
          </button>
        </div>
      </section>

      {/* Subject Tabs */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {syllabus.subjects.map(s => (
            <button
              key={s.name}
              onClick={() => setActiveSubject(s.name)}
              className={cn(
                "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all interactive-tap",
                activeSubject === s.name 
                  ? "bg-white/10 text-white border border-white/20 shadow-xl" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="glass rounded-[2.5rem] p-8 border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black tracking-tight">{activeSubject} Syllabus</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Expansion Status</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-white/5 flex items-center justify-center relative">
               <span className="text-sm font-black text-orange-500">{subjectCompletion}%</span>
               {/* Progress Circle could go here */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {currentSubjectData?.topics.map(topic => (
               <button
                 key={topic.id}
                 onClick={() => toggleTopic(activeSubject, topic.id)}
                 className={cn(
                   "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left interactive-hover group",
                   topic.isCompleted 
                    ? "bg-emerald-500/10 border-emerald-500/30" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                 )}
               >
                 <div className={cn(
                   "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                   topic.isCompleted 
                     ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                     : "bg-white/10 text-slate-500"
                 )}>
                   {topic.isCompleted && <Check size={14} strokeWidth={4} />}
                 </div>
                 <span className={cn(
                   "text-sm font-bold transition-all",
                   topic.isCompleted ? "text-emerald-400" : "text-slate-300 group-hover:text-white"
                 )}>
                   {topic.topic}
                 </span>
               </button>
             ))}
          </div>
        </div>
      </section>

      {/* Recent Activity Log */}
      <section className="glass rounded-[2rem] p-6 border-white/10">
        <h3 className="font-black text-lg mb-6 flex items-center gap-2">
          <TrendingUp className="text-emerald-400" /> Recent Integration Activity
        </h3>
        <div className="space-y-3">
          {syllabus.logs.length === 0 ? (
            <p className="text-center py-8 text-xs font-bold text-slate-600 uppercase tracking-widest italic">The system is waiting for your expansion.</p>
          ) : (
            syllabus.logs.map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/5">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{log.topic}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.subject} • {new Date(log.date).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-emerald-500 uppercase">Tracked</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}
