import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, 
  UserCircle2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  BrainCircuit,
  Lock,
  Globe,
  Mail,
  KeyRound,
  UserPlus,
  ChevronLeft
} from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/firebaseService';
import { cn } from '../lib/utils';

interface AuthOverlayProps {
  onGuestAccess: () => void;
}

export default function AuthOverlay({ onGuestAccess }: AuthOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'selection' | 'email-login' | 'email-signup'>('selection');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'email-login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-w-lg w-full glass bg-slate-900/50 border-white/5 rounded-[3rem] p-12 shadow-2xl backdrop-blur-2xl text-center overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {mode === 'selection' ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 transform -rotate-6">
                  <BrainCircuit size={40} className="text-white" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles size={16} className="text-yellow-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Intelligent IAS Preparation</span>
                  </div>
                  <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
                    Smart <span className="text-indigo-400">Profile</span>
                  </h1>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Unlock AI predictions, track long-term progress, and compete on the global leaderboard.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-16 bg-white text-slate-900 rounded-2xl font-black flex items-center justify-center gap-4 hover:bg-slate-200 transition-all interactive-tap active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={20} />
                      Sign in with Google
                    </>
                  )}
                </button>

                <button 
                  onClick={() => setMode('email-login')}
                  className="w-full h-16 bg-white/5 text-white rounded-2xl font-bold flex items-center justify-center gap-4 hover:bg-white/10 transition-all border border-white/5 interactive-tap"
                >
                  <Mail size={20} className="text-slate-400" />
                  Continue with Email
                </button>

                <div className="flex items-center gap-4 my-8">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Or</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <button 
                  onClick={onGuestAccess}
                  className="w-full h-14 bg-transparent text-slate-400 rounded-2xl font-bold flex items-center justify-center gap-4 hover:text-white transition-all interactive-tap"
                >
                  <UserCircle2 size={20} />
                  Explore as Guest
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="email-auth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setMode('selection')}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ChevronLeft className="text-slate-400" />
                </button>
                <h2 className="text-2xl font-black text-white">
                  {mode === 'email-login' ? 'Welcome Back' : 'Create Account'}
                </h2>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ias.aspirant@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                    {error}
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-4 hover:bg-indigo-500 transition-all interactive-tap shadow-lg shadow-indigo-600/20"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'email-login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                      {mode === 'email-login' ? 'Sign In' : 'Create Profile'}
                    </>
                  )}
                </button>
              </form>

              <button 
                onClick={() => setMode(mode === 'email-login' ? 'email-signup' : 'email-login')}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors"
              >
                {mode === 'email-login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 grid grid-cols-3 gap-4">
           <Feature icon={<Lock size={12} />} label="Secure" />
           <Feature icon={<ShieldCheck size={12} />} label="No Spam" />
           <Feature icon={<Globe size={12} />} label="Cloud Sync" />
        </div>
      </motion.div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</span>
    </div>
  );
}
