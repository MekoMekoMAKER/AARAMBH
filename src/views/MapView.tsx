import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Search, 
  Info, 
  MapPin, 
  X,
  Trophy,
  HelpCircle,
  ChevronRight,
  Zap,
  Loader2,
  ShieldCheck,
  Newspaper
} from 'lucide-react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  ZoomableGroup 
} from "react-simple-maps";
import { cn } from '../lib/utils';
import { getCountryGeopoliticalAnalysis } from '../services/geminiService';

import { feature } from "topojson-client";
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface AIAnalysis {
  strategicImportance: string;
  indiaRelations: string[];
  keyOrganizations: string[];
  recentDevelopments: string[];
  criticalTerminology: string[];
  politicalHead: string;
  capital: string;
  currency: string;
  importanceLevel?: 'High' | 'Medium' | 'Low';
  importanceReason?: string;
}

const INDIA_NEIGHBORS = ["Pakistan", "China", "Nepal", "Bhutan", "Bangladesh", "Myanmar", "Sri Lanka", "Maldives", "Afghanistan"];

const UPSC_HOTSPOTS: Record<string, 'High' | 'Medium' | 'Low'> = {
  "Israel": "High",
  "Ukraine": "High",
  "Taiwan": "High",
  "USA": "High",
  "Russia": "High",
  "Japan": "High",
  "Australia": "High",
  "Vietnam": "Medium",
  "Philippines": "Medium",
  "Iran": "High",
  "Saudi Arabia": "Medium",
  "UAE": "High",
  "Maldives": "High",
  "Sri Lanka": "High",
  "Bangladesh": "High",
  "Nepal": "Medium",
  "Bhutan": "Medium",
  "Pakistan": "High",
  "Afghanistan": "High",
  "China": "High",
  "Egypt": "Medium",
  "South Africa": "Medium",
  "Brazil": "Medium",
  "Indonesia": "Medium",
};

