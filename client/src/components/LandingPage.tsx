import  { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Activity, 
  ShieldAlert, 
  ArrowRight, 
  AlertTriangle,
  LifeBuoy,
  Map
} from 'lucide-react';

// --- Styles ---
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');
  
  .font-brand { font-family: 'Playfair Display', serif; }
  .font-ui { font-family: 'Inter', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
  
  /* The central hero grid */
  .dot-grid {
    background-size: 40px 40px;
    background-image: radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px);
  }

  /* NEW: Blueprint Architectural Pattern */
  .bg-blueprint {
    background-color: #f8fafc;
    /* Complex seamless architectural pattern */
    background-image: url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h120v120H0z' fill='none'/%3E%3Cg stroke='%230f172a' stroke-width='0.5' opacity='0.15'%3E%3Cpath d='M10 10h100v100H10z'/%3E%3Cpath d='M30 10v100M50 10v100M70 10v100M90 10v100M10 30h100M10 50h100M10 70h100M10 90h100'/%3E%3Cpath d='M30 30h20v20H30zM70 70h20v20H70z' fill='none' stroke-dasharray='2 2'/%3E%3Cpath d='M30 50l20 20M70 90l20-20'/%3E%3Ccircle cx='60' cy='60' r='5' fill='none'/%3E%3C/g%3E%3C/svg%3E");
  }

  /* Grain Texture for Documentary Feel */
  .bg-grain {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
    pointer-events: none;
  }
