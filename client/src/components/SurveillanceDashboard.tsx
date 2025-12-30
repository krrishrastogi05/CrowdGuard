import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Activity, 
  Megaphone, 
  PenTool, X, Target, Clock, PlayCircle, RotateCcw,
  Flame, FileText
} from 'lucide-react';
import { API_URL } from '../services/gemini';
import io from 'socket.io-client';

const socket = io(API_URL);

// --- STYLES ---
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500&display=swap');
  
  :root {
    --bg-app: #F5F5F2;
    --ink-primary: #111111;
  }
  
  .font-brand { font-family: 'Playfair Display', serif; }
  .font-ui { font-family: 'Inter', sans-serif; }
  .font-data { font-family: 'JetBrains Mono', monospace; }
  
  .pattern-grid {
    background-image: linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center center;
    opacity: 0.05;
  }
`;

// --- GEOMETRY ---
const STADIUM_ZONES = [
  { id: 'field', name: 'FIELD PLAY AREA', path: "M 30,40 L 70,40 Q 75,40 75,50 Q 75,60 70,60 L 30,60 Q 25,60 25,50 Q 25,40 30,40 Z", cx: 50, cy: 50 },
  { id: 'sec-n', name: 'NORTH STANDS', path: "M 25,35 L 75,35 Q 85,35 85,25 Q 85,15 50,15 Q 15,15 15,25 Q 15,35 25,35 Z", cx: 50, cy: 25 },
  { id: 'sec-s', name: 'SOUTH STANDS', path: "M 25,65 L 75,65 Q 85,65 85,75 Q 85,85 50,85 Q 15,85 15,75 Q 15,65 25,65 Z", cx: 50, cy: 75 },
  { id: 'sec-e', name: 'EAST WING', path: "M 80,40 L 90,40 Q 95,50 90,60 L 80,60 Q 85,50 80,40 Z", cx: 88, cy: 50 },
  { id: 'sec-w', name: 'WEST WING', path: "M 20,40 L 10,40 Q 5,50 10,60 L 20,60 Q 15,50 20,40 Z", cx: 12, cy: 50 },
  { id: 'gate-nw', name: 'GATE NW', path: "M 15,15 L 20,10 L 25,15 Z", cx: 18, cy: 12 },
  { id: 'gate-ne', name: 'GATE NE', path: "M 85,15 L 80,10 L 75,15 Z", cx: 82, cy: 12 },
  { id: 'gate-sw', name: 'GATE SW', path: "M 15,85 L 20,90 L 25,85 Z", cx: 18, cy: 88 },
  { id: 'gate-se', name: 'GATE SE', path: "M 85,85 L 80,90 L 75,85 Z", cx: 82, cy: 88 },
];

// --- MEMOIZED MAP COMPONENT ---
const TechnicalMap = React.memo(({ incidents, units, onZoneClick, onIncidentClick, showHeatmap }) => {
  
  const getZoneStyle = (zone) => {
    const activeIncident = incidents.find(i => {
      const incLoc = i.location?.name?.toUpperCase() || "";
      const zoneName = zone.name.toUpperCase();
      return incLoc === zoneName || incLoc.includes(zoneName) || zoneName.includes(incLoc) || i.location?.id === zone.id;
    });

    if (showHeatmap) {
      const density = activeIncident ? activeIncident.densityScore : 2;
      
      if (density >= 7) {
        return { fill: "#DC2626", opacity: 0.85 };
      } else if (density >= 3) {
        return { fill: "#EAB308", opacity: 0.7 };
      } else {
        return { fill: "#10B981", opacity: 0.5 };
      }
    }

    if (!activeIncident) return { fill: "#E5E5E5", stroke: "#262626", width: 0.5, opacity: 1 };
    
    if (activeIncident.riskLevel === 'CRITICAL') return { fill: "#EF4444", stroke: "#7F1D1D", width: 1.5, opacity: 1, animate: true };
    return { fill: "#F97316", stroke: "#7C2D12", width: 1.5, opacity: 1, animate: false };
  };

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
       <svg 
         viewBox="0 0 100 100" 
         preserveAspectRatio="xMidYMid meet" 
         className="w-full h-full overflow-visible drop-shadow-2xl" 
         style={{ maxHeight: '90vh' }}
       >
         <defs>
            <pattern id="smallGrid" width="2" height="2" patternUnits="userSpaceOnUse">
              <path d="M 2 0 L 0 0 0 2" fill="none" stroke="gray" strokeWidth="0.1" opacity="0.2"/>
            </pattern>
         </defs>
         <rect width="100" height="100" fill="url(#smallGrid)" opacity={showHeatmap ? 0.1 : 0} transition="opacity 0.5s" />

         {/* Zones */}
         {STADIUM_ZONES.map(zone => {
             const style = getZoneStyle(zone);
             return (
               <g key={zone.id} onClick={(e) => { e.stopPropagation(); onZoneClick(zone); }} className="cursor-pointer group transition-all duration-500">
                  <path 
                    d={zone.path} 
                    fill={style.fill} 
                    stroke={showHeatmap ? "none" : style.stroke} 
                    strokeWidth={style.width} 
                    fillOpacity={style.opacity}
                    className="transition-all duration-500 ease-in-out hover:brightness-110" 
                  />
                  {style.animate && !showHeatmap && (
                    <path d={zone.path} className="fill-red-500/30 animate-pulse stroke-none pointer-events-none" />
                  )}
                  <text x={zone.cx} y={zone.cy} className="text-[2px] fill-neutral-600 font-bold font-data text-anchor-middle dominant-baseline-middle pointer-events-none transition-colors">
                    {zone.name}
                  </text>
               </g>
             )
         })}

         {/* UNITS LAYER */}
         {units.map(unit => (
            <g key={unit._id} className="transition-all duration-1000 ease-out" style={{ transform: `translate(${unit.location.x}px, ${unit.location.y}px)` }}>
               <g className="origin-center hover:scale-125 transition-transform cursor-pointer">
                  <rect 
                    x="-1.5" y="-1.5" width="3" height="3" 
                    transform="rotate(45)" 
                    fill={unit.type === 'MEDIC' ? '#16A34A' : '#2563EB'} 
                    stroke="white" strokeWidth="0.3"
                    className="drop-shadow-sm"
                  />
                  <text y="-3" fontSize="1.5" textAnchor="middle" fontWeight="bold" fill="#111" className="opacity-0 group-hover:opacity-100 font-data uppercase">
                    {unit.name}
                  </text>
               </g>
            </g>
         ))}

         {/* INCIDENTS LAYER */}
         {incidents.map((inc) => (
             <g 
                key={inc._id} 
                className="cursor-pointer"
                style={{ transform: `translate(${inc.location.x}px, ${inc.location.y}px)` }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onIncidentClick(inc);
                }}
             >
                <circle r="4" fill="transparent" stroke="#EF4444" strokeWidth="0.2" className="animate-ping opacity-75" />
                <rect x="-2" y="-2" width="4" height="4" fill="#DC2626" stroke="white" strokeWidth="0.5" rx="0.5" />
                <text x="0" y="1" fontSize="2" fill="white" textAnchor="middle" fontWeight="bold">!</text>
             </g>
         ))}

       </svg>
    </div>
  );
});

const StatusBadge = ({ status }) => {
    const styles = {
        CRITICAL: "bg-red-600 text-white border-red-800",
        MODERATE: "bg-orange-100 text-orange-700 border-orange-200",
        WARNING: "bg-orange-100 text-orange-700 border-orange-200",
        SAFE: "bg-emerald-50 text-emerald-700 border-emerald-200",
        NOMINAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
        DEPLOYED: "bg-blue-600 text-white border-blue-800",
        IDLE: "bg-neutral-100 text-neutral-600 border-neutral-200",
        BUSY: "bg-amber-50 text-amber-700 border-amber-200"
    };
    const base = status?.toUpperCase() || 'NOMINAL';
    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold font-data border rounded-sm tracking-tight ${styles[base] || styles.IDLE}`}>
            {base}
        </span>
    );
};

