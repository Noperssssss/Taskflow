import { useState, useEffect, useCallback } from “react”;

const PRIORITY_ORDER = { urgent: 0, high: 1, low: 2 };
const PRIORITY_COLORS = {
urgent: { bg: “#FF3B3B”, text: “#fff” },
high:   { bg: “#FF8C00”, text: “#fff” },
low:    { bg: “#34C759”, text: “#fff” },
};
const HOURS = Array.from({ length: 16 }, (_, i) => i + 8);

function formatHour(h) {
if (h === 12) return “12 PM”;
if (h < 12) return `${h} AM`;
return `${h - 12} PM`;
}
function getTodayStr() { return new Date().toISOString().split(“T”)[0]; }
function scoreTask(task) {
const p = PRIORITY_ORDER[task.priority] ?? 2;
const due = task.dueDate ? new Date(task.dueDate).getTime() : Infinity;
return p * 1e13 + due;
}

const SEED_TASKS = [
{ id: 1,  title: “Create client offer for paid training”,        priority: “high”, dueDate: “2026-04-14”, duration: 1, notes: “”, assignedTo: “”, delegated: false, completed: false, pushedDate: null, createdAt: Date.now() },
{ id: 2,  title: “Try out new squeegee tools; find snips first”, priority: “high”, dueDate: “”, duration: 1, notes: “”, assignedTo: “”, delegated: true,  completed: false, pushedDate: null, createdAt: Date.now() },
{ id: 3,  title: “Follow up with Jared or Chris for new ad”,     priority: “low”,  dueDate: “”, duration: 1, notes: “”, assignedTo: “”, delegated: true,  completed: false, pushedDate: null, createdAt: Date.now() },
{ id: 4,  title: “Pay down Discover card”,                       priority: “low”,  dueDate: “”, duration: 1, notes: “Repeats daily”, assignedTo: “”, delegated: true, completed: false, pushedDate: null, createdAt: Date.now() },
{ id: 5,  title: “Pay auto loan”,                                priority: “low”,  dueDate: “”, duration: 1, notes: “Repeats daily”, assignedTo: “”, delegated: true, completed: false, pushedDate: null, createdAt: Date.now() },
{ id: 6,  title: “Find supplier for fabric with TPU”,            priority: “low”,  dueDate: “”, duration: 1, notes: “Repeats daily”, assignedTo: “”, delegated: true, completed: false, pushedDate: null, createdAt: Date.now() },
{ id: 7,  title: “Create new worker pre-job training”,           priority: “low”,  dueDate: “”, duration: 1, notes: “”, assignedTo: “”, delegated: true, completed: false, pushedDate: null, createdAt: Date.now() },
{ id: 8,  title: “Get new toothbrush”,                           priority: “low”,  dueDate: “”, duration: 1, notes: “Repeats daily”, assignedTo: “”, delegated: true, completed: false, pushedDate: null, createdAt: Date.now() },
{ id: 9,  title: “Reset tire pressure”,                          priority: “low”,  dueDate: “”, duration: 1, notes: “Repeats daily”, assignedTo: “”, delegated: true, completed: false, pushedDate: null, createdAt: Date.now() },
{ id: 10, title: “Create trainee challenge exercises sheet”,      priority: “low”,  dueDate: “”, duration: 1, notes: “”, assignedTo: “”, delegated: true, completed: false, pushedDate: null, createdAt: Date.now() },
];

const SEED_CONTRACT = [
{ id: 1, title: “Client is solely responsible for the removal of all personal property, electronics, appliances, and plug-in devices from the designated work area(s) prior to the start date. Failure to do so constitutes client’s acceptance of all risk of damage or loss to said items. Westar Arbor Painting shall bear no liability for damage to any property not removed from the work area prior to commencement of services.”, checked: false },
];

const labelStyle = { display: “block”, fontSize: 11, color: “#666”, fontFamily: “monospace”, letterSpacing: “0.08em”, marginBottom: 6, textTransform: “uppercase” };
const inputStyle = { width: “100%”, padding: “10px 12px”, borderRadius: 8, border: “1px solid #2a2a2a”, background: “#0f0f0f”, color: “#f0ede6”, fontSize: 14, fontFamily: “‘Georgia’, serif”, marginBottom: 16, boxSizing: “border-box”, outline: “none” };

function tasksToCSV(tasks) {
const header = [“ID”,“Title”,“Type”,“Priority”,“Due Date”,“Duration (min)”,“Assigned To”,“Notes”,“Pushed Date”,“Completed”,“Created At”];
const rows = tasks.map(t => [t.id, `"${(t.title||"").replace(/"/g,'""')}"`, t.delegated?“On My Radar”:“Mine”, t.priority, t.dueDate||””, (t.duration||1)*15, `"${(t.assignedTo||"").replace(/"/g,'""')}"`, `"${(t.notes||"").replace(/"/g,'""')}"`, t.pushedDate||””, t.completed?“Yes”:“No”, t.createdAt?new Date(t.createdAt).toISOString():””]);
return [header,…rows].map(r=>r.join(”,”)).join(”\n”);
}
function downloadCSV(tasks) {
const blob = new Blob([tasksToCSV(tasks)], {type:“text/csv”});
const url = URL.createObjectURL(blob);
const a = document.createElement(“a”);
a.href=url; a.download=`taskflow-${getTodayStr()}.csv`; a.click(); URL.revokeObjectURL(url);
}
function copyCSV(tasks, onFlash) {
navigator.clipboard.writeText(tasksToCSV(tasks)).then(()=>onFlash(“CSV copied ✓”)).catch(()=>onFlash(“Copy failed”));
}

function RadarRow({ task, today, onPush, onComplete, onDelete, onEdit }) {
const pushed = task.pushedDate === today;
const pc = PRIORITY_COLORS[task.priority];
return (
<div style={{padding:“10px 10px 10px 12px”,borderLeft:`2px solid ${task.completed?"#2a2a2a":pushed?"#555":pc.bg+"88"}`,background:task.completed?”#111”:pushed?”#141414”:”#161410”,borderRadius:“0 6px 6px 0”,marginBottom:4,opacity:task.completed?0.35:1,transition:“all 0.2s”}}>
<div style={{display:“flex”,alignItems:“flex-start”,gap:8}}>
<button onClick={()=>!task.completed&&onPush(task.id)} style={{background:“none”,border:“none”,cursor:task.completed?“default”:“pointer”,color:pushed?”#9b8560”:”#555”,fontSize:16,padding:“0 2px”,flexShrink:0,lineHeight:1,fontWeight:700}}>{pushed?“↩”:”—”}</button>
<div style={{flex:1,minWidth:0}}>
<span style={{fontSize:13,color:task.completed?”#444”:pushed?”#666”:”#d4c9b0”,textDecoration:(pushed&&!task.completed)?“line-through”:task.completed?“line-through”:“none”,display:“block”,lineHeight:1.4}}>{task.title}</span>
<div style={{display:“flex”,gap:8,marginTop:3,flexWrap:“wrap”,alignItems:“center”}}>
{task.assignedTo&&<span style={{fontSize:10,color:”#9b8560”,fontFamily:“monospace”}}>→ {task.assignedTo}</span>}
{task.dueDate&&<span style={{fontSize:10,color:”#444”,fontFamily:“monospace”}}>{task.dueDate}</span>}
{task.notes?.includes(“daily”)&&<span style={{fontSize:9,color:”#555”,fontFamily:“monospace”}}>↻ daily</span>}
<span style={{fontSize:9,padding:“1px 5px”,borderRadius:8,background:pc.bg+“33”,color:pc.bg,fontFamily:“monospace”}}>{task.priority.toUpperCase()}</span>
</div>
</div>
<button onClick={()=>onComplete(task.id)} style={{width:17,height:17,borderRadius:“50%”,border:`1.5px solid ${task.completed?"#555":"#333"}`,background:task.completed?”#555”:“transparent”,cursor:“pointer”,flexShrink:0,display:“flex”,alignItems:“center”,justifyContent:“center”,marginTop:2}}>
{task.completed&&<span style={{color:”#fff”,fontSize:9,fontWeight:700}}>✓</span>}
</button>
<button onClick={()=>onEdit(task)} style={{background:“none”,border:“none”,color:”#444”,cursor:“pointer”,fontSize:12,padding:“0 2px”}}>✎</button>
<button onClick={()=>onDelete(task.id)} style={{background:“none”,border:“none”,color:”#2a2a2a”,cursor:“pointer”,fontSize:11,padding:“0 2px”}}>✕</button>
</div>
</div>
);
}

function ContractRow({ item, onToggle, onDelete }) {
return (
<div style={{display:“flex”,alignItems:“flex-start”,gap:8,padding:“9px 10px 9px 12px”,borderLeft:`2px solid ${item.checked?"#2a4a2a":"#1a3a5a"}`,background:item.checked?”#0f1a0f”:”#0f141a”,borderRadius:“0 6px 6px 0”,marginBottom:4,opacity:item.checked?0.5:1,transition:“all 0.2s”}}>
<button onClick={()=>onToggle(item.id)} style={{width:17,height:17,borderRadius:3,border:`1.5px solid ${item.checked?"#34C759":"#2a4a6a"}`,background:item.checked?”#34C75922”:“transparent”,cursor:“pointer”,flexShrink:0,display:“flex”,alignItems:“center”,justifyContent:“center”,marginTop:1}}>
{item.checked&&<span style={{color:”#34C759”,fontSize:10,fontWeight:700}}>✓</span>}
</button>
<span style={{flex:1,fontSize:13,color:item.checked?”#3a5a3a”:”#a0b8c8”,textDecoration:item.checked?“line-through”:“none”,lineHeight:1.4}}>{item.title}</span>
<button onClick={()=>onDelete(item.id)} style={{background:“none”,border:“none”,color:”#1a2a3a”,cursor:“pointer”,fontSize:11,padding:“0 2px”}}>✕</button>
</div>
);
}

export default function TaskFlow() {
const [tasks, setTasks]                     = useState([]);
const [contractItems, setContractItems]     = useState([]);
const [view, setView]                       = useState(“tasks”);
const [showAdd, setShowAdd]                 = useState(false);
const [isRadar, setIsRadar]                 = useState(false);
const [form, setForm]                       = useState({title:””,priority:“high”,dueDate:””,duration:1,notes:””,assignedTo:””});
const [saving, setSaving]                   = useState(false);
const [feedback, setFeedback]               = useState(””);
const [editId, setEditId]                   = useState(null);
const [filterPriority, setFilterPriority]   = useState(“all”);
const [showExport, setShowExport]           = useState(false);
const [loaded, setLoaded]                   = useState(false);
const [showAddContract, setShowAddContract] = useState(false);
const [contractInput, setContractInput]     = useState(””);
const [showResetConfirm, setShowResetConfirm] = useState(false);

useEffect(() => {
try {
const saved = localStorage.getItem(“taskflow-tasks-v8”);
setTasks(saved ? JSON.parse(saved) : SEED_TASKS);
if (!saved) localStorage.setItem(“taskflow-tasks-v8”, JSON.stringify(SEED_TASKS));
} catch { setTasks(SEED_TASKS); }
try {
const saved2 = localStorage.getItem(“taskflow-contract-v2”);
setContractItems(saved2 ? JSON.parse(saved2) : SEED_CONTRACT);
if (!saved2) localStorage.setItem(“taskflow-contract-v2”, JSON.stringify(SEED_CONTRACT));
} catch { setContractItems(SEED_CONTRACT); }
setLoaded(true);
}, []);

const flash = useCallback((msg) => { setFeedback(msg); setTimeout(()=>setFeedback(””),3000); }, []);

function saveTasks(updated) { setTasks(updated); try { localStorage.setItem(“taskflow-tasks-v8”, JSON.stringify(updated)); } catch {} }
function saveContract(updated) { setContractItems(updated); try { localStorage.setItem(“taskflow-contract-v2”, JSON.stringify(updated)); } catch {} }

function openAdd(radar=false) { setForm({title:””,priority:“high”,dueDate:””,duration:1,notes:””,assignedTo:””}); setEditId(null); setIsRadar(radar); setShowAdd(true); }
function openEdit(task) { setForm({title:task.title,priority:task.priority,dueDate:task.dueDate||””,duration:task.duration||1,notes:task.notes||””,assignedTo:task.assignedTo||””}); setEditId(task.id); setIsRadar(!!task.delegated); setShowAdd(true); }

function handleSave() {
if (!form.title.trim()) return;
setSaving(true);
const base = {…form,title:form.title.trim(),delegated:isRadar};
if (editId) { saveTasks(tasks.map(t=>t.id===editId?{…t,…base}:t)); flash(“Updated ✓”); }
else { saveTasks([…tasks,{id:Date.now(),…base,completed:false,pushedDate:null,createdAt:Date.now()}]); flash(isRadar?“Added to radar ✓”:“Task added ✓”); }
setSaving(false); setShowAdd(false);
}

function addContractItem() {
if (!contractInput.trim()) return;
saveContract([…contractItems,{id:Date.now(),title:contractInput.trim(),checked:false}]);
setContractInput(””); setShowAddContract(false); flash(“Added ✓”);
}

function toggleComplete(id) { saveTasks(tasks.map(t=>t.id===id?{…t,completed:!t.completed,pushedDate:null}:t)); }
function togglePushed(id) { const today=getTodayStr(); saveTasks(tasks.map(t=>t.id!==id?t:{…t,pushedDate:t.pushedDate===today?null:today})); }
function deleteTask(id) { saveTasks(tasks.filter(t=>t.id!==id)); flash(“Removed”); }
function toggleContractItem(id) { saveContract(contractItems.map(i=>i.id===id?{…i,checked:!i.checked}:i)); }
function deleteContractItem(id) { saveContract(contractItems.filter(i=>i.id!==id)); }
function resetContractChecks() { saveContract(contractItems.map(i=>({…i,checked:false}))); setShowResetConfirm(false); flash(“Reset ✓”); }

function buildSchedule() {
const active = tasks.filter(t=>!t.completed&&!t.delegated).sort((a,b)=>scoreTask(a)-scoreTask(b));
let slot=8*60, blocks=[];
for (const task of active) { const mins=(task.duration||1)*15; if(slot+mins>23*60) break; blocks.push({task,startMin:slot,endMin:slot+mins}); slot+=mins; }
return blocks;
}

const today=getTodayStr();
const myTasks=tasks.filter(t=>!t.delegated);
const radarTasks=tasks.filter(t=>t.delegated);
const sortedMine=[…myTasks].sort((a,b)=>a.completed!==b.completed?(a.completed?1:-1):scoreTask(a)-scoreTask(b));
const filteredMine=filterPriority===“all”?sortedMine:sortedMine.filter(t=>t.priority===filterPriority);
const radarActive=radarTasks.filter(t=>!t.completed&&t.pushedDate!==today);
const radarPushed=radarTasks.filter(t=>!t.completed&&t.pushedDate===today);
const radarCompleted=radarTasks.filter(t=>t.completed);
const schedule=buildSchedule();
const incomplete=myTasks.filter(t=>!t.completed).length;
const radarPending=radarTasks.filter(t=>!t.completed).length;
const contractPending=contractItems.filter(i=>!i.checked).length;

if (!loaded) return <div style={{background:”#0f0f0f”,minHeight:“100vh”,display:“flex”,alignItems:“center”,justifyContent:“center”,color:”#444”,fontFamily:“monospace”,fontSize:13}}>Loading…</div>;

return (
<div style={{fontFamily:”‘Georgia’, serif”,minHeight:“100vh”,background:”#0f0f0f”,color:”#f0ede6”}}>
<div style={{position:“fixed”,inset:0,opacity:0.03,backgroundImage:“url("data:image/svg+xml,%3Csvg viewBox=‘0 0 256 256’ xmlns=‘http://www.w3.org/2000/svg’%3E%3Cfilter id=‘noise’%3E%3CfeTurbulence type=‘fractalNoise’ baseFrequency=‘0.9’ numOctaves=‘4’ stitchTiles=‘stitch’/%3E%3C/filter%3E%3Crect width=‘100%25’ height=‘100%25’ filter=‘url(%23noise)’/%3E%3C/svg%3E")”,pointerEvents:“none”,zIndex:0}} />
{feedback&&<div style={{position:“fixed”,top:24,right:24,background:”#c8a96e”,color:”#0f0f0f”,padding:“10px 20px”,borderRadius:8,fontFamily:“monospace”,fontSize:13,zIndex:300,fontWeight:700,maxWidth:320}}>{feedback}</div>}

```
  <div style={{maxWidth:1300,margin:"0 auto",padding:"0 20px 80px",position:"relative",zIndex:1}}>
    <div style={{paddingTop:48,marginBottom:32}}>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:4}}>
        <div style={{display:"flex",alignItems:"baseline",gap:16}}>
          <h1 style={{margin:0,fontSize:36,fontWeight:400,letterSpacing:"-1px"}}>TaskFlow</h1>
          <span style={{fontSize:12,color:"#555",fontFamily:"monospace"}}>{incomplete} mine · {radarPending} on radar · {contractPending} contract items</span>
        </div>
        <button onClick={()=>setShowExport(true)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #2a2a2a",background:"transparent",color:"#666",cursor:"pointer",fontFamily:"monospace",fontSize:11,letterSpacing:"0.08em"}}>⬆ EXPORT</button>
      </div>
      <div style={{height:1,background:"linear-gradient(90deg, #c8a96e 0%, transparent 70%)",marginBottom:26}} />
      <div style={{display:"flex",gap:2,background:"#1a1a1a",borderRadius:8,padding:3,width:"fit-content"}}>
        {["tasks","schedule"].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{padding:"7px 20px",borderRadius:6,border:"none",cursor:"pointer",fontSize:13,fontFamily:"'Georgia', serif",letterSpacing:"0.04em",background:view===v?"#c8a96e":"transparent",color:view===v?"#0f0f0f":"#777",fontWeight:view===v?700:400,transition:"all 0.2s"}}>{v==="tasks"?"Tasks":"Schedule"}</button>
        ))}
      </div>
    </div>

    <div style={{display:"flex",gap:28,alignItems:"flex-start",flexWrap:"wrap"}}>

      {/* COL 1 */}
      <div style={{flex:"1 1 300px",minWidth:0}}>
        {view==="tasks"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:11,color:"#666",fontFamily:"monospace",letterSpacing:"0.1em",textTransform:"uppercase"}}>My Tasks</span>
              <div style={{display:"flex",gap:5}}>
                {["all","urgent","high","low"].map(p=>{const pc=PRIORITY_COLORS[p];return<button key={p} onClick={()=>setFilterPriority(p)} style={{padding:"3px 9px",borderRadius:20,border:`1px solid ${p==="all"?"#333":pc?.bg+"88"}`,background:filterPriority===p?(p==="all"?"#333":pc?.bg):"transparent",color:filterPriority===p?(p==="all"?"#fff":pc?.text):"#555",fontSize:9,cursor:"pointer",fontFamily:"monospace",letterSpacing:"0.07em"}}>{p.toUpperCase()}</button>;})}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filteredMine.length===0&&<div style={{color:"#333",padding:"40px 0",fontSize:14,fontStyle:"italic",textAlign:"center"}}>No tasks yet.</div>}
              {filteredMine.map(task=>{const pc=PRIORITY_COLORS[task.priority];return(
                <div key={task.id} style={{background:task.completed?"#131313":"#1a1a1a",border:"1px solid #222",borderLeft:`3px solid ${task.completed?"#2a2a2a":pc.bg}`,borderRadius:10,padding:"13px 14px",display:"flex",gap:12,alignItems:"flex-start",opacity:task.completed?0.4:1,transition:"all 0.2s"}}>
                  <button onClick={()=>toggleComplete(task.id)} style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${task.completed?"#555":pc.bg}`,background:task.completed?"#555":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>
                    {task.completed&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
                  </button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:14,color:task.completed?"#555":"#f0ede6",textDecoration:task.completed?"line-through":"none"}}>{task.title}</span>
                      <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,fontFamily:"monospace",background:pc.bg,color:pc.text}}>{task.priority.toUpperCase()}</span>
                    </div>
                    <div style={{display:"flex",gap:12,marginTop:4,flexWrap:"wrap"}}>
                      {task.dueDate&&<span style={{fontSize:11,color:"#555",fontFamily:"monospace"}}>Due: {task.dueDate}</span>}
                      <span style={{fontSize:11,color:"#444",fontFamily:"monospace"}}>{(task.duration||1)*15} min</span>
                      {task.notes&&<span style={{fontSize:11,color:"#444",fontStyle:"italic"}}>{task.notes}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>openEdit(task)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:13}}>✎</button>
                    <button onClick={()=>deleteTask(task.id)} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                </div>
              );})}
            </div>
            <button onClick={()=>openAdd(false)} style={{marginTop:18,width:"100%",padding:"12px",borderRadius:10,border:"1px dashed #2a2a2a",background:"transparent",color:"#c8a96e",fontSize:13,cursor:"pointer",fontFamily:"'Georgia', serif"}}>+ Add My Task</button>
          </div>
        )}
        {view==="schedule"&&(
          <div>
            <div style={{marginBottom:14,color:"#555",fontSize:11,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.1em"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
            {schedule.length===0&&<div style={{color:"#333",padding:"40px 0",fontSize:14,fontStyle:"italic",textAlign:"center"}}>No tasks to schedule.</div>}
            {HOURS.map(h=>{const blocks=schedule.filter(b=>Math.floor(b.startMin/60)===h);return(
              <div key={h} style={{display:"flex",gap:14,minHeight:40}}>
                <div style={{width:46,flexShrink:0,paddingTop:3,fontSize:10,color:"#3a3a3a",fontFamily:"monospace",textAlign:"right",paddingRight:8,borderRight:"1px solid #1c1c1c"}}>{formatHour(h)}</div>
                <div style={{flex:1,paddingBottom:3,paddingTop:2}}>
                  {blocks.map(({task,startMin,endMin})=>{const pc=PRIORITY_COLORS[task.priority];return<div key={task.id} style={{background:pc.bg+"15",border:`1px solid ${pc.bg}33`,borderLeft:`3px solid ${pc.bg}`,borderRadius:6,padding:"5px 10px",marginBottom:3}}><div style={{fontSize:13,color:"#f0ede6"}}>{task.title}</div><div style={{fontSize:10,color:"#555",fontFamily:"monospace",marginTop:2}}>{formatHour(Math.floor(startMin/60))}:{String(startMin%60).padStart(2,"0")} · {endMin-startMin} min <span style={{marginLeft:8,color:pc.bg}}>{task.priority.toUpperCase()}</span></div></div>;})}
                  {blocks.length===0&&<div style={{height:1,background:"#141414",marginTop:16}} />}
                </div>
              </div>
            );})}
          </div>
        )}
      </div>

      {/* COL 2 — Radar */}
      <div style={{flex:"0 1 250px",minWidth:200}}>
        <div style={{position:"sticky",top:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:11,color:"#9b8560",fontFamily:"monospace",letterSpacing:"0.12em",textTransform:"uppercase"}}>On My Radar</span>
            <span style={{fontSize:10,color:"#444",fontFamily:"monospace"}}>{radarPending} open</span>
          </div>
          <div style={{height:1,background:"linear-gradient(90deg, #9b8560 0%, transparent 80%)",marginBottom:12}} />
          <div style={{display:"flex",gap:14,marginBottom:14}}>
            <span style={{fontSize:10,color:"#444",fontFamily:"monospace"}}>— pushed today</span>
            <span style={{fontSize:10,color:"#444",fontFamily:"monospace"}}>◯ fully done</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {radarActive.map(task=><RadarRow key={task.id} task={task} today={today} onPush={togglePushed} onComplete={toggleComplete} onDelete={deleteTask} onEdit={openEdit} />)}
            {radarPushed.length>0&&<><div style={{fontSize:9,color:"#3a3a3a",fontFamily:"monospace",marginTop:14,marginBottom:6,letterSpacing:"0.1em"}}>PUSHED TODAY</div>{radarPushed.map(task=><RadarRow key={task.id} task={task} today={today} onPush={togglePushed} onComplete={toggleComplete} onDelete={deleteTask} onEdit={openEdit} />)}</>}
            {radarCompleted.length>0&&<><div style={{fontSize:9,color:"#2a2a2a",fontFamily:"monospace",marginTop:14,marginBottom:6,letterSpacing:"0.1em"}}>COMPLETED</div>{radarCompleted.map(task=><RadarRow key={task.id} task={task} today={today} onPush={togglePushed} onComplete={toggleComplete} onDelete={deleteTask} onEdit={openEdit} />)}</>}
            {radarTasks.length===0&&<div style={{color:"#2a2a2a",fontSize:12,fontStyle:"italic",padding:"24px 0",textAlign:"center"}}>Nothing on radar yet.</div>}
          </div>
          <button onClick={()=>openAdd(true)} style={{marginTop:14,width:"100%",padding:"10px",borderRadius:8,border:"1px dashed #211f1a",background:"transparent",color:"#9b8560",fontSize:12,cursor:"pointer",fontFamily:"'Georgia', serif"}}>+ Add to Radar</button>
        </div>
      </div>

      {/* COL 3 — Contract */}
      <div style={{flex:"0 1 230px",minWidth:190}}>
        <div style={{position:"sticky",top:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:11,color:"#2a6a9a",fontFamily:"monospace",letterSpacing:"0.12em",textTransform:"uppercase"}}>Contract Checklist</span>
            <span style={{fontSize:10,color:"#444",fontFamily:"monospace"}}>{contractPending} left</span>
          </div>
          <div style={{height:1,background:"linear-gradient(90deg, #2a6a9a 0%, transparent 80%)",marginBottom:10}} />
          <p style={{fontSize:10,color:"#444",fontFamily:"monospace",margin:"0 0 12px",lineHeight:1.5}}>Items to include in every contract. Check off as you draft, reset when done.</p>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {contractItems.length===0&&<div style={{color:"#1a2a3a",fontSize:12,fontStyle:"italic",padding:"20px 0",textAlign:"center"}}>No items yet.</div>}
            {contractItems.map(item=><ContractRow key={item.id} item={item} onToggle={toggleContractItem} onDelete={deleteContractItem} />)}
          </div>
          <div style={{display:"flex",gap:6,marginTop:14}}>
            <button onClick={()=>setShowAddContract(true)} style={{flex:1,padding:"9px",borderRadius:8,border:"1px dashed #1a3a5a",background:"transparent",color:"#2a6a9a",fontSize:12,cursor:"pointer",fontFamily:"'Georgia', serif"}}>+ Add Item</button>
            {contractItems.some(i=>i.checked)&&<button onClick={()=>setShowResetConfirm(true)} style={{padding:"9px 12px",borderRadius:8,border:"1px solid #1a2a3a",background:"transparent",color:"#3a5a3a",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>↺ Reset</button>}
          </div>
          {showAddContract&&(
            <div style={{marginTop:12,background:"#0d1520",border:"1px solid #1a3a5a",borderRadius:8,padding:12}}>
              <input value={contractInput} onChange={e=>setContractInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addContractItem()} placeholder="e.g. Payment terms…" style={{...inputStyle,marginBottom:8,fontSize:13}} autoFocus />
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{setShowAddContract(false);setContractInput("");}} style={{flex:1,padding:"8px",borderRadius:6,border:"1px solid #1a2a3a",background:"transparent",color:"#444",cursor:"pointer",fontSize:12}}>Cancel</button>
                <button onClick={addContractItem} style={{flex:2,padding:"8px",borderRadius:6,border:"none",background:contractInput.trim()?"#2a6a9a":"#1a2a3a",color:contractInput.trim()?"#fff":"#444",cursor:contractInput.trim()?"pointer":"default",fontSize:12,fontWeight:700}}>Add</button>
              </div>
            </div>
          )}
          {showResetConfirm&&(
            <div style={{marginTop:10,background:"#0d1a0d",border:"1px solid #1a3a1a",borderRadius:8,padding:12}}>
              <p style={{fontSize:12,color:"#4a6a4a",margin:"0 0 10px",fontFamily:"monospace"}}>Uncheck all for a new contract?</p>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setShowResetConfirm(false)} style={{flex:1,padding:"8px",borderRadius:6,border:"1px solid #1a3a1a",background:"transparent",color:"#444",cursor:"pointer",fontSize:12}}>Cancel</button>
                <button onClick={resetContractChecks} style={{flex:2,padding:"8px",borderRadius:6,border:"none",background:"#34C75922",color:"#34C759",cursor:"pointer",fontSize:12,fontWeight:700}}>Reset All</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

  {/* EXPORT */}
  {showExport&&(
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#161616",border:"1px solid #2a2a2a",borderTop:"3px solid #34C759",borderRadius:14,padding:28,width:"100%",maxWidth:400}}>
        <h2 style={{margin:"0 0 6px",fontSize:18,fontWeight:400,color:"#34C759"}}>Export to Google Sheets</h2>
        <p style={{margin:"0 0 24px",fontSize:12,color:"#555",fontFamily:"monospace"}}>{tasks.length} tasks · CSV format</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>{copyCSV(tasks,flash);setShowExport(false);}} style={{padding:"14px",borderRadius:10,border:"1px solid #2a3a2a",background:"#0f1a0f",color:"#34C759",cursor:"pointer",fontFamily:"'Georgia', serif",fontSize:14,textAlign:"left"}}>
            <div style={{fontWeight:700,marginBottom:3}}>📋 Copy to Clipboard</div>
            <div style={{fontSize:11,color:"#4a6a4a",fontFamily:"monospace"}}>Open Google Sheets → paste with Cmd/Ctrl+V</div>
          </button>
          <button onClick={()=>{downloadCSV(tasks);flash("CSV downloaded ✓");setShowExport(false);}} style={{padding:"14px",borderRadius:10,border:"1px solid #2a3a2a",background:"#0f1a0f",color:"#34C759",cursor:"pointer",fontFamily:"'Georgia', serif",fontSize:14,textAlign:"left"}}>
            <div style={{fontWeight:700,marginBottom:3}}>⬇ Download CSV File</div>
            <div style={{fontSize:11,color:"#4a6a4a",fontFamily:"monospace"}}>Save → import into Google Sheets via File → Import</div>
          </button>
        </div>
        <button onClick={()=>setShowExport(false)} style={{marginTop:16,width:"100%",padding:"10px",borderRadius:8,border:"1px solid #222",background:"transparent",color:"#555",cursor:"pointer",fontFamily:"'Georgia', serif",fontSize:14}}>Cancel</button>
      </div>
    </div>
  )}

  {/* ADD/EDIT */}
  {showAdd&&(
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#161616",border:`1px solid ${isRadar?"#2a2520":"#2a2a2a"}`,borderTop:`3px solid ${isRadar?"#9b8560":"#c8a96e"}`,borderRadius:14,padding:28,width:"100%",maxWidth:420}}>
        <h2 style={{margin:"0 0 4px",fontSize:18,fontWeight:400,color:isRadar?"#9b8560":"#c8a96e"}}>{editId?"Edit":isRadar?"Add to Radar":"New Task"}</h2>
        <p style={{margin:"0 0 20px",fontSize:11,color:"#444",fontFamily:"monospace"}}>{isRadar?"Things to keep pushing forward":"Your task — goes into your schedule"}</p>
        <label style={labelStyle}>Title</label>
        <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder={isRadar?"What needs to keep moving?":"What do you need to do?"} style={inputStyle} autoFocus />
        {isRadar&&<><label style={labelStyle}>Assigned To <span style={{color:"#444",textTransform:"none",letterSpacing:0}}>(optional)</span></label><input value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} placeholder="Person, team, or leave blank…" style={inputStyle} /></>}
        <label style={labelStyle}>Priority</label>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {["urgent","high","low"].map(p=>{const pc=PRIORITY_COLORS[p];return<button key={p} onClick={()=>setForm({...form,priority:p})} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${form.priority===p?pc.bg:"#2a2a2a"}`,background:form.priority===p?pc.bg+"22":"transparent",color:form.priority===p?pc.bg:"#444",cursor:"pointer",fontSize:11,fontFamily:"monospace",transition:"all 0.15s"}}>{p.toUpperCase()}</button>;})}
        </div>
        <label style={labelStyle}>Due Date <span style={{color:"#444",textTransform:"none",letterSpacing:0}}>{isRadar?"(optional)":""}</span></label>
        <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} style={inputStyle} />
        {!isRadar&&<><label style={labelStyle}>Duration</label><div style={{display:"flex",gap:8,marginBottom:16}}>{[1,2,4,8].map(d=><button key={d} onClick={()=>setForm({...form,duration:d})} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${form.duration===d?"#c8a96e":"#2a2a2a"}`,background:form.duration===d?"#c8a96e22":"transparent",color:form.duration===d?"#c8a96e":"#444",cursor:"pointer",fontSize:11,fontFamily:"monospace"}}>{d*15}m</button>)}</div></>}
        <label style={labelStyle}>Notes</label>
        <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Context, links, details…" style={inputStyle} />
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"11px",borderRadius:8,border:"1px solid #2a2a2a",background:"transparent",color:"#555",cursor:"pointer",fontFamily:"'Georgia', serif",fontSize:14}}>Cancel</button>
          <button onClick={handleSave} disabled={saving||!form.title.trim()} style={{flex:2,padding:"11px",borderRadius:8,border:"none",background:form.title.trim()?(isRadar?"#9b8560":"#c8a96e"):"#222",color:form.title.trim()?"#0f0f0f":"#444",cursor:form.title.trim()?"pointer":"default",fontFamily:"'Georgia', serif",fontSize:14,fontWeight:700,transition:"all 0.2s"}}>{saving?"Saving…":editId?"Update":isRadar?"Add to Radar":"Add Task"}</button>
        </div>
      </div>
    </div>
  )}
</div>
```

);
}