`;

// --- COMPONENT: BACKGROUND BLUEPRINT LAYER ---
const BackgroundLayer = ({ status }) => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-blueprint">
       {/* 1. The static architectural drawing pattern (defined in CSS) */}
       <div className="absolute inset-0 bg-blueprint opacity-100 mix-blend-multiply"></div>

       {/* 2. Subtle color overlay that breathes with the status over the blueprint */}
       <motion.div
         className="absolute inset-0 mix-blend-multiply"
         animate={{
           // Very faint red or green tint over the blueprint lines
           backgroundColor: status === 'danger' ? 'rgba(254, 202, 202, 0.15)' : 'rgba(167, 243, 208, 0.15)',
         }}
         transition={{ duration: 4, ease: "easeInOut" }}
       />

       {/* 3. Grain Overlay (Texture) */}
       <div className="absolute inset-0 bg-grain opacity-40"></div>
       
       {/* 4. Bottom fade to make footer readable */}
       <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-white to-transparent"></div>
    </div>
  );
};

// --- COMPONENT: CENTER HERO ANIMATION ---
const LifeSavingHero = ({ status }) => {
  return (
    <div className="relative w-full h-[50vh] flex flex-col items-center justify-center z-10">
      
      {/* VISUAL ANCHOR: The Impact Monitor */}
      <div className="mb-10">
        <AnimatePresence mode="wait">
            {status === 'danger' ? (
                <motion.div 
                    key="danger"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="flex items-center gap-2 px-4 py-1 bg-red-100/90 text-red-700 rounded-full border border-red-200 font-mono text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
                        <AlertTriangle size={14} /> Critical Risk
                    </div>
                    <p className="text-3xl font-brand font-black text-neutral-800/90">
                        Panic <span className="text-red-600">kills.</span>
                    </p>
                </motion.div>
            ) : (
                <motion.div 
                    key="safe"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="flex items-center gap-2 px-4 py-1 bg-emerald-100/90 text-emerald-700 rounded-full border border-emerald-200 font-mono text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
                        <Heart size={14} /> Intervention
                    </div>
                    <p className="text-3xl font-brand font-black text-neutral-800/90">
                        Order <span className="text-emerald-600">saves.</span>
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* THE BLUEPRINT: Visualizing the Crowd */}
      <div className="relative w-[300px] h-[300px] bg-white/70 backdrop-blur-xl rounded-full border border-white/60 shadow-2xl flex items-center justify-center overflow-hidden ring-1 ring-black/5">
        <div className="absolute inset-0 dot-grid opacity-30"></div>
        
        {/* Exits (Markers) */}
        <div className="absolute top-0 w-12 h-2 bg-neutral-300/50"></div>
        <div className="absolute bottom-0 w-12 h-2 bg-neutral-300/50"></div>
        <div className="absolute left-0 h-12 w-2 bg-neutral-300/50"></div>
        <div className="absolute right-0 h-12 w-2 bg-neutral-300/50"></div>

        {/* The People Particles */}
        {Array.from({ length: 60 }).map((_, i) => (
            <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full transition-colors duration-1000 ${status === 'safe' ? 'bg-emerald-500' : 'bg-red-500'}`}
                animate={{
                    x: status === 'safe' ? [0, (Math.cos(i) * 140)] : [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50], 
                    y: status === 'safe' ? [0, (Math.sin(i) * 140)] : [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50],
                    scale: status === 'safe' ? 1 : [1, 1.5, 1],
                }}
                transition={{
                    duration: status === 'safe' ? 4 : 0.8,
                    ease: "easeInOut",
                    repeat: Infinity
                }}
            />
        ))}

        <div className="absolute z-10 bg-white p-3 rounded-full shadow-lg border border-neutral-100">
            <Activity className="w-5 h-5 text-neutral-400" />
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function AIForGoodPage() {
  const [status, setStatus] = useState('danger');

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => prev === 'danger' ? 'safe' : 'danger');
    }, 6000); 
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = fontStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div className="min-h-screen text-[#111] font-ui selection:bg-[#111] selection:text-white overflow-x-hidden relative">
      
      {/* BACKGROUND LAYER (New Blueprint) */}
      <BackgroundLayer status={status} />

      {/* HEADER */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200/50 h-16 flex items-center justify-between px-6 md:px-12 shadow-sm">
        <div className="flex items-center gap-2">
           <ShieldAlert className="w-6 h-6 text-[#111]" />
           <span className="font-bold tracking-tight">CrowdGuard <span className="font-normal text-neutral-500">Initiative</span></span>
        </div>
        <div className="flex items-center gap-4">
             <span className="text-[10px] font-mono text-neutral-500 hidden md:block border border-neutral-200/80 px-2 py-1 rounded bg-white/50">NON-COMMERCIAL LICENSE</span>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-28 pb-12 px-6 flex flex-col items-center relative z-10">
         
         {/* Badge */}
         <div className="mb-6 flex items-center gap-2 bg-blue-50/90 backdrop-blur-md text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border border-blue-100/50">
            <LifeBuoy size={14} /> AI For Good
         </div>

         {/* Heavy Headline */}
         <div className="text-center mb-8 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-brand font-black mb-6 leading-tight tracking-tight text-slate-900 drop-shadow-sm">
               Every second of delay<br/>
               <span className="text-slate-500">costs a life.</span>
            </h1>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed font-medium bg-white/30 backdrop-blur-sm p-2 rounded-lg">
               Crowd crushes are preventable disasters. We built this general-purpose AI 
               to detect density spikes and trigger evacuation protocols 
               <em> before</em> the breaking point.
            </p>
         </div>

         {/* The Animation */}
         <LifeSavingHero status={status} />

         {/* Primary Call to Action */}
         <div className="mt-10 text-center">
             <Link to="/dashboard">
                <button className="group relative px-8 py-4 bg-[#111] text-white rounded-full font-bold text-lg shadow-xl shadow-neutral-900/20 hover:scale-105 transition-transform flex items-center gap-3 mx-auto hover:bg-neutral-800">
                    Initialize System
                    <ArrowRight size={18} className="text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
             </Link>
             <p className="text-xs text-slate-600 mt-4 max-w-sm mx-auto bg-white/40 backdrop-blur-sm p-1 rounded">
                By initializing, you enable real-time density tracking and automated crowd dispersal alerts.
             </p>
         </div>
      </section>

      {/* IMPACT STATS */}
      <section className="bg-white/60 backdrop-blur-lg py-20 px-6 border-t border-neutral-200/80 relative z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            
            <div className="flex flex-col items-center group">
                <div className="w-16 h-16 bg-white rounded-full shadow-lg border border-neutral-100 flex items-center justify-center mb-6 text-red-500 group-hover:scale-110 transition-transform">
                    <AlertTriangle size={28} />
                </div>
                <h3 className="text-4xl font-brand font-black mb-2">3,000+</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Lives Lost Annually</p>
                <p className="text-sm text-slate-500 mt-3 max-w-xs">
                    Due to poor crowd management and delayed response times in high-density venues.
                </p>
            </div>

            <div className="flex flex-col items-center group">
                <div className="w-16 h-16 bg-white rounded-full shadow-lg border border-neutral-100 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                    <Activity size={28} />
                </div>
                <h3 className="text-4xl font-brand font-black mb-2">1.2s</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Detection Latency</p>
                <p className="text-sm text-slate-500 mt-3 max-w-xs">
                    Our AI identifies dangerous accumulation patterns instantly, faster than human surveillance.
                </p>
            </div>

            <div className="flex flex-col items-center group">
                <div className="w-16 h-16 bg-white rounded-full shadow-lg border border-neutral-100 flex items-center justify-center mb-6 text-green-500 group-hover:scale-110 transition-transform">
                    <Map size={28} />
                </div>
                <h3 className="text-4xl font-brand font-black mb-2">Any Venue</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Open Implementation</p>
                <p className="text-sm text-slate-500 mt-3 max-w-xs">
                    Designed as a humanitarian utility. Compatible with standard architectural layouts and CCTV.
                </p>
            </div>

        </div>
      </section>
      
      {/* Simple Footer */}
      <footer className="bg-white/80 backdrop-blur-md py-6 text-center text-neutral-500 text-sm border-t border-neutral-200 relative z-10">
        <p>© 2024 CrowdGuard Initiative. Open source technology for public safety.</p>
      </footer>

    </div>
  );
}