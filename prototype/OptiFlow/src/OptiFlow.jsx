import { useState, useEffect, useRef, useCallback } from "react";

// ─── MOCK DATA STORE ──────────────────────────────────────────────────────────
let PATIENT_DB = [];
let NEXT_TOKEN = 1;

function generateToken() { return `T-${String(NEXT_TOKEN++).padStart(3,"0")}`; }
function generateId() { return Math.random().toString(36).substr(2,9); }

// ─── MOCK AI TRIAGE ───────────────────────────────────────────────────────────
const SPECIALTY_MAP = {
  "Retina": ["Flashes of light","Floaters","Sudden vision loss","Curtain over vision"],
  "Glaucoma": ["Eye pressure","Tunnel vision","Halos around lights","Frequent headaches"],
  "Cornea": ["Eye redness","Foreign body sensation","Sensitivity to light","Eye discharge"],
  "Paediatric": ["Child squinting","Child rubbing eyes","Crossed eyes","Lazy eye"],
  "Cataract": ["Cloudy vision","Glare sensitivity","Faded colours","Night vision problems"],
  "Oculoplasty": ["Drooping eyelid","Eye swelling","Tearing problem","Eyelid lump"],
};

const DILATION_TRIGGERS = new Set(["Floaters","Sudden vision loss","Flashes of light","Curtain over vision","Cloudy vision","Glare sensitivity"]);

function aiTriagePatient(symptoms, conditions) {
  let bestSpecialty = "General OPD";
  let bestScore = 0;
  for (const [spec, triggers] of Object.entries(SPECIALTY_MAP)) {
    const score = symptoms.filter(s => triggers.includes(s)).length;
    if (score > bestScore) { bestScore = score; bestSpecialty = spec; }
  }
  const needsDilation = symptoms.some(s => DILATION_TRIGGERS.has(s)) ||
    conditions.includes("Diabetes") || conditions.includes("Hypertension");
  const urgency = symptoms.includes("Sudden vision loss") || symptoms.includes("Curtain over vision") ? "HIGH" :
    bestScore >= 2 ? "MEDIUM" : "NORMAL";
  return { specialty: bestSpecialty, needsDilation, urgency, confidence: Math.min(60 + bestScore * 12, 96) };
}