export default function MapView() {
  const isOnline = useOnlineStatus();
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [indiaFocusMode, setIndiaFocusMode] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [targetCountry, setTargetCountry] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [countries, setCountries] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; name: string } | null>(null);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  useEffect(() => {
    const data = safeGet('upsc_map_geodata', null);
    if (data) {
      try {
        const geos: any = feature(data, data.objects.countries as any);
        setCountries(geos.features);
        setGeoData(data);
      } catch (err) {
        console.error("Error parsing cached map data:", err);
      }
    }

    if (isOnline) {
      fetch(geoUrl)
        .then(res => res.json())
        .then(data => {
          safeSet('upsc_map_geodata', data);
          const geos: any = feature(data, data.objects.countries as any);
          setCountries(geos.features);
          setGeoData(data);
        })
        .catch(err => console.error("Error loading map data:", err));
    }
  }, [isOnline]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const startQuiz = () => {
    if (countries.length > 0) {
      const filtered = countries.filter(c => c.properties.name !== "Antarctica");
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      setTargetCountry(random);
      setQuizMode(true);
      setScore(0);
      setStreak(0);
      setAttempts(0);
      setSelectedCountry(null);
      setAiAnalysis(null);
      setLastFeedback(null);
    }
  };

  const handleCountryClick = async (geo: any) => {
    const countryName = geo.properties.name;
    
    if (quizMode) {
      setAttempts(a => a + 1);
      if (countryName === targetCountry.properties.name) {
        setScore(s => s + 10);
        setStreak(s => s + 1);
        setLastFeedback({ correct: true, name: countryName });
        
        const filtered = countries.filter(c => c.properties.name !== "Antarctica");
        const next = filtered[Math.floor(Math.random() * filtered.length)];
        setTargetCountry(next);
      } else {
        setStreak(0);
        setLastFeedback({ correct: false, name: countryName });
      }
      return;
    }

    if (selectedCountry?.properties.name === countryName) {
      setSelectedCountry(null);
      setAiAnalysis(null);
      return;
    }
    
    setSelectedCountry(geo);
    setLoadingAnalysis(true);
    try {
      const analysis = await getCountryGeopoliticalAnalysis(countryName, indiaFocusMode);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const getGeographyStyle = (geo: any) => {
    const name = geo.properties.name;
    const isSelected = selectedCountry?.properties.name === name;
    const isIndia = name === "India";
    const isNeighbor = INDIA_NEIGHBORS.includes(name);
    const hotspotLevel = UPSC_HOTSPOTS[name];

    let fill = "#1e293b";
    let stroke = "#334155";
    let filter = "none";

    if (quizMode) {
      if (lastFeedback?.name === name) {
        fill = lastFeedback.correct ? "#10b981" : "#ef4444";
        stroke = "#ffffff";
      } else if (isSelected) {
        fill = "#6366f1";
      }
    } else if (heatmapMode) {
      if (hotspotLevel === 'High') {
        fill = "#ef4444";
        stroke = "#f87171";
        filter = "drop-shadow(0 0 4px rgba(239, 68, 68, 0.3))";
      } else if (hotspotLevel === 'Medium') {
        fill = "#f97316";
        stroke = "#fb923c";
      } else if (hotspotLevel === 'Low') {
        fill = "#10b981";
        stroke = "#34d399";
      }
      if (isIndia) fill = "#6366f1";
      if (isSelected) stroke = "#ffffff";
    } else {
      if (isIndia && indiaFocusMode) {
        fill = "#f97316";
        stroke = "#fbbf24";
        filter = "drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))";
      } else if (isNeighbor && indiaFocusMode) {
        fill = "#312e81";
        stroke = "#4f46e5";
      } else if (isSelected) {
        fill = "#6366f1";
        stroke = "#818cf8";
      }
    }

    return {
      default: { fill, stroke, strokeWidth: 0.5, outline: "none", transition: "all 300ms", filter },
      hover: { 
        fill: quizMode ? fill : "#4f46e5", 
        stroke: "#818cf8", 
        strokeWidth: 1, 
        outline: "none", 
        cursor: "pointer",
        transform: "scale(1.02)",
      },
      pressed: { fill: "#4338ca", outline: "none" }
    };
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 relative min-h-screen pb-20"
      onMouseMove={handleMouseMove}
    >
      {/* Precision Tooltip */}
      <AnimatePresence>
        {hoveredCountry && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ 
              position: 'fixed', 
              left: tooltipPos.x + 20, 
              top: tooltipPos.y + 20,
              zIndex: 100
            }}
            className="pointer-events-none bg-slate-900/90 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/10 backdrop-blur-xl flex items-center gap-2"
          >
            <Globe size={12} className="text-indigo-400" />
            {hoveredCountry}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white leading-none mb-1">Diplomacy Atlas</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sovereign Intelligence Unit</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => {
              setIndiaFocusMode(!indiaFocusMode);
              if (indiaFocusMode === false) {
                setHeatmapMode(false);
                setQuizMode(false);
              }
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all interactive-tap border",
              indiaFocusMode 
                ? "bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]" 
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
            )}
          >
            <ShieldCheck size={14} />
            India Focus
          </button>

          <button 
            onClick={() => {
              setHeatmapMode(!heatmapMode);
              if (heatmapMode === false) {
                setIndiaFocusMode(false);
                setQuizMode(false);
              }
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all interactive-tap border",
              heatmapMode 
                ? "bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
            )}
          >
            <Zap size={14} />
            UPSC Heatmap
          </button>

          <button 
            onClick={() => quizMode ? setQuizMode(false) : startQuiz()}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl interactive-tap border",
              quizMode 
                ? "bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/20" 
                : "bg-white text-slate-900 border-transparent shadow-white/5"
            )}
          >
            {quizMode ? <X size={14} /> : <Trophy size={14} />}
            {quizMode ? "Abort Ops" : "Map Quiz"}
          </button>
        </div>
      </div>

      {quizMode && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="md:col-span-2 glass bg-indigo-600/10 border-indigo-500/30 p-6 rounded-3xl flex items-center justify-between border-l-4 border-l-indigo-500">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                 <HelpCircle size={28} className="text-indigo-400 animate-bounce" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-1">Active Objective</p>
                 <p className="text-2xl font-black tracking-tight text-white">Locate: {targetCountry?.properties.name}</p>
                 <div className="flex gap-2 mt-2">
                   {['Easy', 'Medium', 'Hard'].map(d => (
                     <button 
                       key={d}
                       onClick={() => setDifficulty(d as any)}
                       className={cn(
                         "text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter border transition-all",
                         difficulty === d ? "bg-indigo-500 border-indigo-400 text-white" : "text-slate-500 border-white/10"
                       )}
                     >
                       {d}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          </div>

          <div className="glass bg-black/40 border-white/10 p-6 rounded-3xl grid grid-cols-2 gap-4">
            <div className="text-center md:text-left">
               <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Score Pool</p>
               <p className="text-2xl font-black text-white">{score}</p>
            </div>
            <div className="text-center md:text-left border-l border-white/5 pl-4">
               <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Streak</p>
               <p className={cn("text-2xl font-black", streak > 2 ? "text-orange-500" : "text-white")}>
                 {streak}🔥
               </p>
            </div>
            <div className="col-span-2 mt-2 flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Accuracy</span>
              <div className="w-2/3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  animate={{ width: attempts > 0 ? `${(score / (attempts * 10)) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Real Interactive Map */}
        <section className={cn(
          "relative aspect-[16/9] lg:aspect-auto lg:h-[700px] glass bg-black/40 rounded-[2.5rem] overflow-hidden border-white/10 shadow-inner transition-all duration-700",
          selectedCountry && !quizMode ? "lg:col-span-8" : "lg:col-span-12"
        )}>
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#4f46e5_0%,_transparent_70%)] opacity-30" />
            <div className="h-full w-full bg-[linear-gradient(to_right,_rgba(255,255,255,0.05)_2px,_transparent_2px),_linear-gradient(to_bottom,_rgba(255,255,255,0.05)_2px,_transparent_2px)] bg-[size:40px_40px]" />
          </div>

          <div className="relative w-full h-full cursor-crosshair">
            <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 200 }}>
              <ZoomableGroup center={[20, 0]}>
                {geoData && (
                  <Geographies geography={geoData}>
                    {({ geographies }) => 
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => setHoveredCountry(geo.properties.name)}
                          onMouseLeave={() => setHoveredCountry(null)}
                          onClick={() => handleCountryClick(geo)}
                          style={getGeographyStyle(geo)}
                        />
                      ))
                    }
                  </Geographies>
                )}
              </ZoomableGroup>
            </ComposableMap>
            
            <div className="absolute bottom-10 left-10 flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-100">Strat-Ops Map Active</span>
              </div>
              <div className="flex gap-2">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">Double click to zoom</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">Pinch to scale</p>
              </div>
            </div>
          </div>

          {/* Feedback Overlay for Quiz */}
          <AnimatePresence>
            {lastFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 px-6"
              >
                <div className={cn(
                  "px-10 py-6 rounded-3xl border-2 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] text-center max-w-sm",
                  lastFeedback.correct ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-red-500/20 border-red-500 text-red-400"
                )}>
                  <p className="text-4xl font-black mb-2">{lastFeedback.correct ? "TARGET SECURED" : "MISIDENTIFIED"}</p>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                    {lastFeedback.correct ? "Proceeding to next objective" : `That was ${lastFeedback.name}`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* AI Analysis Side Panel */}
        <div className={cn(
          "transition-all duration-700 h-full",
          selectedCountry && !quizMode ? "lg:col-span-4 translate-x-0 opacity-100" : "hidden translate-x-10 opacity-0"
        )}>
          <AnimatePresence>
            {selectedCountry && !quizMode && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="glass rounded-[2rem] p-8 border-white/10 shadow-2xl relative h-full flex flex-col"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-200 pointer-events-none">
                   <Globe size={180} />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <img 
                        src={`https://flagcdn.com/w160/${selectedCountry.id?.toString().toLowerCase() || 'un'}.png`} 
                        alt="Flag" 
                        className="w-16 h-10 object-cover rounded-md shadow-lg border border-white/10 bg-white/10"
                        referrerPolicy="no-referrer"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter text-white uppercase">{selectedCountry.properties.name}</h3>
                        <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                          <MapPin size={10} />
                          <span>Strategic Sector</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedCountry(null); setAiAnalysis(null); }}
                      className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-500 interactive-tap border border-white/5"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Government Seat</p>
                        <p className="text-sm font-bold text-white tracking-tight">{aiAnalysis?.capital || '...'}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Legal Tender</p>
                        <p className="text-sm font-bold text-white tracking-tight">{aiAnalysis?.currency || '...'}</p>
                      </div>
                      <div className="col-span-2 p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Command / Leadership</p>
                          <ShieldCheck size={14} className="text-indigo-400/50" />
                        </div>
                        <p className="text-lg font-black text-white">{aiAnalysis?.politicalHead || 'Synchronizing Unit...'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {aiAnalysis?.importanceLevel && (
                        <div className={cn(
                          "p-4 rounded-2xl border-l-4 mb-4",
                          aiAnalysis.importanceLevel === 'High' ? "bg-red-500/10 border-red-500 text-red-200" :
                          aiAnalysis.importanceLevel === 'Medium' ? "bg-orange-500/10 border-orange-500 text-orange-200" :
                          "bg-emerald-500/10 border-emerald-500 text-emerald-200"
                        )}>
                          <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                            <Info size={12} /> Why Important for UPSC?
                          </p>
                          <p className="text-xs font-medium leading-relaxed italic">{aiAnalysis.importanceReason}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                          <Zap size={20} className="text-indigo-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">UPSC Intelligence Intel</p>
                      </div>

                      {loadingAnalysis ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-60">
                          <div className="relative">
                            <Loader2 className="animate-spin text-indigo-500" size={48} />
                            <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic text-center">Decrypting<br/>Geopolitical Stance</p>
                        </div>
                      ) : aiAnalysis ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-8"
                        >
                          <div className="space-y-3">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                               <Info size={14} className="text-slate-600" /> Executive summary
                             </p>
                             <p className="text-sm leading-relaxed text-slate-200 font-medium bg-white/5 p-4 rounded-2xl border border-white/5">{aiAnalysis.strategicImportance}</p>
                          </div>

                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                               <ShieldCheck size={14} /> National Interest (India)
                             </p>
                             <div className="space-y-3">
                               {aiAnalysis.indiaRelations.map((rel: string, i: number) => (
                                 <div key={i} className="flex gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs text-slate-300 leading-relaxed group hover:bg-emerald-500/10 transition-all">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                   <p>{rel}</p>
                                 </div>
                               ))}
                             </div>
                          </div>

                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                               <Newspaper size={14} /> Critical Briefings
                             </p>
                             <div className="space-y-3">
                               {aiAnalysis.recentDevelopments.map((dev: string, i: number) => (
                                 <div key={i} className="group p-5 bg-white/3 border border-white/10 rounded-2xl text-[11px] text-slate-300 leading-relaxed hover:bg-white/5 transition-all relative overflow-hidden shadow-sm">
                                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500/50 group-hover:w-1.5 transition-all" />
                                   {dev}
                                 </div>
                               ))}
                             </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-4">
                            {aiAnalysis.keyOrganizations.map((org: string) => (
                              <span key={org} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase text-indigo-300 tracking-wider shadow-sm">
                                {org}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <div className="p-8 text-center glass border-red-500/20 rounded-2xl">
                           <p className="text-xs font-bold text-red-400">Communication Link Severed. Retry required.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!selectedCountry && !quizMode && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 px-8 border-2 border-dashed border-white/10 rounded-[4rem] bg-white/2 backdrop-blur-sm shadow-inner group overflow-hidden relative"
        >
           <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
           <Globe size={80} className="mx-auto text-slate-800 mb-8 group-hover:text-indigo-500/40 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12" />
           <p className="font-black text-slate-300 tracking-tight text-3xl mb-3">Interrogate the Sovereign Atlas</p>
           <p className="text-xs text-slate-500 uppercase font-black tracking-[0.4em] italic mb-8">Temporal Spatial Intelligence Required</p>
           
           <div className="flex flex-wrap justify-center gap-10 mt-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="text-center group-hover:translate-y-[-5px] transition-transform">
               <p className="text-2xl font-black text-white">190+</p>
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nations</p>
             </div>
             <div className="text-center group-hover:translate-y-[-5px] transition-transform delay-75">
               <p className="text-2xl font-black text-white">Live</p>
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Geopolitics</p>
             </div>
             <div className="text-center group-hover:translate-y-[-5px] transition-transform delay-150">
               <p className="text-2xl font-black text-white">UPSC</p>
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Curated</p>
             </div>
           </div>
        </motion.div>
      )}
    </motion.div>
  );
}
