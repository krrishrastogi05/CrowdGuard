require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

// --- MODELS ---
const IncidentSchema = new mongoose.Schema({
  type: { type: String, default: "CROWD_ANOMALY" },
  riskLevel: { type: String, enum: ['SAFE', 'MODERATE', 'CRITICAL'], default: 'SAFE' },
  densityScore: Number,
  location: { id: String, name: String, x: Number, y: Number }, 
  description: String,
  anomalies: [String],
  suggestedAction: String,
  status: { type: String, default: 'ACTIVE' }, 
  assignedUnit: { type: Object, default: null }, 
  timestamp: { type: Date, default: Date.now }
});
const Incident = mongoose.model('Incident', IncidentSchema);

const UnitSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['STEWARD', 'MEDIC', 'DRONE', 'POLICE'] },
  status: { type: String, enum: ['IDLE', 'DEPLOYED', 'BUSY'], default: 'IDLE' },
  location: { x: Number, y: Number }, 
  assignedIncident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' }
});
const Unit = mongoose.model('Unit', UnitSchema);

// --- SERVER SETUP ---
const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json({ limit: '50mb' }));

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aegis_db')
  .then(() => console.log("✅ AEGIS Database Online"))
  .catch(err => console.error("❌ DB Error:", err));


function cleanAIResponse(text) {
  
  let cleaned = text.replace(/``````\n?/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
 
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  return cleaned;
}


app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, promptContext, taskType } = req.body;
    
    let systemInstruction = taskType === 'ADVISORY' 
        ? `You are AEGIS Public Safety AI. Write a short, urgent 280-character alert based on the context. 
        
        Return ONLY valid JSON without any markdown formatting:
        { "text": "message" }`
        : `You are AEGIS Crowd Analysis AI specialized in stadium surveillance and threat detection.

**CRITICAL INSTRUCTIONS:**
1. Analyze the provided CCTV footage/image for crowd anomalies and security threats
2. Be SPECIFIC about locations - mention exact camera IDs, zones, or landmarks visible in the footage
3. Describe WHAT you see, WHERE you see it, and WHY it's concerning
4. Provide ACTIONABLE strategies based on the overall venue layout
5. Return ONLY valid JSON without any markdown code blocks or extra formatting

**Output Format (MUST be valid JSON only):**
{
  "riskLevel": "SAFE"|"MODERATE"|"CRITICAL",
  "densityScore": 1-10,
  "description": "Specific description mentioning: 'CCTV Camera [ID/Location] detected [specific threat/anomaly] at [exact location/zone]. Observed [specific details like crowd size, behavior patterns, blocked pathways, etc.]'",
  "anomalies": ["Specific observable anomaly 1", "Specific observable anomaly 2"],
  "suggestedAction": "Strategic response considering entire venue: 'Deploy [specific units] to [exact location]. Redirect crowd flow from [overcrowded zone] to [alternative exit/zone]. Activate [specific protocol]. Monitor [related zones] for spillover effects. [Additional venue-wide coordination steps]'"
}

**Example Good Description:**
"CCTV Camera NE-07 at North Stands detected severe crowd density (estimated 450+ persons in 200-capacity section). Observed pushing behavior near rows 15-18, multiple individuals stumbling, blocked stairway access at Gate NE exit."

**Example Bad Description (DO NOT DO THIS):**
"Visual threat detected showing crowd issues"

**Example Good Strategy:**
"Deploy MEDIC-1 and STEWARD units Alpha & Bravo to North Stands rows 15-20 immediately. Activate emergency announcements directing North Stand occupants to exit via Gate NW (currently at 40% capacity). Close Gate NE entry temporarily. Redirect incoming traffic to East Wing. Position DRONE-1 for aerial crowd flow monitoring between North and East sections. Alert Gate SE and SW staff to prepare for potential crowd redistribution."

**Example Bad Strategy (DO NOT DO THIS):**
"Deploy units to handle the situation"

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no code blocks, no extra text.`;

    const parts = [
      { text: systemInstruction }, 
      { text: `CONTEXT FROM SURVEILLANCE SYSTEM: ${promptContext}` }
    ];
    
    if (imageBase64) {
      parts.push({ 
        inlineData: { 
          data: imageBase64, 
          mimeType: "image/jpeg" 
        } 
      });
    }

    const result = await model.generateContent({ 
      contents: [{ role: 'user', parts }] 
    });
    
    const rawText = result.response.text();
    const cleanedText = cleanAIResponse(rawText);
    
    try { 
      const jsonResponse = JSON.parse(cleanedText);
      res.json(jsonResponse);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw AI Response:", rawText);
      console.error("Cleaned Text:", cleanedText);
      
      // Fallback response
      res.json({ 
        text: cleanedText,
        riskLevel: "MODERATE",
        densityScore: 5,
        description: "AI response parsing failed. Manual review required.",
        anomalies: ["System Error"],
        suggestedAction: "Review raw surveillance data manually."
      });
    }
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.json({ 
      riskLevel: "CRITICAL", 
      densityScore: 9, 
      description: "AI Offline - Manual Protocol Required. System detected anomaly but cannot process details.", 
      anomalies: ["AI System Failure"],
      suggestedAction: "Initiate manual assessment protocol. Deploy nearest available units for visual inspection."
    });
  }
});