// ─── MOCK AI CHATBOT ──────────────────────────────────────────────────────────
const RAG_KB = [
  { t: ["cataract","cloudy","lens"], r: "A cataract is a clouding of the eye's natural lens. It develops slowly and surgery (phacoemulsification) is the only cure — a 15-minute procedure with very high success rates. Most patients see clearly the very next day! 👁️" },
  { t: ["glaucoma","pressure","nerve"], r: "Glaucoma is increased eye pressure that damages the optic nerve. It's called the 'silent thief of sight' because it has no early symptoms. The good news: with daily eye drops or laser treatment, progression can be stopped completely." },
  { t: ["retina","floater","flash"], r: "Retinal issues like floaters and flashes can sometimes indicate a retinal tear or detachment — a medical urgency. Our retina specialist will examine the back of your eye with a dilated exam. Don't panic — most floaters are benign!" },
  { t: ["dialat","dilation","drop"], r: "Dilation drops widen your pupils so the doctor can see the back of your eye clearly. Your vision will be blurry for 2–4 hours and you'll be sensitive to bright light. Please arrange a driver for after your visit today 🚗" },
  { t: ["surgery","operation","scared","fear"], r: "It's completely natural to feel anxious before eye surgery! Our surgeries are done under local anaesthesia — you'll be awake but feel no pain. The procedure typically takes 10–20 minutes. Thousands of patients have surgery here every year with excellent outcomes 💙" },
  { t: ["how long","wait","time"], r: "Based on current queue, estimated wait is 15–30 minutes. Our counsellor will explain everything in detail. Use this time to ask me anything — I'm here to help you feel prepared and calm! 😊" },
  { t: ["cost","price","money","fee"], r: "Our billing team will give you a full cost breakdown. Government scheme (CGHS/ESI) and insurance cashless options are available. Don't hesitate to ask the billing desk about payment plans." },
  { t: ["diabetes","sugar"], r: "Diabetic patients need regular retinal screening as diabetes can damage the tiny blood vessels in the retina (diabetic retinopathy). The good news is that if caught early, laser treatment can prevent vision loss effectively." },
  { t: ["hi","hello","hey","help"], r: "Hello! I'm OptiBot 🤖 — your AI eye care assistant. I'm here to answer your questions while you wait for the counsellor. Ask me about your diagnosis, what to expect, surgery details, or anything else on your mind!" },
];
function chatbotReply(msg) {
  const low = msg.toLowerCase();
  for (const e of RAG_KB) if (e.t.some(t => low.includes(t))) return e.r;
  return "That's a great question! Our counsellor will be able to give you a detailed, personalised answer shortly. Is there anything else I can help you understand while you wait? 😊";
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  patient:  { primary: "#0ea5e9", light: "#e0f2fe", dark: "#0369a1", bg: "#f0f9ff" },
  nurse:    { primary: "#10b981", light: "#d1fae5", dark: "#065f46", bg: "#f0fdf4" },
  doctor:   { primary: "#8b5cf6", light: "#ede9fe", dark: "#4c1d95", bg: "#faf5ff" },
  pharmacy: { primary: "#f59e0b", light: "#fef3c7", dark: "#92400e", bg: "#fffbeb" },
  admin:    { primary: "#e11d48", light: "#ffe4e6", dark: "#881337", bg: "#fff1f2" },
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GlobalCSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #f8fafc; color: #1e293b; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.5;} }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
    @keyframes bounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-4px);} }
    @keyframes ticker { 0%{transform:translateX(100%);} 100%{transform:translateX(-100%);} }
    .slide-up { animation: slideUp 0.4s ease forwards; }
    .fade-in { animation: fadeIn 0.3s ease forwards; }
    .pulse-dot { animation: pulse 1.5s infinite; }
    .spin { animation: spin 1s linear infinite; }
    .bounce { animation: bounce 0.6s ease infinite; }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
      border: 1px solid #f1f5f9;
    }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 10px; font-size: 14px;
      font-weight: 600; cursor: pointer; border: none;
      transition: all 0.18s ease; font-family: 'Outfit', sans-serif;
    }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .btn:active { transform: translateY(0); }
    .btn-primary { background: #0ea5e9; color: white; }
    .btn-green { background: #10b981; color: white; }
    .btn-purple { background: #8b5cf6; color: white; }
    .btn-amber { background: #f59e0b; color: white; }
    .btn-ghost { background: #f1f5f9; color: #475569; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-rose { background: #e11d48; color: white; }
    .input {
      width: 100%; padding: 10px 14px; border-radius: 10px;
      border: 1.5px solid #e2e8f0; font-size: 14px; font-family: 'Outfit',sans-serif;
      outline: none; transition: border 0.18s;
    }
    .input:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,.1); }
    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700;
      letter-spacing: .3px; text-transform: uppercase;
    }
    .tag-high { background: #fee2e2; color: #dc2626; }
    .tag-medium { background: #fef3c7; color: #d97706; }
    .tag-normal { background: #dcfce7; color: #16a34a; }
    .tag-dilation { background: #dbeafe; color: #2563eb; }
    .tag-status { background: #f1f5f9; color: #475569; }
    .divider { height: 1px; background: #f1f5f9; margin: 16px 0; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; flex-shrink: 0;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .mb-3 { margin-bottom: 12px; }
    .p-3 { padding: 12px; }
    .p-4 { padding: 16px; }
    .p-5 { padding: 20px; }
    .text-sm { font-size: 13px; }
    .text-xs { font-size: 11px; }
    .text-lg { font-size: 18px; }
    .text-xl { font-size: 22px; }
    .text-2xl { font-size: 28px; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .text-gray { color: #64748b; }
    .text-dark { color: #1e293b; }
    .w-full { width: 100%; }
    .rounded { border-radius: 10px; }
    .overflow-hidden { overflow: hidden; }
    select.input { appearance: none; cursor: pointer; }
    textarea.input { resize: vertical; min-height: 80px; }

    /* Admin specific */
    .timeline-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
    .timeline-line { width:2px; background:#e2e8f0; flex-shrink:0; margin: 2px 5px; }
    .status-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700;
      white-space: nowrap;
    }
    .admin-table th {
      background: #f8fafc; font-size: 11px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: .5px; padding: 10px 14px;
      text-align: left; border-bottom: 1px solid #f1f5f9;
    }
    .admin-table td {
      padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #f8fafc;
      vertical-align: middle;
    }
    .admin-table tr:hover td { background: #fafcff; }
    .admin-table tr:last-child td { border-bottom: none; }
    .progress-bar { height: 6px; border-radius: 3px; background: #f1f5f9; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
    .live-badge {
      display:inline-flex; align-items:center; gap:5px;
      background: #dcfce7; color: #16a34a; border-radius:100px;
      padding: 3px 10px; font-size: 11px; font-weight: 700;
    }
    .stat-card {
      background: white; border-radius: 14px; padding: 18px 20px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0,0,0,.05);
    }
    .drawer-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.4);
      z-index: 200; display: flex; justify-content: flex-end;
      animation: fadeIn 0.2s ease;
    }
    .drawer {
      background: white; width: 100%; max-width: 480px; height: 100%;
      overflow-y: auto; padding: 28px 24px;
      animation: slideUp 0.25s ease;
      box-shadow: -4px 0 32px rgba(0,0,0,.12);
    }
  `}</style>
);

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "REGISTERED":              { label: "Registered",         color: "#6366f1", bg: "#eef2ff", icon: "📝", step: 1 },
  "DILATING":                { label: "Dilating",           color: "#0ea5e9", bg: "#e0f2fe", icon: "💧", step: 2 },
  "SCAN_ORDERED":            { label: "Scan Ordered",       color: "#f59e0b", bg: "#fef3c7", icon: "🔬", step: 2 },
  "SCAN_PAID":               { label: "Scan Paid",          color: "#10b981", bg: "#d1fae5", icon: "✅", step: 3 },
  "WITH_DOCTOR":             { label: "With Doctor",        color: "#8b5cf6", bg: "#ede9fe", icon: "🩺", step: 3 },
  "COUNSELLOR":              { label: "Counsellor",         color: "#ec4899", bg: "#fce7f3", icon: "💬", step: 4 },
  "PHARMACY_PENDING_PAYMENT":{ label: "Pharmacy Payment",   color: "#f97316", bg: "#ffedd5", icon: "💳", step: 4 },
  "PHARMACY_PAID":           { label: "Pharmacy Packing",   color: "#f59e0b", bg: "#fef3c7", icon: "📦", step: 5 },
  "COMPLETED":               { label: "Completed",          color: "#16a34a", bg: "#dcfce7", icon: "🎉", step: 6 },
};

const JOURNEY_STEPS = [
  { step: 1, label: "Registered" },
  { step: 2, label: "Assessment" },
  { step: 3, label: "Doctor" },
  { step: 4, label: "Billing/Rx" },
  { step: 5, label: "Pharmacy" },
  { step: 6, label: "Complete" },
];

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || { label: status, color: "#64748b", bg: "#f1f5f9", icon: "⏳", step: 1 };
}

function getJourneyProgress(status) {
  const cfg = getStatusConfig(status);
  return Math.round(((cfg.step - 1) / 5) * 100);
}

function timeSince(date) {
  if (!date) return "—";
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins/60)}h ${mins%60}m ago`;
}

function formatTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── ROLE SELECTOR ────────────────────────────────────────────────────────────
function RoleSelector({ onSelect }) {
  const roles = [
    { id: "patient",  icon: "🧑‍⚕️", label: "Patient",      sub: "Check-in, pay, track your visit",         color: S.patient },
    { id: "nurse",    icon: "👩‍⚕️", label: "Nurse",        sub: "Manage queue, triage alerts, scans",      color: S.nurse },
    { id: "doctor",   icon: "🩺",   label: "Doctor",       sub: "View patients, diagnose, prescribe",       color: S.doctor },
    { id: "pharmacy", icon: "💊",   label: "Pharmacy",     sub: "Pre-pack meds, manage Rx queue",           color: S.pharmacy },
    { id: "admin",    icon: "🖥️",   label: "Reception",    sub: "All patients, live tracking, search",      color: S.admin },
  ];
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px" }}>
      <div style={{ textAlign:"center", marginBottom:"48px" }} className="slide-up">
        <div style={{ fontSize:56, marginBottom:8 }}>👁️</div>
        <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(36px,6vw,64px)", color:"white", letterSpacing:"-1px", lineHeight:1.1 }}>
          Opti<span style={{ color:"#38bdf8" }}>Flow</span>
        </h1>
        <p style={{ color:"#94a3b8", fontSize:16, marginTop:12, fontWeight:400 }}>
          Sankara Eye Hospital · Smart Patient Flow System
        </p>
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:16, flexWrap:"wrap" }}>
          {["M1: Smart Entry","M2: Pay Where You Stand","M3: AI Counsellor","M4: Click & Collect","M5: Reception Tracker"].map((m,i) => (
            <span key={i} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"#94a3b8", borderRadius:100, padding:"4px 12px", fontSize:11, fontWeight:600 }}>{m}</span>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, width:"100%", maxWidth:1050 }}>
        {roles.map((r, i) => (
          <button key={r.id} onClick={() => onSelect(r.id)}
            style={{ background:"rgba(255,255,255,.04)", border:`1px solid rgba(255,255,255,.1)`, borderRadius:20, padding:"28px 24px", cursor:"pointer", textAlign:"left", transition:"all 0.2s", color:"white", fontFamily:"'Outfit',sans-serif", animationDelay: `${i*0.08}s` }}
            className="slide-up"
            onMouseEnter={e => { e.currentTarget.style.background=`rgba(${r.color.primary.slice(1).match(/../g).map(x=>parseInt(x,16)).join(",")},0.15)`; e.currentTarget.style.borderColor=r.color.primary; e.currentTarget.style.transform="translateY(-4px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; e.currentTarget.style.transform="translateY(0)"; }}
          >
            <div style={{ fontSize:40, marginBottom:12 }}>{r.icon}</div>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>{r.label}</div>
            <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.5 }}>{r.sub}</div>
            <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:6, color:r.color.primary, fontSize:13, fontWeight:600 }}>
              Enter as {r.label} <span>→</span>
            </div>
          </button>
        ))}
      </div>
      <p style={{ color:"#475569", fontSize:12, marginTop:32 }}>
        🔒 Demo Mode — All data is simulated. No real patient data is used.
      </p>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ role, onBack, patients }) {
  const cfg = {
    patient:  { icon:"🧑‍⚕️", label:"Patient Portal",      color:S.patient.primary },
    nurse:    { icon:"👩‍⚕️", label:"Nurse Dashboard",      color:S.nurse.primary },
    doctor:   { icon:"🩺",   label:"Doctor's View",        color:S.doctor.primary },
    pharmacy: { icon:"💊",   label:"Pharmacy Counter",     color:S.pharmacy.primary },
    admin:    { icon:"🖥️",   label:"Reception Dashboard",  color:S.admin.primary },
  }[role];
  const activeCount = patients.filter(p => p.status !== "COMPLETED").length;
  const urgentCount = patients.filter(p => p.urgency === "HIGH").length;
  return (
    <div style={{ background:"white", borderBottom:"1px solid #f1f5f9", padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 8px rgba(0,0,0,.06)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onBack} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13, color:"#475569", fontFamily:"'Outfit',sans-serif" }}>← Roles</button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#1e293b" }}>{cfg.label}</div>
            <div style={{ fontSize:11, color:"#94a3b8" }}>Sankara Eye Hospital · OptiFlow v2.0</div>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {activeCount > 0 && <span className="badge tag-status">🔵 {activeCount} Active</span>}
        {role === "nurse" && urgentCount > 0 && (
            <span className="badge tag-high">🔴 {urgentCount} Urgent</span>
          )}
        <div style={{ width:32, height:32, borderRadius:"50%", background:cfg.color, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:14 }}>
          {cfg.icon}
        </div>
      </div>
    </div>
  );
}

// ─── MODULE 1: PATIENT VIEW ───────────────────────────────────────────────────
const SYMPTOMS = ["Flashes of light","Floaters","Sudden vision loss","Curtain over vision","Blurry vision","Eye redness","Double vision","Glare sensitivity","Night vision problems","Eye pain","Headache","Watering eyes","Foreign body sensation","Drooping eyelid","Child squinting"];
const CONDITIONS = ["Diabetes","Hypertension","Previous eye surgery","Glaucoma (family)","Cataract (family)","Wearing glasses/contacts","Trauma history"];

// ── Floating OptiBot (always visible after login) ────────────────────────────
function FloatingChatbot({ patientName }) {
  const [open, setOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role:"bot", text:`Hello${patientName ? ` ${patientName.split(" ")[0]}` : ""}! 👋 I'm OptiBot 🤖 — your AI eye care assistant. Ask me anything about your diagnosis, treatment, or surgery while you wait!` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const chatBottom = useRef(null);

  useEffect(() => { if (open) { chatBottom.current?.scrollIntoView({ behavior:"smooth" }); setUnread(0); } }, [chatHistory, typing, open]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatHistory(h => [...h, { role:"user", text:msg }]);
    setTyping(true);
    await new Promise(r => setTimeout(r, 700 + Math.random()*600));
    const reply = chatbotReply(msg);
    setChatHistory(h => [...h, { role:"bot", text:reply }]);
    setTyping(false);
    if (!open) setUnread(u => u + 1);
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position:"fixed", bottom:24, right:24, zIndex:500,
        width:60, height:60, borderRadius:"50%", border:"none",
        background:"linear-gradient(135deg,#0ea5e9,#0284c7)",
        boxShadow:"0 4px 20px rgba(14,165,233,.5)",
        cursor:"pointer", fontSize:26, display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
      >
        {open ? "✕" : "🤖"}
        {!open && unread > 0 && (
          <div style={{ position:"absolute", top:0, right:0, width:20, height:20, borderRadius:"50%", background:"#ef4444", color:"white", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid white" }}>{unread}</div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position:"fixed", bottom:96, right:24, zIndex:499,
          width:360, height:500, borderRadius:20, overflow:"hidden",
          boxShadow:"0 8px 40px rgba(0,0,0,.18)", display:"flex", flexDirection:"column",
          animation:"slideUp 0.25s ease",
        }}>
          {/* Header */}
          <div style={{ background:"linear-gradient(135deg,#0ea5e9,#0284c7)", padding:"14px 16px", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, color:"white" }}>
              <div style={{ fontSize:26 }}>🤖</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>OptiBot</div>
                <div style={{ fontSize:11, opacity:.85 }}>AI Eye Care Assistant · Always here</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80" }} className="pulse-dot" />
                <span style={{ opacity:.85 }}>Live</span>
              </div>
            </div>
            {/* Quick prompts */}
            <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
              {["Cataract?","Surgery?","Floaters?","Wait time?"].map(q => (
                <button key={q} onClick={() => setChatInput(q)} style={{ background:"rgba(255,255,255,.2)", border:"1px solid rgba(255,255,255,.3)", borderRadius:100, padding:"3px 10px", fontSize:11, color:"white", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{q}</button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:12, background:"#f8fafc", display:"flex", flexDirection:"column", gap:8 }}>
            {chatHistory.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }} className="fade-in">
                <div style={{
                  maxWidth:"85%", padding:"10px 14px",
                  borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
                  background:m.role==="user"?"#0ea5e9":"white",
                  color:m.role==="user"?"white":"#1e293b",
                  fontSize:13, lineHeight:1.55,
                  boxShadow:"0 1px 4px rgba(0,0,0,.08)"
                }}>{m.text}</div>
              </div>
            ))}
            {typing && (
              <div style={{ display:"flex" }}>
                <div style={{ background:"white", padding:"10px 14px", borderRadius:"14px 14px 14px 4px", boxShadow:"0 1px 4px rgba(0,0,0,.08)", display:"flex", gap:4, alignItems:"center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:7,height:7,borderRadius:"50%",background:"#94a3b8",animationDelay:`${i*0.15}s` }} className="bounce" />)}
                </div>
              </div>
            )}
            <div ref={chatBottom} />
          </div>

          {/* Input */}
          <div style={{ padding:"10px 12px", background:"white", borderTop:"1px solid #f1f5f9", display:"flex", gap:8 }}>
            <input
              className="input" style={{ flex:1, fontSize:13, padding:"8px 12px" }}
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && handleSend()}
              placeholder="Ask about your eye care..."
            />
            <button className="btn btn-primary" style={{ padding:"8px 14px", fontSize:13 }} onClick={handleSend} disabled={!chatInput.trim()}>↑</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main PatientView ──────────────────────────────────────────────────────────
function PatientView({ patients, setPatients }) {
  // Auth state: null = not logged in, object = logged-in patient profile
  const [authStep, setAuthStep] = useState("welcome"); // welcome | login | new_form | dashboard
  const [loggedInPhone, setLoggedInPhone] = useState(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // New patient form
  const [form, setForm] = useState({ name:"", age:"", phone:"", gender:"" });
  const [symptoms, setSymptoms] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Dashboard sub-step for logged-in patients
  const [dashTab, setDashTab] = useState("status"); // status | checkin

  const toggleCheck = (val, list, setList) => setList(p => p.includes(val) ? p.filter(x => x!==val) : [...p, val]);

  // Find all visits for this phone
  const myVisits = loggedInPhone ? patients.filter(p => p.phone === loggedInPhone) : [];
  // Most recent active visit
  const activeVisit = myVisits.find(p => p.status !== "COMPLETED") || myVisits[myVisits.length - 1] || null;

  // ── Handle login ──
  const handleLogin = async (phone) => {
    if (!phone || phone.length < 10) { setLoginError("Please enter a valid 10-digit phone number."); return; }
    setLoginLoading(true);
    setLoginError("");
    await new Promise(r => setTimeout(r, 800));
    setLoginLoading(false);
    setLoggedInPhone(phone);
    const existing = patients.find(p => p.phone === phone);
    if (existing) {
      setAuthStep("dashboard");
    } else {
      // New patient — pre-fill phone
      setForm(f => ({ ...f, phone }));
      setAuthStep("new_form");
    }
  };

  // ── Handle new registration ──
  const handleRegister = async () => {
    if (!form.name || !form.phone) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    const ai = aiTriagePatient(symptoms, conditions);
    const p = {
      id: generateId(), token: generateToken(), ...form,
      symptoms, conditions, ...ai,
      status: "REGISTERED", paymentStatus: "PENDING",
      scanOrdered: null, scanPaid: false, prescription: null,
      pharmacyReady: false, registeredAt: new Date(),
    };
    setPatients(prev => [...prev, p]);
    setSubmitting(false);
    setAuthStep("dashboard");
    setDashTab("status");
  };

  // ── Logout ──
  const handleLogout = () => {
    setLoggedInPhone(null);
    setAuthStep("welcome");
    setPhoneInput("");
    setForm({ name:"", age:"", phone:"", gender:"" });
    setSymptoms([]);
    setConditions([]);
  };

  // ══ WELCOME SCREEN ══════════════════════════════════════════════════════════
  if (authStep === "welcome") return (
    <div style={{ maxWidth:480, margin:"0 auto", padding:"40px 20px" }}>
      <div style={{ textAlign:"center", marginBottom:40 }} className="slide-up">
        <div style={{ fontSize:64, marginBottom:12 }}>👁️</div>
        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:32, color:"#1e293b", marginBottom:8 }}>Welcome to<br/>Sankara Eye Hospital</h2>
        <p style={{ color:"#64748b", fontSize:15 }}>Smart check-in · Skip the queue · Get seen faster</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
        <button onClick={() => setAuthStep("login")} style={{
          background:"linear-gradient(135deg,#0ea5e9,#0284c7)", border:"none", borderRadius:16,
          padding:"28px 20px", cursor:"pointer", color:"white", textAlign:"left", fontFamily:"'Outfit',sans-serif",
          transition:"all .2s",
        }}
          onMouseEnter={e => e.currentTarget.style.transform="translateY(-3px)"}
          onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
          className="slide-up"
        >
          <div style={{ fontSize:36, marginBottom:10 }}>🔄</div>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>Returning Patient</div>
          <div style={{ fontSize:12, opacity:.85, lineHeight:1.5 }}>Login with your phone number to track & manage your visit</div>
          <div style={{ marginTop:14, fontSize:12, fontWeight:700, opacity:.9 }}>Login with Phone →</div>
        </button>

        <button onClick={() => setAuthStep("login")} style={{
          background:"white", border:"2px solid #e2e8f0", borderRadius:16,
          padding:"28px 20px", cursor:"pointer", textAlign:"left", fontFamily:"'Outfit',sans-serif",
          transition:"all .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor="#0ea5e9"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor="#e2e8f0"; }}
          className="slide-up"
        >
          <div style={{ fontSize:36, marginBottom:10 }}>✨</div>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:4, color:"#1e293b" }}>New Patient</div>
          <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>Register now — takes 2 minutes. Get your token instantly.</div>
          <div style={{ marginTop:14, fontSize:12, fontWeight:700, color:"#0ea5e9" }}>Register Now →</div>
        </button>
      </div>

      <div className="card" style={{ padding:18 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#475569", marginBottom:10 }}>✨ OptiFlow Features</div>
        {[["📋","No paper forms — fill on your phone"],["🤖","AI assigns your specialist instantly"],["💳","Pay from your seat — no billing queue"],["💊","Medicines pre-packed before you arrive"]].map(([i,t]) => (
          <div key={t} style={{ display:"flex", gap:10, marginBottom:7, fontSize:13, color:"#475569" }}><span>{i}</span><span>{t}</span></div>
        ))}
      </div>
    </div>
  );

  // ══ LOGIN SCREEN ════════════════════════════════════════════════════════════
  if (authStep === "login") return (
    <div style={{ maxWidth:420, margin:"0 auto", padding:"40px 20px" }}>
      <div className="slide-up">
        <button onClick={() => setAuthStep("welcome")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#64748b", marginBottom:20, display:"flex", alignItems:"center", gap:4 }}>← Back</button>

        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#0ea5e9,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px" }}>📱</div>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:"#1e293b", marginBottom:8 }}>Enter Your Phone Number</h2>
          <p style={{ color:"#64748b", fontSize:14 }}>We'll check if you're a returning patient.<br/>New? We'll get you registered in 2 minutes.</p>
        </div>

        <div className="card" style={{ padding:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:8 }}>📞 PHONE NUMBER (your credential)</div>
          <input
            className="input"
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={phoneInput}
            onChange={e => { setPhoneInput(e.target.value.replace(/\D/g,"")); setLoginError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin(phoneInput)}
            style={{ fontSize:20, letterSpacing:2, textAlign:"center", fontWeight:700, marginBottom:8 }}
            maxLength={10}
            autoFocus
          />
          {loginError && <div style={{ color:"#ef4444", fontSize:13, marginBottom:8, textAlign:"center" }}>{loginError}</div>}

          <div style={{ fontSize:12, color:"#94a3b8", textAlign:"center", marginBottom:16 }}>
            {phoneInput.length > 0 && phoneInput.length < 10 && `${10 - phoneInput.length} more digit${10-phoneInput.length>1?"s":""} needed`}
            {phoneInput.length === 10 && "✅ Ready to continue"}
          </div>

          <button className="btn btn-primary w-full" style={{ justifyContent:"center", padding:"14px", fontSize:15 }}
            onClick={() => handleLogin(phoneInput)} disabled={loginLoading || phoneInput.length < 10}>
            {loginLoading ? <><span className="spin">⏳</span> Checking...</> : "Continue →"}
          </button>

          <div style={{ marginTop:16, background:"#f0f9ff", borderRadius:10, padding:12, fontSize:12, color:"#0369a1" }}>
            💡 <strong>Your phone number is your login.</strong> Returning patients will see their visit history. New patients will be guided to register.
          </div>
        </div>
      </div>
    </div>
  );

  // ══ NEW PATIENT REGISTRATION FORM ═══════════════════════════════════════════
  if (authStep === "new_form") return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"24px 16px 120px" }}>
      <div className="slide-up">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={() => { setAuthStep("login"); setLoggedInPhone(null); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#64748b" }}>←</button>
          <div>
            <div style={{ fontSize:20, fontWeight:700 }}>New Patient Registration</div>
            <div style={{ fontSize:13, color:"#64748b" }}>Phone: <strong>{form.phone}</strong> · Takes about 2 minutes</div>
          </div>
        </div>

        {/* Credential confirmation banner */}
        <div style={{ background:"linear-gradient(135deg,#0ea5e9,#0284c7)", borderRadius:14, padding:14, color:"white", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:28 }}>🔑</div>
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>Your Credential: {form.phone}</div>
            <div style={{ fontSize:12, opacity:.85 }}>Use this number to log in for all future visits at Sankara Eye Hospital</div>
          </div>
        </div>

        <div className="card" style={{ padding:20, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>👤 Personal Details</div>
          <div className="grid-2" style={{ marginBottom:12 }}>
            <div><div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Full Name *</div><input className="input" placeholder="e.g. Raj Kumar" value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></div>
            <div><div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Age *</div><input className="input" type="number" placeholder="e.g. 45" value={form.age} onChange={e => setForm({...form, age:e.target.value})} /></div>
          </div>
          <div className="grid-2">
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Phone (Credential)</div>
              <input className="input" value={form.phone} readOnly style={{ background:"#f8fafc", color:"#64748b", cursor:"not-allowed" }} />
            </div>
            <div><div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Gender</div><select className="input" value={form.gender} onChange={e => setForm({...form, gender:e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
          </div>
        </div>

        <div className="card" style={{ padding:20, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>👁️ What brings you in today?</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:14 }}>Select all that apply — our AI will assign your specialist</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {SYMPTOMS.map(s => (
              <label key={s} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:`1.5px solid ${symptoms.includes(s)?"#0ea5e9":"#e2e8f0"}`, background:symptoms.includes(s)?"#f0f9ff":"white", cursor:"pointer", fontSize:12, fontWeight:500, transition:"all .15s" }}>
                <input type="checkbox" checked={symptoms.includes(s)} onChange={() => toggleCheck(s,symptoms,setSymptoms)} style={{ accentColor:"#0ea5e9" }} />{s}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding:20, marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>🏥 Medical History</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:14 }}>Helps our AI predict your care needs</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {CONDITIONS.map(c => (
              <label key={c} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:`1.5px solid ${conditions.includes(c)?"#0ea5e9":"#e2e8f0"}`, background:conditions.includes(c)?"#f0f9ff":"white", cursor:"pointer", fontSize:12, fontWeight:500, transition:"all .15s" }}>
                <input type="checkbox" checked={conditions.includes(c)} onChange={() => toggleCheck(c,conditions,setConditions)} style={{ accentColor:"#0ea5e9" }} />{c}
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary w-full" style={{ justifyContent:"center", padding:"16px", fontSize:16, borderRadius:14 }}
          onClick={handleRegister} disabled={submitting || !form.name || !form.phone}>
          {submitting ? <><span className="spin">⏳</span> AI is processing your details...</> : "✅ Complete Registration & Get Token →"}
        </button>
      </div>

      {/* Floating chatbot always present */}
      <FloatingChatbot patientName={form.name} />
    </div>
  );

  // ══ DASHBOARD (logged-in patient) ═══════════════════════════════════════════
  if (authStep === "dashboard") {
    const p = activeVisit ? patients.find(v => v.id === activeVisit.id) : null;

    return (
      <div style={{ maxWidth:540, margin:"0 auto", padding:"20px 16px 120px" }}>
        <div className="slide-up">
          {/* Profile header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:46, height:46, borderRadius:"50%", background:"linear-gradient(135deg,#0ea5e9,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:18, fontWeight:800 }}>
                {(myVisits[0]?.name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{myVisits[0]?.name || "Welcome back"}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>📱 {loggedInPhone} · {myVisits.length} visit{myVisits.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12, color:"#64748b", fontFamily:"'Outfit',sans-serif" }}>Logout</button>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[["status","📋 My Visit"],["checkin","➕ New Check-In"],["history","📂 Visit History"]].map(([t,l]) => (
              <button key={t} onClick={() => setDashTab(t)} style={{ flex:1, padding:"10px 6px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:12, background:dashTab===t?"#0ea5e9":"#f1f5f9", color:dashTab===t?"white":"#475569", transition:"all .15s" }}>{l}</button>
            ))}
          </div>

          {/* ─ Status Tab ─ */}
          {dashTab === "status" && (
            <div>
              {!p ? (
                <div className="card" style={{ padding:40, textAlign:"center" }}>
                  <div style={{ fontSize:48 }}>👋</div>
                  <div style={{ fontSize:16, fontWeight:700, marginTop:12, marginBottom:8 }}>No active visit</div>
                  <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>You don't have an active visit today. Would you like to check in?</div>
                  <button className="btn btn-primary" style={{ justifyContent:"center" }} onClick={() => setDashTab("checkin")}>➕ Check-In Now</button>
                </div>
              ) : (
                <>
                  {/* Token card */}
                  <div style={{ background:"linear-gradient(135deg,#0ea5e9,#0284c7)", borderRadius:20, padding:24, color:"white", marginBottom:14, textAlign:"center" }}>
                    <div style={{ fontSize:12, opacity:.8, marginBottom:6 }}>Your Token Number</div>
                    <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:52, letterSpacing:2, marginBottom:6 }}>{p.token}</div>
                    <div style={{ fontSize:12, opacity:.8 }}>Show this at any counter · {formatTime(p.registeredAt)}</div>
                    <div style={{ marginTop:10 }}>
                      <span style={{ background:"rgba(255,255,255,.2)", borderRadius:100, padding:"4px 14px", fontSize:12, fontWeight:700 }}>
                        {getStatusConfig(p.status).icon} {getStatusConfig(p.status).label}
                      </span>
                    </div>
                  </div>

                  {/* Journey progress */}
                  <div className="card" style={{ padding:16, marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:10 }}>📍 Journey Progress</div>
                    <div className="progress-bar" style={{ marginBottom:8 }}>
                      <div className="progress-fill" style={{ width:`${getJourneyProgress(p.status)}%`, background:"#0ea5e9" }} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      {JOURNEY_STEPS.map(s => {
                        const cfg = getStatusConfig(p.status);
                        const done = cfg.step >= s.step;
                        return (
                          <div key={s.step} style={{ textAlign:"center", flex:1 }}>
                            <div style={{ width:10, height:10, borderRadius:"50%", background:done?"#0ea5e9":"#e2e8f0", margin:"0 auto 4px", transition:"background .3s" }} />
                            <div style={{ fontSize:9, color:done?"#0ea5e9":"#94a3b8", fontWeight:done?700:400 }}>{s.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="card" style={{ padding:18, marginBottom:14 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#64748b", marginBottom:10 }}>💳 Registration Fee</div>
                    {p.paymentStatus === "PAID" ? (
                      <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:12, color:"#16a34a", fontSize:14, fontWeight:600 }}>✅ ₹200 — Payment Received</div>
                    ) : (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                          <div><div style={{ fontSize:15, fontWeight:700 }}>Registration Fee</div><div style={{ fontSize:13, color:"#64748b" }}>Pay from your seat</div></div>
                          <div style={{ fontSize:24, fontWeight:800, color:"#0ea5e9" }}>₹200</div>
                        </div>
                        <button className="btn btn-primary w-full" style={{ justifyContent:"center" }} onClick={() => setPatients(prev => prev.map(v => v.id===p.id ? {...v, paymentStatus:"PAID"} : v))}>
                          📱 Pay Now via UPI
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scan payment */}
                  {p.scanOrdered && !p.scanPaid && (
                    <div className="card" style={{ padding:18, marginBottom:14, border:"2px solid #fbbf24" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#d97706", marginBottom:8 }}>🔬 Scan Ordered by Doctor</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                        <div><div style={{ fontSize:15, fontWeight:700 }}>{p.scanOrdered}</div><div style={{ fontSize:12, color:"#64748b" }}>Pay from here</div></div>
                        <div style={{ fontSize:22, fontWeight:800, color:"#f59e0b" }}>₹{p.scanCost}</div>
                      </div>
                      <button className="btn btn-amber w-full" style={{ justifyContent:"center" }} onClick={() => setPatients(prev => prev.map(v => v.id===p.id ? {...v, scanPaid:true, status:"SCAN_PAID"} : v))}>
                        💳 Pay for {p.scanOrdered}
                      </button>
                    </div>
                  )}
                  {p.scanPaid && <div className="card" style={{ padding:14, marginBottom:14, background:"#f0fdf4", border:"1px solid #bbf7d0" }}><div style={{ color:"#16a34a", fontWeight:600 }}>✅ {p.scanOrdered} — Paid. Proceed to scan room.</div></div>}

                  {/* Pharmacy payment */}
                  {p.prescription && p.buyingMedsHere && !p.prescriptionPaid && (
                    <div className="card" style={{ padding:18, marginBottom:14, border:"2px solid #a855f7" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#7e22ce", marginBottom:8 }}>💊 Pharmacy Bill</div>
                      {p.prescription.map((m, i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 0", borderBottom:"1px solid #f3e8ff" }}>
                          <span>• {m.name}</span><span style={{ fontWeight:700, color:"#8b5cf6" }}>₹{m.cost}</span>
                        </div>
                      ))}
                      <button className="btn btn-purple w-full" style={{ justifyContent:"center", marginTop:12 }} onClick={() => setPatients(prev => prev.map(v => v.id===p.id ? {...v, prescriptionPaid:true, status:"PHARMACY_PAID"} : v))}>
                        💳 Pay ₹{p.prescriptionCost} via UPI
                      </button>
                    </div>
                  )}
                  {p.pharmacyReady && p.prescriptionPaid && (
                    <div className="card" style={{ padding:14, marginBottom:14, background:"#f0fdf4", border:"2px solid #22c55e" }}>
                      <div style={{ color:"#16a34a", fontWeight:700, fontSize:15 }}>✅ Medicines ready! Collect at Pharmacy Counter 3 →</div>
                    </div>
                  )}

                  {/* Journey steps */}
                  <div className="card" style={{ padding:18 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#64748b", marginBottom:10 }}>📍 Visit Steps</div>
                    {[
                      { icon:"✅", label:"Checked In", done:true },
                      { icon:p.paymentStatus==="PAID"?"✅":"⏳", label:"Registration Paid", done:p.paymentStatus==="PAID" },
                      { icon:"⏳", label:"With Doctor", done:["WITH_DOCTOR","COUNSELLOR","PHARMACY_PENDING_PAYMENT","PHARMACY_PAID","COMPLETED"].includes(p.status) },
                      { icon:"⏳", label:"Diagnosis Complete", done:!!p.diagnosis },
                      { icon:p.pharmacyReady?"✅":"⏳", label:"Pharmacy Ready", done:p.pharmacyReady },
                    ].map((s, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:i<4?"1px solid #f1f5f9":"none" }}>
                        <span style={{ fontSize:18 }}>{s.icon}</span>
                        <span style={{ fontSize:14, color:s.done?"#16a34a":"#64748b", fontWeight:s.done?600:400 }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─ New Check-In Tab ─ */}
          {dashTab === "checkin" && (
            <NewCheckInForm
              phone={loggedInPhone}
              patients={patients}
              setPatients={setPatients}
              onDone={() => setDashTab("status")}
            />
          )}

          {/* ─ History Tab ─ */}
          {dashTab === "history" && (
            <div>
              {myVisits.length === 0 ? (
                <div className="card" style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>
                  <div style={{ fontSize:40 }}>📂</div>
                  <div style={{ marginTop:8 }}>No visit history yet.</div>
                </div>
              ) : [...myVisits].reverse().map((v, i) => {
                const cfg = getStatusConfig(v.status);
                return (
                  <div key={v.id} className="card" style={{ padding:16, marginBottom:10, borderLeft:`4px solid ${cfg.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:16, color:cfg.color }}>{v.token}</span>
                          <span className="status-pill" style={{ background:cfg.bg, color:cfg.color, fontSize:10 }}>{cfg.icon} {cfg.label}</span>
                        </div>
                        <div style={{ fontSize:13, color:"#475569" }}>{v.specialty} · {v.urgency}</div>
                        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{formatTime(v.registeredAt)}</div>
                      </div>
                      {v.diagnosis && <div style={{ fontSize:12, color:"#8b5cf6", fontWeight:600, maxWidth:120, textAlign:"right" }}>{v.diagnosis}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating chatbot always present for logged-in patients */}
        <FloatingChatbot patientName={myVisits[0]?.name} />
      </div>
    );
  }

  return null;
}

// ── New Check-In Form (used from dashboard) ───────────────────────────────────
function NewCheckInForm({ phone, patients, setPatients, onDone }) {
  const [form, setForm] = useState(() => {
    const existing = patients.find(p => p.phone === phone);
    return { name: existing?.name || "", age: existing?.age || "", phone, gender: existing?.gender || "" };
  });
  const [symptoms, setSymptoms] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const toggleCheck = (val, list, setList) => setList(p => p.includes(val) ? p.filter(x => x!==val) : [...p, val]);

  const handleRegister = async () => {
    if (!form.name || !form.phone) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    const ai = aiTriagePatient(symptoms, conditions);
    const p = {
      id: generateId(), token: generateToken(), ...form,
      symptoms, conditions, ...ai,
      status: "REGISTERED", paymentStatus: "PENDING",
      scanOrdered: null, scanPaid: false, prescription: null,
      pharmacyReady: false, registeredAt: new Date(),
    };
    setPatients(prev => [...prev, p]);
    setSubmitting(false);
    onDone();
  };

  return (
    <div>
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:12, padding:12, marginBottom:16, fontSize:13, color:"#0369a1" }}>
        🔄 Welcome back! Your details are pre-filled. Just update your symptoms for today's visit.
      </div>
      <div className="card" style={{ padding:20, marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>👤 Your Details</div>
        <div className="grid-2" style={{ marginBottom:12 }}>
          <div><div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Full Name *</div><input className="input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></div>
          <div><div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Age</div><input className="input" type="number" value={form.age} onChange={e => setForm({...form, age:e.target.value})} /></div>
        </div>
        <div className="grid-2">
          <div><div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Phone (Credential)</div><input className="input" value={form.phone} readOnly style={{ background:"#f8fafc", color:"#64748b" }} /></div>
          <div><div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Gender</div><select className="input" value={form.gender} onChange={e => setForm({...form, gender:e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
        </div>
      </div>
      <div className="card" style={{ padding:20, marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>👁️ Today's Symptoms</div>
        <div style={{ fontSize:12, color:"#64748b", marginBottom:12 }}>Select all that apply</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {SYMPTOMS.map(s => (
            <label key={s} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:`1.5px solid ${symptoms.includes(s)?"#0ea5e9":"#e2e8f0"}`, background:symptoms.includes(s)?"#f0f9ff":"white", cursor:"pointer", fontSize:12, fontWeight:500 }}>
              <input type="checkbox" checked={symptoms.includes(s)} onChange={() => toggleCheck(s,symptoms,setSymptoms)} style={{ accentColor:"#0ea5e9" }} />{s}
            </label>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding:20, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>🏥 Medical History</div>
        <div style={{ fontSize:12, color:"#64748b", marginBottom:12 }}>Update as needed</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {CONDITIONS.map(c => (
            <label key={c} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:`1.5px solid ${conditions.includes(c)?"#0ea5e9":"#e2e8f0"}`, background:conditions.includes(c)?"#f0f9ff":"white", cursor:"pointer", fontSize:12, fontWeight:500 }}>
              <input type="checkbox" checked={conditions.includes(c)} onChange={() => toggleCheck(c,conditions,setConditions)} style={{ accentColor:"#0ea5e9" }} />{c}
            </label>
          ))}
        </div>
      </div>
      <button className="btn btn-primary w-full" style={{ justifyContent:"center", padding:"16px", fontSize:15, borderRadius:14 }}
        onClick={handleRegister} disabled={submitting || !form.name}>
        {submitting ? <><span className="spin">⏳</span> Processing...</> : "✅ Check-In & Get Token →"}
      </button>
    </div>
  );
}

// ─── MODULE 2: NURSE VIEW ─────────────────────────────────────────────────────
const SCAN_TYPES = [
  { name:"A-Scan Biometry", cost:400 },
  { name:"B-Scan Ultrasound", cost:500 },
  { name:"OCT (Optical Coherence Tomography)", cost:800 },
  { name:"Fundus Photography", cost:600 },
  { name:"Visual Field Test", cost:550 },
  { name:"Corneal Topography", cost:700 },
];

function NurseView({ patients, setPatients }) {
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [scanModal, setScanModal] = useState(null);
  const [selectedScan, setSelectedScan] = useState("");

  const active = patients.filter(p => p.status !== "COMPLETED").sort((a,b) => {
    const urgOrder = { HIGH:0, MEDIUM:1, NORMAL:2 };
    return (urgOrder[a.urgency]||2) - (urgOrder[b.urgency]||2);
  });
  const dilationAlerts = active.filter(p => p.needsDilation && p.status === "REGISTERED");

  const orderScan = (patient) => {
    const scan = SCAN_TYPES.find(s => s.name === selectedScan);
    if (!scan) return;
    setPatients(prev => prev.map(p => p.id===patient.id ? {...p, scanOrdered:scan.name, scanCost:scan.cost, status:"SCAN_ORDERED"} : p));
    setScanModal(null); setSelectedScan("");
  };

  const tabs = [
    { id:"queue", label:"Patient Queue", icon:"📋" },
    { id:"dilation", label:`Dilation Alerts ${dilationAlerts.length>0?`(${dilationAlerts.length})`:""}`, icon:"💧" },
  ];

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 16px" }}>
      {dilationAlerts.length > 0 && (
        <div style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb)", borderRadius:14, padding:16, marginBottom:16, color:"white", display:"flex", alignItems:"center", gap:12 }} className="slide-up">
          <div style={{ fontSize:32 }}>🤖</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>AI Dilation Alert — {dilationAlerts.length} Patient{dilationAlerts.length>1?"s":""}</div>
            <div style={{ fontSize:13, opacity:.9 }}>{dilationAlerts.map(p => `${p.name} (${p.token})`).join(", ")} may need dilation. Call them now to save 30 minutes.</div>
          </div>
          <button className="btn" style={{ background:"white", color:"#1d4ed8" }} onClick={() => setActiveTab("dilation")}>View →</button>
        </div>
      )}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding:"10px 18px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, background:activeTab===t.id?"#10b981":"#f1f5f9", color:activeTab===t.id?"white":"#475569" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {activeTab === "queue" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {active.length === 0 && <div className="card" style={{ padding:40, textAlign:"center", color:"#94a3b8" }}><div style={{ fontSize:40 }}>🎉</div><div style={{ marginTop:8 }}>No active patients</div></div>}
          {active.map(p => (
            <div key={p.id} className="card slide-up" style={{ padding:20, borderLeft:`4px solid ${p.urgency==="HIGH"?"#ef4444":p.urgency==="MEDIUM"?"#f59e0b":"#10b981"}`, cursor:"pointer" }}
              onClick={() => setSelectedPatient(selectedPatient?.id===p.id ? null : p)}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div className="avatar" style={{ background:p.urgency==="HIGH"?"#fee2e2":p.urgency==="MEDIUM"?"#fef3c7":"#dcfce7", color:p.urgency==="HIGH"?"#dc2626":p.urgency==="MEDIUM"?"#d97706":"#16a34a" }}>{p.token}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{p.name} <span style={{ fontWeight:400, fontSize:13, color:"#64748b" }}>· {p.age}y · {p.gender}</span></div>
                    <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>📱 {p.phone} · {p.specialty} Dept.</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <span className={`badge tag-${p.urgency.toLowerCase()}`}>{p.urgency}</span>
                  {p.needsDilation && <span className="badge tag-dilation">💧 Dilation Suggested</span>}
                  {p.scanOrdered && <span className="badge" style={{ background:"#fef3c7",color:"#d97706" }}>🔬 {p.scanOrdered}</span>}
                  {p.scanPaid && <span className="badge tag-normal">✅ Scan Paid</span>}
                  <span className="badge tag-status">{p.status.replace(/_/g," ")}</span>
                </div>
              </div>
              {selectedPatient?.id === p.id && (
                <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9" }} className="fade-in">
                  <div className="grid-2" style={{ marginBottom:12 }}>
                    <div style={{ background:"#f8fafc", borderRadius:10, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginBottom:6 }}>SYMPTOMS</div>
                      {p.symptoms.length>0 ? p.symptoms.map(s => <div key={s} style={{ fontSize:12, color:"#475569", padding:"2px 0" }}>• {s}</div>) : <div style={{ fontSize:12, color:"#94a3b8" }}>None</div>}
                    </div>
                    <div style={{ background:"#f8fafc", borderRadius:10, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginBottom:6 }}>CONDITIONS</div>
                      {p.conditions.length>0 ? p.conditions.map(c => <div key={c} style={{ fontSize:12, color:"#475569", padding:"2px 0" }}>• {c}</div>) : <div style={{ fontSize:12, color:"#94a3b8" }}>None</div>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button className="btn btn-green" onClick={() => { setPatients(prev => prev.map(q => q.id===p.id?{...q,status:"WITH_DOCTOR"}:q)); setSelectedPatient(null); }}>🩺 Send to Doctor</button>
                    {!p.scanOrdered && <button className="btn btn-ghost" onClick={e => { e.stopPropagation(); setScanModal(p); }}>🔬 Order Scan</button>}
                    {p.needsDilation && p.status==="REGISTERED" && <button className="btn" style={{ background:"#dbeafe", color:"#1d4ed8" }} onClick={() => setPatients(prev => prev.map(q => q.id===p.id?{...q,status:"DILATING"}:q))}>💧 Start Dilation</button>}
                    <button className="btn btn-ghost" onClick={() => setPatients(prev => prev.map(q => q.id===p.id?{...q,status:"COMPLETED"}:q))}>✅ Mark Complete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {activeTab === "dilation" && (
        <div>
          <div className="card" style={{ padding:20, marginBottom:16, background:"#eff6ff", border:"1px solid #bfdbfe" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#1d4ed8", marginBottom:8 }}>🤖 AI Dilation Intelligence</div>
            <p style={{ fontSize:13, color:"#1e40af", lineHeight:1.6 }}>Based on patient symptoms and medical history, our AI has flagged patients as likely needing pupil dilation. Calling them early saves 30+ minutes each.</p>
          </div>
          {dilationAlerts.length === 0 ? (
            <div className="card" style={{ padding:40, textAlign:"center", color:"#94a3b8" }}><div style={{ fontSize:40 }}>✅</div><div style={{ marginTop:8 }}>No dilation alerts right now</div></div>
          ) : dilationAlerts.map(p => (
            <div key={p.id} className="card slide-up" style={{ padding:20, marginBottom:12, border:"1.5px solid #93c5fd" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{p.name} · {p.token}</div>
                  <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>Triggers: {p.symptoms.filter(s => DILATION_TRIGGERS.has(s)).join(", ") || "Medical history"}{p.conditions.includes("Diabetes") ? " + Diabetes" : ""}</div>
                </div>
                <button className="btn" style={{ background:"#1d4ed8", color:"white" }} onClick={() => setPatients(prev => prev.map(q => q.id===p.id?{...q,status:"DILATING"}:q))}>💧 Call for Dilation</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {scanModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
          <div className="card slide-up" style={{ padding:24, width:"100%", maxWidth:440 }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>🔬 Order Scan</div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>Patient: {scanModal.name} · {scanModal.token}</div>
            <div style={{ marginBottom:16 }}>
              {SCAN_TYPES.map(s => (
                <label key={s.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:8, border:`1.5px solid ${selectedScan===s.name?"#10b981":"#e2e8f0"}`, background:selectedScan===s.name?"#f0fdf4":"white", cursor:"pointer", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <input type="radio" checked={selectedScan===s.name} onChange={() => setSelectedScan(s.name)} style={{ accentColor:"#10b981" }} /><span style={{ fontSize:13, fontWeight:500 }}>{s.name}</span>
                  </div>
                  <span style={{ fontWeight:700, color:"#0ea5e9" }}>₹{s.cost}</span>
                </label>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={() => { setScanModal(null); setSelectedScan(""); }}>Cancel</button>
              <button className="btn btn-green" style={{ flex:1, justifyContent:"center" }} onClick={() => orderScan(scanModal)} disabled={!selectedScan}>📱 Send to Patient's Phone</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODULE 3: DOCTOR VIEW ────────────────────────────────────────────────────
function DoctorView({ patients, setPatients }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescList, setPrescList] = useState([]);
  const [medInput, setMedInput] = useState("");
  const [buyingHere, setBuyingHere] = useState(null);

  const myPatients = patients.filter(p => ["WITH_DOCTOR","DILATING","SCAN_ORDERED","SCAN_PAID"].includes(p.status));
  const MED_LIST = ["Latanoprost 0.005% ED - ₹120","Timolol 0.5% ED - ₹85","Prednisolone Eye Drops - ₹95","Moxifloxacin ED - ₹150","Vitamin C 500mg - ₹45","Omega-3 Capsule - ₹180","Azithromycin 500mg - ₹65","Cyclopentolate ED - ₹110"];

  const addMed = () => {
    if (!medInput.trim()) return;
    const parts = medInput.split(" - ₹");
    const name = parts[0];
    const cost = parts[1] ? parseInt(parts[1]) : Math.floor(Math.random() * 200) + 50;
    setPrescList(p => [...p, { name, cost }]);
    setMedInput("");
  };

  const saveDiagnosis = () => {
    if (!selectedPatient) return;
    if (prescList.length > 0 && buyingHere === null) { alert("⚠️ Please ask patient: Buying medicines here or outside?"); return; }
    const totalRxCost = prescList.reduce((sum, m) => sum + m.cost, 0);
    setPatients(prev => prev.map(p => p.id===selectedPatient.id ? {
      ...p, diagnosis, clinicalNotes:notes,
      prescription: prescList.length > 0 ? prescList : null,
      buyingMedsHere: buyingHere === "YES",
      prescriptionCost: buyingHere === "YES" ? totalRxCost : 0,
      prescriptionPaid: false, pharmacyReady: false,
      status: buyingHere === "YES" ? "PHARMACY_PENDING_PAYMENT" : "COUNSELLOR"
    } : p));
    setDiagnosis(""); setNotes(""); setPrescList([]); setMedInput(""); setBuyingHere(null); setSelectedPatient(null);
  };

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", padding:"24px 16px", display:"flex", gap:16, flexWrap:"wrap" }}>
      <div style={{ flex:"0 0 300px", minWidth:260 }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>👁️ My Patients Today</div>
        {myPatients.length === 0 && <div className="card" style={{ padding:32, textAlign:"center", color:"#94a3b8" }}><div style={{ fontSize:36 }}>⏳</div><div style={{ marginTop:8 }}>Waiting for nurse to send patients</div></div>}
        {myPatients.map(p => (
          <div key={p.id} className="card" style={{ padding:16, marginBottom:10, cursor:"pointer", border:`2px solid ${selectedPatient?.id===p.id?"#8b5cf6":"transparent"}`, transition:"all .2s" }}
            onClick={() => { setSelectedPatient(p); setDiagnosis(p.diagnosis||""); setNotes(p.clinicalNotes||""); setPrescList(p.prescription||[]); }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div className="avatar" style={{ background:"#ede9fe", color:"#7c3aed", fontSize:14 }}>{p.token}</div>
              <div><div style={{ fontWeight:600, fontSize:14 }}>{p.name}</div><div style={{ fontSize:12, color:"#64748b" }}>{p.specialty} · {p.age}y</div></div>
              <span className={`badge tag-${p.urgency.toLowerCase()}`} style={{ marginLeft:"auto" }}>{p.urgency}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex:1, minWidth:280 }}>
        {!selectedPatient ? (
          <div className="card" style={{ padding:60, textAlign:"center", color:"#94a3b8" }}><div style={{ fontSize:48 }}>🩺</div><div style={{ marginTop:12, fontSize:15 }}>Select a patient to view details and diagnose</div></div>
        ) : (
          <div className="slide-up">
            <div style={{ background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", borderRadius:16, padding:20, color:"white", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:40 }}>🧑</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:20 }}>{selectedPatient.name}</div>
                  <div style={{ opacity:.85, fontSize:14 }}>{selectedPatient.age}y · {selectedPatient.gender} · {selectedPatient.phone}</div>
                  <div style={{ opacity:.85, fontSize:13, marginTop:2 }}>Token: {selectedPatient.token} · {selectedPatient.specialty}</div>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding:16, marginBottom:12, background:"#faf5ff", border:"1px solid #e9d5ff" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#6d28d9", marginBottom:8 }}>🤖 AI Pre-Assessment</div>
              <div className="grid-2">
                <div><div style={{ fontSize:11, color:"#94a3b8", fontWeight:700, marginBottom:4 }}>SYMPTOMS</div>{selectedPatient.symptoms.map(s => <div key={s} style={{ fontSize:12, color:"#475569" }}>• {s}</div>)}</div>
                <div><div style={{ fontSize:11, color:"#94a3b8", fontWeight:700, marginBottom:4 }}>CONDITIONS</div>{selectedPatient.conditions.length>0 ? selectedPatient.conditions.map(c => <div key={c} style={{ fontSize:12, color:"#475569" }}>• {c}</div>) : <div style={{ fontSize:12, color:"#94a3b8" }}>None</div>}</div>
              </div>
            </div>
            <div className="card" style={{ padding:20, marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>📝 Clinical Assessment</div>
              <div style={{ marginBottom:10 }}><div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Diagnosis</div><input className="input" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Primary Open Angle Glaucoma..." /></div>
              <div><div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Clinical Notes</div><textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Examination findings, IOP readings..." /></div>
            </div>
            <div className="card" style={{ padding:20, marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>💊 Prescription</div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <input className="input" list="meds" value={medInput} onChange={e => setMedInput(e.target.value)} placeholder="Type medication or select..." onKeyDown={e => e.key==="Enter" && addMed()} />
                <datalist id="meds">{MED_LIST.map(m => <option key={m} value={m} />)}</datalist>
                <button className="btn btn-purple" onClick={addMed}>Add</button>
              </div>
              {prescList.map((m,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"#faf5ff", borderRadius:8, marginBottom:6 }}>
                  <span style={{ fontSize:13 }}>💊 {m.name}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#8b5cf6" }}>₹{m.cost}</span>
                    <button onClick={() => setPrescList(p => p.filter((_,j) => j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:16 }}>×</button>
                  </div>
                </div>
              ))}
              {prescList.length > 0 && (
                <div style={{ marginTop:12, padding:12, background:"#f0fdf4", borderRadius:10, border:"1px solid #bbf7d0" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#16a34a", marginBottom:8 }}>Total: ₹{prescList.reduce((sum,m) => sum+m.cost, 0)}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:8 }}>Is patient buying medicines here or outside?</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setBuyingHere("YES")} className={buyingHere==="YES"?"btn btn-green":"btn btn-ghost"} style={{ flex:1, justifyContent:"center", fontSize:13 }}>🏥 Buying Here</button>
                    <button onClick={() => setBuyingHere("NO")} className={buyingHere==="NO"?"btn btn-purple":"btn btn-ghost"} style={{ flex:1, justifyContent:"center", fontSize:13 }}>🏪 Buying Outside</button>
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-purple w-full" style={{ justifyContent:"center", padding:"14px", fontSize:15 }} onClick={saveDiagnosis} disabled={!diagnosis}>
              ✅ Save & Send to Counsellor + Pharmacy →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MODULE 4: PHARMACY VIEW ──────────────────────────────────────────────────
function PharmacyView({ patients, setPatients }) {
  const rxPatients = patients.filter(p => p.prescription && p.prescription.length > 0 && p.buyingMedsHere && p.prescriptionPaid);
  const pending = rxPatients.filter(p => !p.pharmacyReady);
  const ready = rxPatients.filter(p => p.pharmacyReady);
  const awaitingPayment = patients.filter(p => p.prescription && p.buyingMedsHere && !p.prescriptionPaid);

  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"24px 16px" }}>
      <div style={{ background:"linear-gradient(135deg,#f59e0b,#d97706)", borderRadius:16, padding:20, color:"white", marginBottom:20 }}>
        <div style={{ fontSize:13, opacity:.8, marginBottom:4 }}>Click & Collect Pharmacy</div>
        <div style={{ fontSize:22, fontWeight:800 }}>Pre-Pack Queue — No More Waiting</div>
        <div style={{ display:"flex", gap:20, marginTop:16 }}>
          <div><div style={{ fontSize:28, fontWeight:800 }}>{awaitingPayment.length}</div><div style={{ fontSize:12, opacity:.8 }}>Awaiting Payment</div></div>
          <div><div style={{ fontSize:28, fontWeight:800 }}>{pending.length}</div><div style={{ fontSize:12, opacity:.8 }}>To Pack</div></div>
          <div><div style={{ fontSize:28, fontWeight:800 }}>{ready.length}</div><div style={{ fontSize:12, opacity:.8 }}>Ready</div></div>
        </div>
      </div>
      {awaitingPayment.length > 0 && (
        <>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:12, color:"#94a3b8" }}>⏳ Awaiting Patient Payment ({awaitingPayment.length})</div>
          {awaitingPayment.map(p => (
            <div key={p.id} className="card" style={{ padding:16, marginBottom:10, background:"#fef3c7", border:"1px solid #fde68a" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div><div style={{ fontWeight:700, fontSize:14 }}>{p.name} · {p.token}</div><div style={{ fontSize:12, color:"#92400e" }}>Total: ₹{p.prescriptionCost} · Patient paying on phone...</div></div>
                <span className="badge" style={{ background:"#fbbf24", color:"white" }}>💳 Pending</span>
              </div>
            </div>
          ))}
          <div className="divider" />
        </>
      )}
      <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>📦 To Pre-Pack</div>
      {pending.length === 0 && <div className="card" style={{ padding:32, textAlign:"center", color:"#94a3b8", marginBottom:20 }}><div style={{ fontSize:36 }}>✅</div><div style={{ marginTop:8 }}>All packed</div></div>}
      {pending.map(p => (
        <div key={p.id} className="card slide-up" style={{ padding:20, marginBottom:12, borderLeft:"4px solid #f59e0b" }}>
          <div style={{ display:"flex", alignItems:"start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div className="avatar" style={{ background:"#fef3c7", color:"#d97706", fontSize:12 }}>{p.token}</div>
                <div><div style={{ fontWeight:700, fontSize:16 }}>{p.name}</div><div style={{ fontSize:12, color:"#64748b" }}>Diagnosis: {p.diagnosis || "See notes"}</div></div>
              </div>
              <div style={{ background:"#fffbeb", borderRadius:10, padding:12, marginTop:8 }}>
                {p.prescription.map((m,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:i<p.prescription.length-1?"1px solid #fde68a":"none" }}>
                    <span style={{ fontSize:13 }}>💊 {m.name}</span><span style={{ fontSize:13, fontWeight:700, color:"#f59e0b" }}>₹{m.cost}</span>
                  </div>
                ))}
                <div style={{ marginTop:8, padding:8, background:"#dcfce7", borderRadius:6, fontSize:11, color:"#16a34a", fontWeight:600 }}>✅ ₹{p.prescriptionCost} Received · Start Pre-packing</div>
              </div>
            </div>
            <button className="btn btn-amber" onClick={() => setPatients(prev => prev.map(q => q.id===p.id?{...q,pharmacyReady:true}:q))}>✅ Mark Ready</button>
          </div>
        </div>
      ))}
      {ready.length > 0 && (
        <>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:12, marginTop:8 }}>✅ Ready for Collection</div>
          {ready.map(p => (
            <div key={p.id} className="card" style={{ padding:16, marginBottom:10, background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:24 }}>✅</span>
                  <div><div style={{ fontWeight:700 }}>{p.name} · {p.token}</div><div style={{ fontSize:12, color:"#64748b" }}>{p.prescription.length} item(s) · ₹{p.prescriptionCost} PAID</div></div>
                </div>
                <button className="btn" style={{ background:"#16a34a", color:"white" }} onClick={() => setPatients(prev => prev.map(q => q.id===p.id?{...q,status:"COMPLETED"}:q))}>🎉 Collected</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── MODULE 5: ADMIN / RECEPTION TRACKER ─────────────────────────────────────
function AdminView({ patients, setPatients }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterUrgency, setFilterUrgency] = useState("ALL");
  const [filterSpecialty, setFilterSpecialty] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // table | kanban | timeline
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const specialties = [...new Set(patients.map(p => p.specialty))];
  const statusKeys = Object.keys(STATUS_CONFIG);

  const filtered = patients.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.token.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search);
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchUrgency = filterUrgency === "ALL" || p.urgency === filterUrgency;
    const matchSpecialty = filterSpecialty === "ALL" || p.specialty === filterSpecialty;
    return matchSearch && matchStatus && matchUrgency && matchSpecialty;
  }).sort((a,b) => {
    const urgOrder = { HIGH:0, MEDIUM:1, NORMAL:2 };
    return (urgOrder[a.urgency]||2) - (urgOrder[b.urgency]||2) || new Date(a.registeredAt) - new Date(b.registeredAt);
  });

  // Stats
  const total = patients.length;
  const active = patients.filter(p => p.status !== "COMPLETED").length;
  const completed = patients.filter(p => p.status === "COMPLETED").length;
  const highUrgency = patients.filter(p => p.urgency === "HIGH" && p.status !== "COMPLETED").length;
  const avgWaitMins = patients.length > 0 ? Math.floor(patients.filter(p=>p.registeredAt).reduce((s,p) => s + Math.floor((now - new Date(p.registeredAt))/60000), 0) / patients.length) : 0;

  // Kanban columns
  const KANBAN_COLS = [
    { id: "registered", label: "Registered", statuses: ["REGISTERED"], color: "#6366f1" },
    { id: "assessment", label: "Assessment", statuses: ["DILATING","SCAN_ORDERED","SCAN_PAID"], color: "#0ea5e9" },
    { id: "doctor", label: "With Doctor", statuses: ["WITH_DOCTOR"], color: "#8b5cf6" },
    { id: "billing", label: "Billing / Rx", statuses: ["COUNSELLOR","PHARMACY_PENDING_PAYMENT","PHARMACY_PAID"], color: "#f59e0b" },
    { id: "done", label: "Completed", statuses: ["COMPLETED"], color: "#16a34a" },
  ];

  const PatientDetailDrawer = ({ patient, onClose }) => {
    const cfg = getStatusConfig(patient.status);
    const progress = getJourneyProgress(patient.status);
    const waitMins = patient.registeredAt ? Math.floor((now - new Date(patient.registeredAt)) / 60000) : 0;

    return (
      <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="drawer">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:800 }}>{patient.name}</div>
              <div style={{ fontSize:13, color:"#64748b" }}>Token: {patient.token} · Registered {formatTime(patient.registeredAt)}</div>
            </div>
            <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:8, width:36, height:36, cursor:"pointer", fontSize:18 }}>×</button>
          </div>

          {/* Status + Progress */}
          <div style={{ background: cfg.bg, borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <span className="status-pill" style={{ background:cfg.color, color:"white", fontSize:13 }}>{cfg.icon} {cfg.label}</span>
              <span style={{ fontSize:13, fontWeight:600, color:"#64748b" }}>⏱ {waitMins < 1 ? "Just arrived" : `${waitMins}m waiting`}</span>
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Journey Progress — {progress}%</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width:`${progress}%`, background: cfg.color }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
              {JOURNEY_STEPS.map(s => (
                <div key={s.step} style={{ textAlign:"center", flex:1 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background: cfg.step >= s.step ? cfg.color : "#e2e8f0", margin:"0 auto 4px" }} />
                  <div style={{ fontSize:9, color: cfg.step >= s.step ? cfg.color : "#94a3b8", fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid-2" style={{ marginBottom:20 }}>
            {[
              ["Age / Gender", `${patient.age}y · ${patient.gender || "N/A"}`],
              ["Phone", patient.phone],
              ["Specialty", patient.specialty],
              ["Urgency", patient.urgency],
              ["Payment", patient.paymentStatus === "PAID" ? "✅ Paid ₹200" : "⏳ Pending"],
              ["AI Confidence", `${patient.confidence}%`],
            ].map(([k,v]) => (
              <div key={k} style={{ background:"#f8fafc", borderRadius:10, padding:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", marginBottom:4 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#1e293b" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Symptoms & Conditions */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>🔍 Reported Symptoms</div>
            {patient.symptoms.length > 0 ? (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {patient.symptoms.map(s => <span key={s} style={{ background:"#eff6ff", color:"#1d4ed8", borderRadius:100, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{s}</span>)}
              </div>
            ) : <div style={{ fontSize:13, color:"#94a3b8" }}>None reported</div>}
          </div>
          {patient.conditions.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>🏥 Medical History</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {patient.conditions.map(c => <span key={c} style={{ background:"#fff7ed", color:"#c2410c", borderRadius:100, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{c}</span>)}
              </div>
            </div>
          )}

          {/* Diagnosis if available */}
          {patient.diagnosis && (
            <div style={{ marginBottom:20, background:"#faf5ff", borderRadius:12, padding:14, border:"1px solid #e9d5ff" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#6d28d9", marginBottom:6 }}>🩺 Doctor's Diagnosis</div>
              <div style={{ fontSize:14, color:"#1e293b", fontWeight:600 }}>{patient.diagnosis}</div>
              {patient.clinicalNotes && <div style={{ fontSize:13, color:"#64748b", marginTop:6 }}>{patient.clinicalNotes}</div>}
            </div>
          )}

          {/* Prescription */}
          {patient.prescription && patient.prescription.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>💊 Prescription</div>
              {patient.prescription.map((m,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
                  <span>{m.name}</span><span style={{ fontWeight:700, color:"#8b5cf6" }}>₹{m.cost}</span>
                </div>
              ))}
              <div style={{ marginTop:8, display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:700 }}>
                <span>Total</span>
                <span style={{ color:"#8b5cf6" }}>₹{patient.prescriptionCost}</span>
              </div>
              <div style={{ marginTop:6, fontSize:12, color:"#64748b" }}>
                {patient.buyingMedsHere ? "🏥 Buying at hospital pharmacy" : "🏪 Buying outside"} · {patient.prescriptionPaid ? "✅ Paid" : "⏳ Pending payment"}
              </div>
            </div>
          )}

          {/* Scan */}
          {patient.scanOrdered && (
            <div style={{ marginBottom:20, background:"#fffbeb", borderRadius:12, padding:14, border:"1px solid #fde68a" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#d97706", marginBottom:4 }}>🔬 Scan Ordered</div>
              <div style={{ fontSize:14, fontWeight:600 }}>{patient.scanOrdered} — ₹{patient.scanCost}</div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{patient.scanPaid ? "✅ Paid & Ready for scan" : "⏳ Awaiting payment"}</div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:16 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:"#64748b" }}>Quick Actions</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {patient.status !== "COMPLETED" && (
                <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => { setPatients(prev => prev.map(p => p.id===patient.id ? {...p, status:"COMPLETED"} : p)); onClose(); }}>
                  ✅ Mark Complete
                </button>
              )}
              {patient.paymentStatus !== "PAID" && (
                <button className="btn btn-primary" style={{ fontSize:12 }} onClick={() => { setPatients(prev => prev.map(p => p.id===patient.id ? {...p, paymentStatus:"PAID"} : p)); }}>
                  💳 Confirm Payment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"20px 16px" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#e11d48,#9f1239)", borderRadius:16, padding:"20px 24px", color:"white", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:13, opacity:.8, marginBottom:2 }}>Reception · Module 5</div>
            <div style={{ fontSize:24, fontWeight:800 }}>Live Patient Tracker</div>
            <div style={{ fontSize:13, opacity:.8, marginTop:2 }}>All registered patients · Real-time status · Search by name or token</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span className="live-badge">● LIVE</span>
            <span style={{ fontSize:13, opacity:.8 }}>Auto-refreshing</span>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display:"flex", gap:20, marginTop:20, flexWrap:"wrap" }}>
          {[
            { label:"Total Today", value:total, icon:"👥" },
            { label:"Active", value:active, icon:"🔵" },
            { label:"Completed", value:completed, icon:"✅" },
            { label:"Urgent", value:highUrgency, icon:"🔴" },
            { label:"Avg Wait", value:`${avgWaitMins}m`, icon:"⏱" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"10px 16px", minWidth:80 }}>
              <div style={{ fontSize:20, fontWeight:800 }}>{s.icon} {s.value}</div>
              <div style={{ fontSize:11, opacity:.8, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ flex:"1 1 200px", position:"relative" }}>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search name, token, or phone..." style={{ paddingLeft:16 }} />
        </div>
        <select className="input" style={{ flex:"0 0 160px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All Statuses</option>
          {statusKeys.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}</option>)}
        </select>
        <select className="input" style={{ flex:"0 0 130px" }} value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}>
          <option value="ALL">All Urgency</option>
          <option value="HIGH">🔴 High</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="NORMAL">🟢 Normal</option>
        </select>
        <select className="input" style={{ flex:"0 0 160px" }} value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}>
          <option value="ALL">All Specialties</option>
          {specialties.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* View mode toggle */}
        <div style={{ display:"flex", gap:4, background:"#f1f5f9", borderRadius:10, padding:4, flexShrink:0 }}>
          {[["table","📋"],["kanban","🗂️"],["timeline","📌"]].map(([mode, icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{ padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:12, background:viewMode===mode?"white":"transparent", color:viewMode===mode?"#1e293b":"#94a3b8", boxShadow:viewMode===mode?"0 1px 4px rgba(0,0,0,.1)":"none", transition:"all .15s" }}>
              {icon} {mode.charAt(0).toUpperCase()+mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize:13, color:"#64748b", marginBottom:12 }}>
        Showing <strong>{filtered.length}</strong> of <strong>{total}</strong> patients
        {search && <span> matching "<strong>{search}</strong>"</span>}
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" && (
        <div className="card" style={{ overflow:"hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding:60, textAlign:"center", color:"#94a3b8" }}>
              <div style={{ fontSize:40 }}>🔍</div>
              <div style={{ marginTop:8 }}>{total === 0 ? "No patients registered yet. Ask patients to check in!" : "No patients match your filters."}</div>
            </div>
          ) : (
            <table className="admin-table" style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Specialty</th>
                  <th>Status</th>
                  <th>Journey</th>
                  <th>Urgency</th>
                  <th>Payment</th>
                  <th>Wait</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const cfg = getStatusConfig(p.status);
                  const progress = getJourneyProgress(p.status);
                  const waitMins = p.registeredAt ? Math.floor((now - new Date(p.registeredAt)) / 60000) : 0;
                  return (
                    <tr key={p.id} style={{ cursor:"pointer" }} onClick={() => setSelectedPatient(p)}>
                      <td>
                        <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:15, color:"#1e293b", background:"#f8fafc", padding:"4px 8px", borderRadius:6 }}>{p.token}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight:600, color:"#1e293b" }}>{p.name}</div>
                        <div style={{ fontSize:11, color:"#94a3b8" }}>{p.age}y · {p.gender || "?"} · {p.phone}</div>
                      </td>
                      <td><span style={{ fontSize:12, color:"#475569", fontWeight:500 }}>{p.specialty}</span></td>
                      <td>
                        <span className="status-pill" style={{ background:cfg.bg, color:cfg.color, fontSize:11 }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td style={{ minWidth:100 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div className="progress-bar" style={{ flex:1, minWidth:60 }}>
                            <div className="progress-fill" style={{ width:`${progress}%`, background:cfg.color }} />
                          </div>
                          <span style={{ fontSize:11, color:"#94a3b8", flexShrink:0 }}>{progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge tag-${p.urgency.toLowerCase()}`}>{p.urgency}</span>
                      </td>
                      <td>
                        <span style={{ fontSize:12, color:p.paymentStatus==="PAID"?"#16a34a":"#d97706", fontWeight:600 }}>
                          {p.paymentStatus === "PAID" ? "✅ ₹200" : "⏳ Pending"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize:12, color: waitMins > 60 ? "#dc2626" : waitMins > 30 ? "#d97706" : "#64748b", fontWeight: waitMins > 30 ? 700 : 400 }}>
                          {waitMins < 1 ? "< 1m" : `${waitMins}m`}
                        </span>
                      </td>
                      <td><span style={{ fontSize:12, color:"#64748b" }}>{formatTime(p.registeredAt)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {viewMode === "kanban" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12, alignItems:"start" }}>
          {KANBAN_COLS.map(col => {
            const colPatients = filtered.filter(p => col.statuses.includes(p.status));
            return (
              <div key={col.id} style={{ background:"white", borderRadius:14, border:"1px solid #f1f5f9", overflow:"hidden" }}>
                <div style={{ padding:"12px 14px", background:col.color, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ color:"white", fontWeight:700, fontSize:13 }}>{col.label}</span>
                  <span style={{ background:"rgba(255,255,255,.25)", color:"white", borderRadius:100, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{colPatients.length}</span>
                </div>
                <div style={{ padding:10, display:"flex", flexDirection:"column", gap:8, minHeight:80 }}>
                  {colPatients.length === 0 && <div style={{ padding:12, textAlign:"center", color:"#cbd5e1", fontSize:12 }}>Empty</div>}
                  {colPatients.map(p => {
                    const cfg = getStatusConfig(p.status);
                    const waitMins = p.registeredAt ? Math.floor((now - new Date(p.registeredAt)) / 60000) : 0;
                    return (
                      <div key={p.id} onClick={() => setSelectedPatient(p)} style={{ background:"#f8fafc", borderRadius:10, padding:10, cursor:"pointer", border:"1px solid #f1f5f9", transition:"all .15s" }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.1)"}
                        onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                          <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:800, color:"#64748b", background:"white", padding:"2px 6px", borderRadius:4 }}>{p.token}</span>
                          <span className={`badge tag-${p.urgency.toLowerCase()}`} style={{ fontSize:9, padding:"2px 6px" }}>{p.urgency}</span>
                        </div>
                        <div style={{ fontWeight:700, fontSize:13, color:"#1e293b", marginBottom:2 }}>{p.name}</div>
                        <div style={{ fontSize:11, color:"#94a3b8" }}>{p.specialty}</div>
                        <div style={{ marginTop:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span className="status-pill" style={{ background:cfg.bg, color:cfg.color, fontSize:9 }}>{cfg.icon} {cfg.label}</span>
                          <span style={{ fontSize:10, color: waitMins > 60 ? "#dc2626" : "#94a3b8", fontWeight: waitMins > 60 ? 700 : 400 }}>⏱ {waitMins}m</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TIMELINE VIEW ── */}
      {viewMode === "timeline" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.length === 0 && (
            <div className="card" style={{ padding:60, textAlign:"center", color:"#94a3b8" }}>
              <div style={{ fontSize:40 }}>📌</div>
              <div style={{ marginTop:8 }}>{total === 0 ? "No patients yet." : "No patients match filters."}</div>
            </div>
          )}
          {filtered.map(p => {
            const cfg = getStatusConfig(p.status);
            const progress = getJourneyProgress(p.status);
            const waitMins = p.registeredAt ? Math.floor((now - new Date(p.registeredAt)) / 60000) : 0;
            return (
              <div key={p.id} className="card slide-up" style={{ padding:16, cursor:"pointer", borderLeft:`4px solid ${cfg.color}` }} onClick={() => setSelectedPatient(p)}>
                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  {/* Token */}
                  <div style={{ fontFamily:"monospace", fontSize:18, fontWeight:900, color:cfg.color, minWidth:56 }}>{p.token}</div>
                  {/* Name + details */}
                  <div style={{ flex:"1 1 160px" }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>{p.age}y · {p.specialty} · {p.phone}</div>
                  </div>
                  {/* Status pill */}
                  <span className="status-pill" style={{ background:cfg.bg, color:cfg.color }}>{cfg.icon} {cfg.label}</span>
                  {/* Urgency */}
                  <span className={`badge tag-${p.urgency.toLowerCase()}`}>{p.urgency}</span>
                  {/* Journey mini-bar */}
                  <div style={{ flex:"1 1 120px", minWidth:100 }}>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3, fontWeight:600 }}>{progress}% complete</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${progress}%`, background:cfg.color }} />
                    </div>
                  </div>
                  {/* Wait time */}
                  <div style={{ textAlign:"right", minWidth:60 }}>
                    <div style={{ fontSize:16, fontWeight:800, color: waitMins > 60 ? "#dc2626" : waitMins > 30 ? "#d97706" : "#64748b" }}>{waitMins}m</div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>waiting</div>
                  </div>
                  {/* Indicators */}
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {p.needsDilation && <span className="badge tag-dilation" style={{ fontSize:9 }}>💧 Dilation</span>}
                    {p.scanOrdered && <span className="badge" style={{ background:"#fef3c7", color:"#d97706", fontSize:9 }}>🔬 Scan</span>}
                    {p.pharmacyReady && <span className="badge tag-normal" style={{ fontSize:9 }}>✅ Rx Ready</span>}
                    {p.paymentStatus !== "PAID" && <span className="badge" style={{ background:"#fee2e2", color:"#dc2626", fontSize:9 }}>💳 Unpaid</span>}
                  </div>
                  <div style={{ fontSize:11, color:"#94a3b8", minWidth:50, textAlign:"right" }}>{formatTime(p.registeredAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {selectedPatient && (
        <PatientDetailDrawer patient={patients.find(p => p.id === selectedPatient.id) || selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null);
  const [patients, setPatients] = useState([]);

  if (!role) return (<><GlobalCSS /><RoleSelector onSelect={setRole} /></>);

  return (
    <>
      <GlobalCSS />
      <div style={{ minHeight:"100vh", background:`${S[role]?.bg || "#f8fafc"}` }}>
        <TopBar role={role} onBack={() => setRole(null)} patients={patients} />
        {role === "patient"  && <PatientView  patients={patients} setPatients={setPatients} />}
        {role === "nurse"    && <NurseView    patients={patients} setPatients={setPatients} />}
        {role === "doctor"   && <DoctorView   patients={patients} setPatients={setPatients} />}
        {role === "pharmacy" && <PharmacyView patients={patients} setPatients={setPatients} />}
        {role === "admin"    && <AdminView    patients={patients} setPatients={setPatients} />}
      </div>
    </>
  );
}
