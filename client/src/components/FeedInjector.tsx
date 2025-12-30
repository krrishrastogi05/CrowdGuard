import  { useState, useEffect } from 'react';
import { Upload, Mic, Camera, Send, MapPin, Activity, ArrowLeft, Target, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { analyzeScenario, API_URL } from '../services/gemini';

// Updated locations matching the Dashboard's new Complex Stadium
const LOCATIONS = [
  { group: "FIELD LEVEL", items: [
    { id: 'field', name: 'PLAYING FIELD', x: 50, y: 50 },
    { id: 'tunnel-n', name: 'NORTH TUNNEL', x: 50, y: 37 },
    { id: 'tunnel-s', name: 'SOUTH TUNNEL', x: 50, y: 63 },
  ]},
  { group: "LOWER BOWL", items: [
    { id: 'sec-101', name: 'SEC 101 (North)', x: 50, y: 30 },
    { id: 'sec-102', name: 'SEC 102 (East)', x: 72, y: 50 },
    { id: 'sec-103', name: 'SEC 103 (South)', x: 50, y: 70 },
    { id: 'sec-104', name: 'SEC 104 (West)', x: 28, y: 50 },
  ]},
  { group: "VIP & CLUB", items: [
    { id: 'club-n', name: 'NORTH CLUB', x: 50, y: 20 },
    { id: 'club-s', name: 'SOUTH CLUB', x: 50, y: 80 },
    { id: 'suite-e', name: 'EAST SUITES', x: 85, y: 50 },
    { id: 'suite-w', name: 'WEST SUITES', x: 15, y: 50 },
  ]},
  { group: "GATES", items: [
    { id: 'gate-nw', name: 'GATE NW', x: 18, y: 15 },
    { id: 'gate-ne', name: 'GATE NE', x: 82, y: 15 },
    { id: 'gate-sw', name: 'GATE SW', x: 18, y: 85 },
    { id: 'gate-se', name: 'GATE SE', x: 82, y: 85 },
  ]}
];

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500&display=swap');
  
  .font-brand { font-family: 'Playfair Display', serif; }
  .font-ui { font-family: 'Inter', sans-serif; }
  .font-data { font-family: 'JetBrains Mono', monospace; }
  
  .pattern-grid {
    background-image: linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center center;
    opacity: 0.05;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1e293b;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
`;

export default function FeedInjector() {
  const [selectedLoc, setSelectedLoc] = useState(LOCATIONS[1].items[0]);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'VISUAL' | 'AUDIO'>('VISUAL');
  const [status, setStatus] = useState('IDLE');

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = fontStyles;
    document.head.appendChild(styleSheet);
    
    // Cleanup function to avoid duplicate styles if component remounts
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleInject = async () => {
    if (!file && status !== 'SIMULATING') return;
    setStatus('ANALYZING');

    try {
      const analysis = await analyzeScenario(file, `
        Context: Large Scale Concert Venue. Location: ${selectedLoc.name}.
        Input Type: ${mode}.
        Task: Detect Crowd Safety Threats (Crush, Panic, Fight, Medical Emergency).
        Output: Risk Level (LOW/MEDIUM/CRITICAL/HIGH), Density Score (1-10), Explanation.
      `);

      await fetch(`${API_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...analysis,
          location: { x: selectedLoc.x, y: selectedLoc.y, name: selectedLoc.name, id: selectedLoc.id },
          type: mode === 'AUDIO' ? 'ACOUSTIC ALERT' : 'VISUAL THREAT',
          timestamp: new Date()
        })
      });

      setStatus('SENT');
      setTimeout(() => setStatus('IDLE'), 2000);
    } catch (e) {
      console.error(e);
      setStatus('ERROR');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#111] font-ui">
      {/* HEADER */}
      <div className="h-16 bg-white border-b border-neutral-300 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#111]" />
            <div>
              <h1 className="text-2xl font-brand font-black tracking-tight text-[#111] leading-none">CrowdGuard</h1>
              <div className="text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase">Field Simulator</div>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-neutral-200"></div>
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <Activity className="w-3 h-3 text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Live Injection Mode</span>
          </div>
        </div>
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 hover:border-neutral-400 rounded text-xs font-bold uppercase tracking-wider transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Command Center
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="absolute inset-0 pattern-grid pointer-events-none"></div>
        
        <div className="w-full max-w-5xl bg-white border border-neutral-300 rounded-lg shadow-2xl relative z-10 overflow-hidden">
          
          {/* STATUS BAR */}
          <div className="h-1 bg-neutral-200">
            <div 
              className={`h-full transition-all duration-300 ${
                status === 'ANALYZING' ? 'bg-blue-500 w-2/3' :
                status === 'SENT' ? 'bg-green-500 w-full' :
                status === 'ERROR' ? 'bg-red-500 w-full' :
                'bg-neutral-300 w-0'
              }`}
            ></div>
          </div>

          <div className="p-8 grid grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: Location & Mode */}
            <div className="space-y-6">
              
              {/* SECTOR SELECTOR */}
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
                  <MapPin className="w-4 h-4"/> Target Sector
                </label>
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {LOCATIONS.map(group => (
                    <div key={group.group} className="p-4 border-b border-neutral-200 last:border-b-0">
                      <div className="text-[10px] font-black text-neutral-400 tracking-widest mb-3">{group.group}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map(loc => (
                          <button 
                            key={loc.id} 
                            onClick={() => setSelectedLoc(loc)}
                            className={`text-[11px] font-bold py-3 px-3 rounded border transition text-left flex items-center justify-between ${
                              selectedLoc.id === loc.id 
                                ? 'bg-[#111] border-[#111] text-white shadow-md' 
                                : 'bg-white border-neutral-300 text-neutral-600 hover:border-neutral-400'
                            }`}
                          >
                            <span className="truncate">{loc.name.split('(')[0]}</span>
                            {selectedLoc.id === loc.id && <Target className="w-3 h-3 flex-shrink-0 ml-2"/>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MODE SELECTOR */}
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 block">
                  Input Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setMode('VISUAL')} 
                    className={`py-4 rounded border text-sm font-bold flex flex-col items-center justify-center gap-2 transition ${
                      mode === 'VISUAL' 
                        ? 'bg-blue-600 border-blue-700 text-white shadow-lg' 
                        : 'bg-white border-neutral-300 text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    <Camera className="w-6 h-6"/> 
                    <span className="text-xs uppercase tracking-wider">Visual Feed</span>
                  </button>
                  <button 
                    onClick={() => setMode('AUDIO')} 
                    className={`py-4 rounded border text-sm font-bold flex flex-col items-center justify-center gap-2 transition ${
                      mode === 'AUDIO' 
                        ? 'bg-blue-600 border-blue-700 text-white shadow-lg' 
                        : 'bg-white border-neutral-300 text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    <Mic className="w-6 h-6"/> 
                    <span className="text-xs uppercase tracking-wider">Audio Feed</span>
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Upload & Action */}
            <div className="flex flex-col">
              
              {/* UPLOAD AREA */}
              <div className="flex-1 mb-6">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 block">
                  Evidence Upload
                </label>
                <label className="h-full min-h-[300px] border-2 border-dashed border-neutral-300 bg-neutral-50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition group">
                  {file ? (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {mode === 'VISUAL' ? <Camera className="w-8 h-8 text-blue-600"/> : <Mic className="w-8 h-8 text-blue-600"/>}
                      </div>
                      <div className="text-blue-600 font-bold text-sm mb-1 break-all px-4">{file.name}</div>
                      <div className="text-xs text-neutral-500">{(file.size/1024).toFixed(1)} KB • Ready for Analysis</div>
                      <div className="mt-4 text-[10px] text-neutral-400 uppercase tracking-wider">Click to Replace</div>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <Upload className="w-12 h-12 text-neutral-400 group-hover:text-blue-500 mb-4 mx-auto transition" />
                      <div className="text-sm font-bold text-neutral-600 group-hover:text-blue-600 transition mb-2">Upload Evidence File</div>
                      <div className="text-xs text-neutral-400">
                        {mode === 'VISUAL' ? 'Images (JPG, PNG, WEBP)' : 'Audio (MP3, WAV, M4A)'}
                      </div>
                      <div className="mt-4 text-[10px] text-neutral-400 uppercase tracking-wider">Click or Drag File</div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept={mode === 'VISUAL' ? 'image/*' : 'audio/*'}
                    onChange={e => setFile(e.target.files?.[0] || null)} 
                  />
                </label>
              </div>

              {/* STATUS DISPLAY */}
              {status !== 'IDLE' && (
                <div className={`mb-4 p-3 rounded border text-xs font-bold text-center ${
                  status === 'ANALYZING' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                  status === 'SENT' ? 'bg-green-50 border-green-200 text-green-700' :
                  'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {status === 'ANALYZING' && '⚡ AI Analysis in Progress...'}
                  {status === 'SENT' && '✓ Successfully Transmitted to Command Center'}
                  {status === 'ERROR' && '✗ Transmission Failed - Retry Required'}
                </div>
              )}

              {/* ACTION BUTTON */}
              <button 
                onClick={handleInject}
                disabled={status === 'ANALYZING' || (!file && status !== 'SIMULATING')}
                className={`
                  w-full py-5 rounded-lg font-black text-sm tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all uppercase
                  ${status === 'SENT' ? 'bg-green-600 hover:bg-green-700 text-white' : 
                    status === 'ANALYZING' ? 'bg-neutral-400 text-neutral-200 cursor-not-allowed' : 
                    !file ? 'bg-neutral-300 text-neutral-400 cursor-not-allowed' :
                    'bg-red-600 hover:bg-red-700 text-white hover:scale-[1.02]'}
                `}
              >
                {status === 'ANALYZING' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing
                  </>
                ) : status === 'SENT' ? (
                  <>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Transmitted Successfully
                  </>
                ) : (
                  <>
                    Inject to Command Center
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* SELECTED INFO */}
              <div className="mt-4 p-4 bg-neutral-50 rounded border border-neutral-200">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Current Configuration</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 font-medium">Target:</span>
                    <div className="font-bold text-[#111] font-data mt-0.5">{selectedLoc.name}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-medium">Mode:</span>
                    <div className="font-bold text-[#111] font-data mt-0.5">{mode} FEED</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}