// Heatmap Legend Component
const HeatmapLegend = () => (
  <div className="absolute bottom-20 left-6 bg-white border border-neutral-300 rounded-lg shadow-xl p-4 z-30">
    <h4 className="text-xs font-bold text-neutral-700 uppercase mb-3">Crowd Density Scale</h4>
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-4 bg-[#10B981] opacity-50 border border-neutral-300 rounded"></div>
        <span className="text-xs text-neutral-600 font-medium">Low (0-2): Safe</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-4 bg-[#EAB308] opacity-70 border border-neutral-300 rounded"></div>
        <span className="text-xs text-neutral-600 font-medium">Medium (3-6): Monitor</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-4 bg-[#DC2626] opacity-85 border border-neutral-300 rounded"></div>
        <span className="text-xs text-neutral-600 font-medium">High (7-10): Critical</span>
      </div>
    </div>
  </div>
);

export default function CrowdGuardProfessional() {
  const [units, setUnits] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditMode, setIsEditMode] = useState(false);
  const [spawnType, setSpawnType] = useState('STEWARD');
  const [recentLogs, setRecentLogs] = useState([]); 
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = fontStyles;
    document.head.appendChild(styleSheet);
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const fetchData = () => {
        fetch(`${API_URL}/api/units`).then(res => res.json()).then(setUnits);
        fetch(`${API_URL}/api/incidents`).then(res => res.json()).then(setIncidents);
    };
    fetchData();

    socket.on('alert', (payload) => {
       if (payload.type === 'NEW_INCIDENT') {
         setIncidents(prev => [payload.data, ...prev]);
       }
       if (payload.type === 'INCIDENT_UPDATE') {
          setIncidents(prev => prev.map(i => i._id === payload.data._id ? payload.data : i));
          // FIX: Update selected incident properly with immutable update
          setSelectedIncident(prevSelected => {
            if (prevSelected?._id === payload.data._id) {
              return { ...payload.data };
            }
            return prevSelected;
          });
       }
    });
    socket.on('unit_added', (u) => setUnits(prev => [...prev, u]));
    socket.on('unit_deleted', (id) => setUnits(prev => prev.filter(u => u._id !== id)));
    socket.on('unit_update', (u) => setUnits(prev => prev.map(old => old._id === u._id ? u : old)));
    socket.on('system_reset', () => { 
      setIncidents([]); 
      setUnits([]); 
      setSelectedIncident(null); 
      setRecentLogs([]); 
    });
    
    return () => { 
        document.head.removeChild(styleSheet);
        clearInterval(timer);
        socket.off('alert'); 
        socket.off('unit_added'); 
        socket.off('unit_deleted'); 
        socket.off('unit_update'); 
        socket.off('system_reset'); 
    }
  }, []); 

  const handleMapClick = async (e) => {
    if (!isEditMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    await fetch(`${API_URL}/api/units`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: `${spawnType.substr(0,3)}-${Math.floor(Math.random()*1000)}`, type: spawnType, location: { x, y } })
    });
  };

  const handleDeploy = async (unitId, incident) => {
    const unitName = units.find(u => u._id === unitId)?.name || "UNIT";
    setRecentLogs(prev => [
        { type: 'DEPLOY', message: `UNIT ${unitName} DEPLOYED TO ${incident.location?.name}`, timestamp: Date.now() },
        ...prev
    ].slice(0, 5));
    
    setUnits(prevUnits => prevUnits.map(u => 
      u._id === unitId ? { ...u, status: 'DEPLOYED' } : u
    ));
    
    if(selectedIncident && selectedIncident._id === incident._id) {
        setSelectedIncident(prev => ({ ...prev, status: 'DISPATCHED' }));
    }
    
    await fetch(`${API_URL}/api/units/deploy`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          unitId, 
          targetX: incident.location.x, 
          targetY: incident.location.y, 
          incidentId: incident._id 
        })
    });
  };

  const resetSystem = async () => {
    if(!window.confirm("CONFIRM SYSTEM RESET?")) return;
    await fetch(`${API_URL}/api/reset`, { method: 'POST' });
  };

  const generateOverallReport = useCallback(async () => {
    if (incidents.length === 0) {
      alert("No incidents to analyze. Report generation requires active incidents.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/generate-report`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ incidents })
      });
      const report = await response.json();
      setShowReport(report);
    } catch (error) {
      console.error("Report generation failed:", error);
      alert("Failed to generate report. Please try again.");
    }
  }, [incidents]);

  const tickerItems = useMemo(() => {
      const activeIncidents = incidents.map(inc => ({
          type: 'INCIDENT',
          id: inc._id,
          text: `${inc.riskLevel} ALERT IN ${inc.location?.name} //`,
          risk: inc.riskLevel
      }));
      const logs = recentLogs.map((log, i) => ({
          type: 'LOG',
          id: `log-${log.timestamp}-${i}`,
          text: `>> ${log.message} //`,
          risk: 'INFO'
      }));
      return [...activeIncidents, ...logs];
  }, [incidents, recentLogs]);

  const handleZoneClick = (zone) => {
      const found = incidents.find(i => {
           const incLoc = i.location?.name?.toUpperCase() || "";
           const zoneName = zone.name?.toUpperCase() || "";
           return incLoc === zoneName || incLoc.includes(zoneName) || zoneName.includes(incLoc) || i.location?.id === zone.id;
       });
       if(found) setSelectedIncident({ ...found }); 
  };

  const handleIncidentClick = useCallback((incident) => {
    setSelectedIncident({ ...incident }); 
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F5F5F2] text-[#111] font-ui overflow-hidden">
      
      {/* HEADER */}
      <div className="h-16 bg-white border-b border-neutral-300 flex items-center justify-between px-6 shrink-0 z-[60]">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-[#111]" />
                  <div>
                    <h1 className="text-2xl font-brand font-black tracking-tight text-[#111] leading-none">CrowdGuard</h1>
                    <div className="text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase">Enterprise Ops</div>
                  </div>
              </div>
              <div className="h-8 w-[1px] bg-neutral-200"></div>
              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowHeatmap(!showHeatmap)} 
                    className={`flex items-center gap-2 px-4 py-2 border rounded text-xs font-bold uppercase tracking-wider transition ${showHeatmap ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-neutral-50 text-neutral-600 border-neutral-200'}`}
                  >
                      <Flame className="w-4 h-4" /> Thermography
                  </button>
                  <button 
                    onClick={generateOverallReport}
                    disabled={incidents.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <FileText className="w-4 h-4" /> Generate Report
                  </button>
                  <a href="/inject" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-bold uppercase tracking-wider transition">
                      <PlayCircle className="w-4 h-4" /> Field Simulator
                  </a>
                  <button onClick={resetSystem} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-xs font-bold uppercase tracking-wider transition">
                      <RotateCcw className="w-4 h-4" /> Reset
                  </button>
              </div>
          </div>
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-data text-neutral-500">
                  <Clock className="w-4 h-4"/>
                  {currentTime.toLocaleTimeString()} <span className="text-neutral-300">|</span> UTC +5:30
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Online</span>
              </div>
          </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative overflow-hidden">
          
          <div className="absolute inset-0 flex">
              
              {/* LEFT SIDEBAR */}
              <div className="w-[340px] bg-white border-r border-neutral-300 flex flex-col z-20 shadow-lg">
                  <div className="p-3 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Active Units ({units.length})</span>
                      <button onClick={() => setIsEditMode(!isEditMode)} className={`p-1.5 rounded border transition ${isEditMode ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'}`}>
                        <PenTool className="w-3 h-3"/>
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-white sticky top-0 z-10 shadow-sm">
                              <tr className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-200">
                                  <th className="px-4 py-3 font-medium">ID</th>
                                  <th className="px-2 py-3 font-medium">Class</th>
                                  <th className="px-2 py-3 font-medium text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                              {units.map(unit => (
                                  <tr key={unit._id} className="hover:bg-neutral-50 transition group cursor-default">
                                      <td className="px-4 py-3">
                                          <div className="text-xs font-bold text-[#111]">{unit.name}</div>
                                      </td>
                                      <td className="px-2 py-3">
                                          <div className="text-[10px] font-data text-neutral-500 uppercase">{unit.type}</div>
                                      </td>
                                      <td className="px-2 py-3 text-right">
                                          <StatusBadge status={unit.status} />
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <AnimatePresence>
                  {isEditMode && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-neutral-200 bg-neutral-100 overflow-hidden">
                          <div className="p-4 grid grid-cols-2 gap-2">
                               {['STEWARD', 'MEDIC', 'DRONE', 'POLICE'].map(t => (
                                   <button key={t} onClick={() => setSpawnType(t)} className={`text-[9px] font-bold py-3 border rounded shadow-sm hover:shadow-md transition ${spawnType === t ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-neutral-600 border-neutral-300'}`}>
                                            + {t}
                                   </button>
                               ))}
                          </div>
                      </motion.div>
                  )}
                  </AnimatePresence>
              </div>

              {/* MAP CONTAINER */}
              <div className="flex-1 relative bg-[#E5E5E5] flex flex-col min-w-0">
                   <div className="absolute inset-0 pattern-grid pointer-events-none"></div>
                   
                   {/* ADDED: MONITORING OVERLAY */}
                   <div className="absolute top-6 left-6 z-10 pointer-events-none">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-data">Currently Monitoring</span>
                        <span className="text-2xl font-brand font-black text-[#111] uppercase block">Iota Stadium</span>
                   </div>

                   <div className="flex-1 relative overflow-hidden" onClick={handleMapClick} style={{ width: '100%' }}>
                       <TechnicalMap 
                           incidents={incidents} 
                           units={units}
                           onZoneClick={handleZoneClick}
                           onIncidentClick={handleIncidentClick}
                           showHeatmap={showHeatmap} 
                       />
                       {showHeatmap && <HeatmapLegend />}
                   </div>

                   {/* FEED RIBBON */}
                   <div className="h-12 bg-[#111] text-white flex border-t-4 border-red-600 shrink-0 z-50 shadow-2xl relative">
                       <div className="px-6 bg-[#111] h-full flex items-center gap-3 z-20 shadow-[10px_0_20px_rgba(0,0,0,0.5)] border-r border-neutral-800">
                           <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse border border-red-900"></span>
                           <span className="text-xs font-black text-red-500 uppercase tracking-widest whitespace-nowrap">Live Wire</span>
                       </div>
                       
                       <div className="flex-1 overflow-hidden relative flex items-center z-10 bg-[#111]">
                           <motion.div 
                               className="flex items-center gap-16 whitespace-nowrap pl-4" 
                               animate={{ x: ["0%", "-50%"] }} 
                               transition={{ duration: 40, ease: "linear", repeat: Infinity }}
                           >
                               {tickerItems.length === 0 ? (
                                   <span className="text-sm font-data font-bold text-neutral-400">NO ACTIVE ALERTS // MONITORING CROWD DENSITY // ALL SECTORS GREEN</span>
                               ) : (
                                   tickerItems.map((item) => (
                                       <span key={item.id} className="text-sm font-data font-bold flex items-center gap-3">
                                           {item.type === 'INCIDENT' ? (
                                                <span className="text-red-500 bg-red-900/20 px-1 border border-red-900/50">[{item.risk}]</span> 
                                           ) : (
                                                <span className="text-cyan-400 bg-cyan-900/20 px-1 border border-cyan-900/50">[STATUS]</span> 
                                           )}
                                           {item.text}
                                       </span>
                                   ))
                               )}
                               {tickerItems.length === 0 ? (
                                   <span className="text-sm font-data font-bold text-neutral-400">NO ACTIVE ALERTS // MONITORING CROWD DENSITY // ALL SECTORS GREEN</span>
                               ) : (
                                   tickerItems.map((item) => (
                                       <span key={`${item.id}-dup`} className="text-sm font-data font-bold flex items-center gap-3">
                                           {item.type === 'INCIDENT' ? (
                                                <span className="text-red-500 bg-red-900/20 px-1 border border-red-900/50">[{item.risk}]</span> 
                                           ) : (
                                                <span className="text-cyan-400 bg-cyan-900/20 px-1 border border-cyan-900/50">[STATUS]</span> 
                                           )}
                                           {item.text}
                                       </span>
                                   ))
                               )}
                           </motion.div>
                           <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#111] to-transparent z-30 pointer-events-none"></div>
                       </div>
                   </div>
              </div>
          </div>

          {/* RIGHT DETAIL PANEL */}
          <AnimatePresence mode="wait">
          {selectedIncident && (
              <motion.div 
                key={selectedIncident._id}
                initial={{ x: "100%", opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                exit={{ x: "100%", opacity: 0 }} 
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute top-0 right-0 w-[420px] bg-white border-l border-neutral-300 shadow-2xl flex flex-col z-[50] pointer-events-auto"
                style={{ height: 'calc(100% - 3rem)' }}
              >
                  <div className="p-6 border-b border-neutral-200 bg-neutral-50 relative">
                      <button onClick={() => setSelectedIncident(null)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 rounded-full transition">
                          <X className="w-5 h-5"/>
                      </button>
                      <StatusBadge status={selectedIncident.riskLevel} />
                      <h2 className="text-2xl font-brand font-bold text-[#111] mt-2 leading-tight">{selectedIncident.type || "Threat Detected"}</h2>
                      <div className="text-[10px] font-data text-neutral-400 uppercase tracking-wider mt-1">
                          INCIDENT ID: #{selectedIncident._id.slice(-6).toUpperCase()}
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                      <div>
                          <h3 className="text-xs font-bold text-[#111] uppercase border-b border-neutral-200 pb-2 mb-3">Situation Report</h3>
                          <p className="text-sm text-neutral-600 leading-relaxed font-ui">{selectedIncident.description}</p>
                          <div className="mt-4 grid grid-cols-2 gap-4">
                              <div className="p-4 bg-white border border-neutral-200 shadow-sm rounded-sm">
                                  <div className="text-[9px] text-neutral-400 uppercase font-bold">Crowd Density</div>
                                  <div className="text-3xl font-brand font-black text-[#111] mt-1">{selectedIncident.densityScore}<span className="text-sm text-neutral-400 font-normal">/10</span></div>
                              </div>
                              <div className="p-4 bg-white border border-neutral-200 shadow-sm rounded-sm">
                                  <div className="text-[9px] text-neutral-400 uppercase font-bold">Casualty Risk</div>
                                  <div className="text-3xl font-brand font-black text-red-600 mt-1">{selectedIncident.riskLevel === 'CRITICAL' ? 'High' : 'Mod'}</div>
                              </div>
                          </div>
                      </div>

                      <div>
                         <h3 className="text-xs font-bold text-[#111] uppercase border-b border-neutral-200 pb-2 mb-3 flex items-center gap-2">
                             <Target className="w-3 h-3"/> AI Strategy
                         </h3>
                         <div className="bg-[#111] text-neutral-200 p-5 text-sm font-medium leading-relaxed border-l-4 border-red-500 shadow-lg">
                             {selectedIncident.suggestedAction || "Calculating optimal intervention path..."}
                         </div>
                      </div>

                      <button onClick={() => alert("Public Advisory Broadcasted.")} className="w-full py-4 bg-white border-2 border-[#111] hover:bg-[#111] hover:text-white flex items-center justify-center gap-3 transition-colors group">
                          <Megaphone className="w-4 h-4 group-hover:scale-110 transition-transform"/>
                          <span className="text-xs font-bold uppercase tracking-widest">Broadcast Alert</span>
                      </button>

                      <div>
                          <h3 className="text-xs font-bold text-[#111] uppercase border-b border-neutral-200 pb-2 mb-3">Nearby Resources</h3>
                          <div className="space-y-3">
                             {units.filter(u => u.status === 'IDLE').slice(0,3).map(u => (
                                 <div key={u._id} className="flex justify-between items-center p-3 border border-neutral-200 hover:border-[#111] transition bg-white group cursor-pointer shadow-sm" onClick={() => handleDeploy(u._id, selectedIncident)}>
                                     <div className="flex items-center gap-3">
                                         <div className={`w-3 h-3 rounded-full border border-white shadow-sm ${u.type === 'MEDIC' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                         <div>
                                            <div className="text-sm font-bold text-[#111]">{u.name}</div>
                                            <div className="text-[9px] font-data text-neutral-400">{u.type} • 2 MIN ETA</div>
                                         </div>
                                     </div>
                                     <span className="text-[10px] font-bold uppercase bg-[#111] text-white px-2 py-1 opacity-0 group-hover:opacity-100 transition">Deploy</span>
                                 </div>
                             ))}
                             {units.filter(u => u.status === 'IDLE').length === 0 && (
                               <div className="text-xs text-neutral-400 italic">No idle units available.</div>
                             )}
                          </div>
                      </div>
                  </div>
              </motion.div>
          )}
          </AnimatePresence>

          {/* OVERALL REPORT MODAL */}
          <AnimatePresence>
          {showReport && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-6"
                onClick={() => setShowReport(false)}
              >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }} 
                    animate={{ scale: 1, y: 0 }} 
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                      <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-purple-50 to-blue-50">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h2 className="text-2xl font-brand font-black text-[#111]">Overall Situation Analysis</h2>
                                  <p className="text-xs text-neutral-500 mt-1 font-data uppercase tracking-wider">Generated at {new Date().toLocaleString()}</p>
                              </div>
                              <button onClick={() => setShowReport(false)} className="p-2 hover:bg-neutral-200 rounded-full transition">
                                  <X className="w-5 h-5"/>
                              </button>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 rounded-lg border border-neutral-200">
                              <h3 className="text-sm font-bold text-[#111] uppercase mb-3 flex items-center gap-2">
                                  <Activity className="w-4 h-4"/> Executive Summary
                              </h3>
                              <p className="text-sm text-neutral-700 leading-relaxed">{showReport.executiveSummary}</p>
                          </div>

                          <div>
                              <h3 className="text-sm font-bold text-[#111] uppercase mb-3">Zone-Specific Analysis</h3>
                              <div className="space-y-3">
                                  {showReport.zoneAnalysis?.map((zone, idx) => (
                                      <div key={idx} className="bg-white border border-neutral-200 p-4 rounded-lg shadow-sm">
                                          <div className="flex justify-between items-start mb-2">
                                              <h4 className="font-bold text-neutral-800 text-sm">{zone.zoneName}</h4>
                                              <StatusBadge status={zone.status} />
                                          </div>
                                          <p className="text-xs text-neutral-600 leading-relaxed">{zone.recommendation}</p>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="bg-[#111] text-white p-6 rounded-lg border-l-4 border-purple-500">
                              <h3 className="text-sm font-bold uppercase mb-3 flex items-center gap-2">
                                  <Target className="w-4 h-4"/> Recommended Actions
                              </h3>
                              <ul className="space-y-2 text-sm">
                                  {showReport.recommendations?.map((rec, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                          <span className="text-purple-400 font-bold">•</span>
                                          <span>{rec}</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
          </AnimatePresence>
      </div>
    </div>
  );
}