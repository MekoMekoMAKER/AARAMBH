import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, 
  Book, 
  Cloud, 
  CloudMoon, 
  Leaf, 
  Eye, 
  Circle,
  Palette,
  ChevronDown
} from 'lucide-react';
import { AppTheme } from '../types';
import { cn } from '../lib/utils';

const THEMES: { id: AppTheme; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'dark', label: 'Dark', icon: <Moon size={14} />, color: '#0f172a' },
  { id: 'sepia', label: 'Sepia', icon: <Book size={14} />, color: '#f4ecd8' },
  { id: 'dim-gray', label: 'Dim Gray', icon: <Cloud size={14} />, color: '#1f2937' },
  { id: 'night-blue', label: 'Night Blue', icon: <CloudMoon size={14} />, color: '#0b1f3a' },
  { id: 'forest', label: 'Forest', icon: <Leaf size={14} />, color: '#0f2e2e' },
  { id: 'deep-purple', label: 'Deep Purple', icon: <Eye size={14} />, color: '#1e1b4b' },
  { id: 'white-classic', label: 'Classic', icon: <Circle size={14} />, color: '#ffffff' },
];

export default function ThemeSwitcher({ currentTheme, setTheme }: { currentTheme: AppTheme; setTheme: (t: AppTheme) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const activeTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl border border-white/10 hover:bg-white/10 transition-all"
      >
        <span className="text-indigo-400">{activeTheme.icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 hidden sm:block">
          {activeTheme.label}
        </span>
        <ChevronDown size={12} className={cn("text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "absolute right-0 mt-3 w-56 rounded-[1.5rem] border shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 overflow-hidden backdrop-blur-xl",
                currentTheme === 'white-classic' || currentTheme === 'sepia'
                  ? "bg-white/95 border-slate-200" 
                  : "bg-slate-900/98 border-white/10"
              )}
            >
              <div className="p-3 space-y-1.5">
                <div className="px-3 py-2 flex items-center justify-between border-b border-white/5 mb-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Eye Comfort Modes</p>
                  <Palette size={12} className="text-slate-500" />
                </div>
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 px-3 py-3.5 rounded-2xl transition-all text-left group interactive-tap",
                      currentTheme === theme.id 
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                        : currentTheme === 'white-classic' || currentTheme === 'sepia'
                          ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    )}
                  >
                    <div 
                      className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center shrink-0 shadow-inner" 
                      style={{ backgroundColor: theme.color }}
                    >
                      {currentTheme === theme.id && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider leading-none",
                        currentTheme === theme.id ? "text-white" : ""
                      )}>
                        {theme.label}
                      </span>
                      {theme.id === 'dark' && (
                        <span className={cn(
                          "text-[8px] font-bold uppercase mt-1",
                          currentTheme === theme.id ? "text-indigo-100" : "text-slate-500"
                        )}>
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-all group-hover:scale-150",
                      currentTheme === theme.id ? "bg-white" : "bg-transparent"
                    )} />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