app.post('/api/generate-report', async (req, res) => {
  const { incidents } = req.body; 
  
  try {
    if (!incidents || incidents.length === 0) {
      return res.json({
        executiveSummary: "No active incidents detected. All zones operating within normal parameters.",
        zoneAnalysis: [],
        recommendations: ["Continue standard monitoring protocols"]
      });
    }

  
    const incidentSummary = incidents.map(inc => ({
      zone: inc.location?.name || 'Unknown',
      risk: inc.riskLevel,
      density: inc.densityScore,
      description: inc.description,
      type: inc.type
    }));

    const reportPrompt = `You are AEGIS Strategic Command AI. Analyze ALL incidents across the entire venue and provide a comprehensive situational report.

**INCIDENT DATA:**
${JSON.stringify(incidentSummary, null, 2)}

**STADIUM ZONES REFERENCE:**
- North Stands
- South Stands
- East Wing
- West Wing
- Field Play Area
- Gate NE, Gate NW, Gate SE, Gate SW

**REQUIRED OUTPUT:**
Return ONLY valid JSON without markdown code blocks or formatting. The JSON must have this exact structure:

{
  "executiveSummary": "2-3 sentence overview of overall venue status, total incidents, highest risk zones, and general crowd flow status",
  "zoneAnalysis": [
    {
      "zoneName": "Exact zone name from incident data",
      "status": "CRITICAL or MODERATE or SAFE",
      "recommendation": "Specific action for this zone considering its relationship to other zones"
    }
  ],
  "recommendations": [
    "Strategic venue-wide action 1",
    "Strategic venue-wide action 2",
    "Resource allocation recommendation"
  ]
}

**IMPORTANT GUIDELINES:**
- Consider how incidents in one zone affect others
- Recommend crowd redistribution from overcrowded zones to underutilized ones
- Think about the entire venue as a connected system
- Be specific about which gates to use for redirections
- Return ONLY the JSON object, no markdown, no code blocks, no extra text`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: reportPrompt }] }]
    });

    const rawText = result.response.text();
    const cleanedText = cleanAIResponse(rawText);
    
    console.log("Raw Report Response:", rawText.substring(0, 200) + "...");
    console.log(" Cleaned Report:", cleanedText.substring(0, 200) + "...");
    
    try {
      const report = JSON.parse(cleanedText);
      res.json(report);
    } catch (parseError) {
      console.error("Report JSON Parse Error:", parseError);
      console.error("Cleaned Text:", cleanedText);
      
     
      throw parseError; 
    }
    
  } catch (error) {
    console.error("Report Generation Error:", error);
    
   
    res.json({
      executiveSummary: `Report generation encountered an error. ${incidents.length} active incidents detected across venue requiring manual assessment.`,
      zoneAnalysis: incidents.map(inc => ({
        zoneName: inc.location?.name || "Unknown Zone",
        status: inc.riskLevel || "MODERATE",
        recommendation: `Manual assessment required for ${inc.location?.name}. Density score: ${inc.densityScore}/10. Current status: ${inc.status}.`
      })),
      recommendations: [
        "Review all active incidents manually via the dashboard",
        "Deploy available units to highest risk zones first",
        "Monitor real-time CCTV feeds for the affected areas",
        "Prepare backup evacuation routes if crowd density increases"
      ]
    });
  }
});

// 3. INCIDENTS
app.post('/api/incidents', async (req, res) => {
  const incident = await Incident.create(req.body);
  io.emit('alert', { type: 'NEW_INCIDENT', data: incident });
  res.json(incident);
});

app.get('/api/incidents', async (req, res) => {
  const incidents = await Incident.find({ status: { $ne: 'RESOLVED' } }).sort({ timestamp: -1 });
  res.json(incidents);
});

// 4. UNITS (CRUD)
app.get('/api/units', async (req, res) => {
  let units = await Unit.find();
  if(units.length === 0) {
    units = await Unit.insertMany([
        { name: "Alpha", type: "STEWARD", location: { x: 15, y: 15 } },
        { name: "Bravo", type: "STEWARD", location: { x: 85, y: 85 } },
        { name: "Medic-1", type: "MEDIC", location: { x: 50, y: 90 } },
        { name: "Drone-1", type: "DRONE", location: { x: 50, y: 50 } }
    ]);
  }
  res.json(units);
});

app.post('/api/units', async (req, res) => {
  const unit = await Unit.create(req.body);
  io.emit('unit_added', unit);
  res.json(unit);
});

app.delete('/api/units/:id', async (req, res) => {
  await Unit.findByIdAndDelete(req.params.id);
  io.emit('unit_deleted', req.params.id);
  res.json({ success: true });
});

// DEPLOY UNIT
app.post('/api/units/deploy', async (req, res) => {
  const { unitId, targetX, targetY, incidentId } = req.body;
  
  const unit = await Unit.findByIdAndUpdate(
    unitId, 
    { 
      status: 'DEPLOYED', 
      location: { x: targetX, y: targetY }, 
      assignedIncident: incidentId 
    }, 
    { new: true }
  );
  
  io.emit('unit_update', unit);
  
  if (incidentId) {
     const incident = await Incident.findByIdAndUpdate(
       incidentId, 
       { 
         status: 'DISPATCHED', 
         assignedUnit: unit 
       }, 
       { new: true }
     );
     io.emit('alert', { type: 'INCIDENT_UPDATE', data: incident });
  }
  
  res.json(unit);
});

// 5. RESET
app.post('/api/reset', async (req, res) => {
  await Incident.deleteMany({});
  await Unit.deleteMany({});
  io.emit('system_reset');
  res.json({ success: true });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Aegis Backend Active on Port ${PORT}`));
