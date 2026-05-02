import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface FireProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  className?: string;
}

export default function FireProgressBar({ progress, label, className }: FireProgressBarProps) {
  // Fire intensity based on progress
  const fireCount = Math.floor(progress / 10) + 1;
  const isHighProgress = progress > 70;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-400">{label}</span>
        <span className={cn(
          "transition-all duration-500",
          isHighProgress ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "text-slate-200"
        )}>
          {progress}% COMPLETED
        </span>
      </div>
      
      <div className="relative h-4 bg-black/40 rounded-full border border-white/5 overflow-hidden shadow-inner p-0.5">
        {/* Track Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]" />
        
        {/* Progress Fill */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full relative",
            progress > 0 && "bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-400"
          )}
        >
          {/* Internal Glow */}
          <div className="absolute inset-0 bg-white/20 blur-[1px] rounded-full" />
          
          {/* Fire Particles (Simple CSS pulses) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 px-1">
            {[...Array(Math.min(5, fireCount))].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.7, 0.3],
                  y: [0, -4, 0]
                }}
                transition={{ 
                  duration: 0.5 + i * 0.1, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_#fbbf24]"
                style={{ filter: 'blur(1px)' }}
              />
            ))}
          </div>

          {/* Animated Glow on tip */}
          <motion.div 
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute -right-2 top-0 bottom-0 w-4 bg-yellow-400/50 blur-xl rounded-full"
          />
        </motion.div>
      </div>
    </div>
  );
}
