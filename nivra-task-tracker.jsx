import { useState } from "react";
import { Plus, X, LayoutGrid, List, Flame, Calendar, Link2, Trash2 } from "lucide-react";

const OWNERS = [
  { id: "meenal", name: "Meenal", role: "Founder", emoji: "🧭", color: "#6B5B95" },
  { id: "kul", name: "Kul", role: "Embedded", emoji: "⚡", color: "#2C6E8C" },
  { id: "you", name: "You", role: "R&D", emoji: "🧪", color: "#3F6E5A" },
];

const TRACKS = [
  { id: "hardware", label: "Hardware", color: "#B8862F" },
  { id: "graphene", label: "Graphene R&D", color: "#C8551F" },
  { id: "docs", label: "Documentation", color: "#5C6B73" },
  { id: "supplier", label: "Supplier", color: "#6B5B95" },
  { id: "patent", label: "Patent", color: "#3F6E5A" },
  { id: "website", label: "Website", color: "#A8402C" },
];

const STATUSES = ["To Do", "In Progress", "Blocked", "Done"];

const STATUS_STYLE = {
  "To Do": { fg: "#5C5A52", bg: "#EDEAE0" },
  "In Progress": { fg: "#8A5A16", bg: "#F5E4C6" },
  "Blocked": { fg: "#8C2E1E", bg: "#F5DCD4" },
  "Done": { fg: "#2E5443", bg: "#DCEAE2" },
};

const seedTasks = [
  { id: 1, title: "Confirm STM32 part number with C-MET", owner: "kul", track: "hardware", status: "In Progress", priority: "High", due: "2026-08-20", notes: "Need exact pin/peripheral match before PCB layout starts." },
  { id: 2, title: "Write graphene fabric washing protocol", owner: "you", track: "graphene", status: "To Do", priority: "Medium", due: "2026-08-25", notes: "" },
  { id: 3, title: "Decide outer fabric (comfort/sweat/hygiene)", owner: "meenal", track: "graphene", status: "To Do", priority: "Medium", due: "", notes: "" },
  { id: 4, title: "Identify micro-ohm resistance connector", owner: "kul", track: "hardware", status: "Blocked", priority: "High", due: "", notes: "Waiting on C-MET recommendation for exact part." },
  { id: 5, title: "Two-thermistor calibration scheme spec", owner: "you", track: "hardware", status: "In Progress", priority: "High", due: "2026-08-22", notes: "For Kul's firmware implementation." },
  { id: 6, title: "Ink supplier decision: Terracarb vs C-MET", owner: "meenal", track: "supplier", status: "To Do", priority: "Medium", due: "", notes: "Pending Barkha's binder research." },
  { id: 7, title: "Claims-by-claims comparison of 4 prior art patents", owner: "you", track: "patent", status: "To Do", priority: "Low", due: "", notes: "US20120143295A1, US20110108538A1, US5105067A, CN209019126U" },
  { id: 8, title: "Draft NIVRA waitlist site copy", owner: "meenal", track: "website", status: "To Do", priority: "Low", due: "", notes: "Avoid medical outcome claims." },
  { id: 9, title: "C-MET lab visit + fabric validation", owner: "meenal", track: "graphene", status: "Done", priority: "High", due: "", notes: "Resolved via Dr. Seema and Dr. Murali." },
  { id: 10, title: "Rule out snap fasteners, confirm PCB placement", owner: "kul", track: "hardware", status: "Done", priority: "Medium", due: "", notes: "" },
];

function ownerInfo(ownerId) {
  return OWNERS.find((o) => o.id === ownerId) ?? { name: "Unassigned", emoji: "❔", color: "#B0AC9E" };
}
function ownerName(ownerId) {
  return ownerInfo(ownerId).name;
}
function trackInfo(trackId) {
  return TRACKS.find((t) => t.id === trackId) ?? TRACKS[0];
}
function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function App() {
  const [tasks, setTasks] = useState(seedTasks);
  const [view, setView] = useState("board");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [activeTask, setActiveTask] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [flippingId, setFlippingId] = useState(null);

  function openTask(task) {
    setFlippingId(task.id);
    setTimeout(() => {
      setActiveTask(task);
      setFlippingId(null);
    }, 260);
  }

  const filtered = tasks.filter(
    (t) =>
      (ownerFilter === "all" || t.owner === ownerFilter) &&
      (trackFilter === "all" || t.track === trackFilter)
  );

  function updateTask(id, patch) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setActiveTask(null);
  }
  function addTask(newTask) {
    setTasks((prev) => [...prev, { ...newTask, id: Date.now() }]);
    setShowAdd(false);
  }

  return (
    <div style={{ background: "#FAF7F1", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: "#1E1B16" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .pill { border: 1px solid #E3DFD3; background: #fff; padding: 5px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 500; cursor: pointer; color: #55524A; transition: all .12s; white-space: nowrap; }
        .pill:hover { border-color: #C8551F; }
        .pill.active { background: #1E1B16; color: #FAF7F1; border-color: #1E1B16; }
        .card { background: #fff; border: 1px solid #EAE6D9; border-radius: 10px; padding: 12px 14px 12px 16px; margin-bottom: 10px; cursor: pointer; position: relative; transition: box-shadow .12s, transform .12s; }
        .card:hover { box-shadow: 0 3px 10px rgba(30,27,22,0.08); transform: translateY(-1px); }
        .avatar { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.5); }
        input, textarea, select { font-family: inherit; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        @keyframes cardFlip { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(90deg); opacity: 0.3; } }
        .card-flip { animation: cardFlip 0.26s ease forwards; transform-style: preserve-3d; }
        @keyframes modalFlipIn { 0% { transform: rotateY(-90deg); opacity: 0; } 60% { transform: rotateY(12deg); opacity: 1; } 100% { transform: rotateY(0deg); opacity: 1; } }
        .modal-flip-in { animation: modalFlipIn 0.38s ease; transform-style: preserve-3d; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #EAE6D9" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 22, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Flame size={20} color="#C8551F" strokeWidth={2.2} />
              NIVRA task tracker
            </h1>
            <p style={{ color: "#8A867A", fontSize: 13.5, margin: "4px 0 0" }}>Prototype — sample data only, nothing here is saved yet</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setView(view === "board" ? "list" : "board")}
              className="pill"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {view === "board" ? <List size={14} /> : <LayoutGrid size={14} />}
              {view === "board" ? "List view" : "Board view"}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="pill"
              style={{ background: "#C8551F", color: "#fff", borderColor: "#C8551F", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={14} /> Add task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className={`pill ${ownerFilter === "all" ? "active" : ""}`} onClick={() => setOwnerFilter("all")}>Everyone</button>
            {OWNERS.map((o) => (
              <button key={o.id} className={`pill ${ownerFilter === o.id ? "active" : ""}`} onClick={() => setOwnerFilter(o.id)}>{o.name}</button>
            ))}
          </div>
          <div style={{ width: 1, background: "#EAE6D9", margin: "0 4px" }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className={`pill ${trackFilter === "all" ? "active" : ""}`} onClick={() => setTrackFilter("all")}>All tracks</button>
            {TRACKS.map((t) => (
              <button key={t.id} className={`pill ${trackFilter === t.id ? "active" : ""}`} onClick={() => setTrackFilter(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Board view */}
      {view === "board" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 16, padding: "20px 32px 40px" }}>
          {STATUSES.map((status) => {
            const items = filtered.filter((t) => t.status === status);
            return (
              <div key={status}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: STATUS_STYLE[status].fg, background: STATUS_STYLE[status].bg, padding: "3px 9px", borderRadius: 6 }}>
                    {status}
                  </span>
                  <span style={{ fontSize: 12, color: "#B0AC9E" }}>{items.length}</span>
                </div>
                {items.map((task) => {
                  const track = trackInfo(task.track);
                  const owner = ownerInfo(task.owner);
                  return (
                    <div key={task.id} style={{ perspective: 700 }}>
                      <div
                        className={`card ${flippingId === task.id ? "card-flip" : ""}`}
                        style={{ borderLeft: `3px solid ${track.color}`, borderRadius: "4px 10px 10px 4px" }}
                        onClick={() => openTask(task)}
                      >
                        <p style={{ fontSize: 13.5, fontWeight: 500, margin: "0 0 8px", lineHeight: 1.4 }}>{task.title}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: track.color, fontWeight: 500 }}>{track.label}</span>
                          <div className="avatar" title={`${owner.name} — ${owner.role}`} style={{ background: owner.color }}>{owner.emoji}</div>
                        </div>
                        {task.due && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, color: "#B0AC9E" }}>
                            <Calendar size={11} /> {fmtDate(task.due)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div style={{ fontSize: 12, color: "#C4C0B4", padding: "10px 4px" }}>No tasks</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div style={{ padding: "20px 32px 40px" }}>
          <div style={{ background: "#fff", border: "1px solid #EAE6D9", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px 130px 110px 90px 90px", padding: "10px 16px", fontSize: 11.5, fontWeight: 600, color: "#8A867A", borderBottom: "1px solid #EAE6D9", background: "#FAF7F1" }}>
              <span>Task</span><span>Owner</span><span>Track</span><span>Status</span><span>Priority</span><span>Due</span>
            </div>
            {filtered.map((task) => {
              const track = trackInfo(task.track);
              const owner = ownerInfo(task.owner);
              return (
                <div
                  key={task.id}
                  className={flippingId === task.id ? "card-flip" : ""}
                  onClick={() => openTask(task)}
                  style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px 130px 110px 90px 90px", padding: "12px 16px", fontSize: 13, borderBottom: "1px solid #F1EEE5", cursor: "pointer", alignItems: "center" }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{task.title}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="avatar" style={{ width: 18, height: 18, fontSize: 10, background: owner.color }}>{owner.emoji}</div>
                    {ownerName(task.owner)}
                  </span>
                  <span style={{ color: track.color, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>{track.label}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: STATUS_STYLE[task.status].fg, background: STATUS_STYLE[task.status].bg, padding: "2px 8px", borderRadius: 6, width: "fit-content" }}>{task.status}</span>
                  <span style={{ color: "#8A867A", fontSize: 12 }}>{task.priority}</span>
                  <span style={{ color: "#8A867A", fontSize: 12 }}>{fmtDate(task.due) || "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTask && (
        <TaskModal
          task={activeTask}
          onClose={() => setActiveTask(null)}
          onSave={(patch) => { updateTask(activeTask.id, patch); setActiveTask({ ...activeTask, ...patch }); }}
          onDelete={() => deleteTask(activeTask.id)}
        />
      )}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addTask} />}
    </div>
  );
}

function fieldLabel(children) {
  return <label style={{ fontSize: 11.5, fontWeight: 600, color: "#8A867A", display: "block", marginBottom: 5 }}>{children}</label>;
}
const inputStyle = { width: "100%", border: "1px solid #E3DFD3", borderRadius: 7, padding: "8px 10px", fontSize: 13.5, background: "#FAF7F1", color: "#1E1B16" };

function TaskModal({ task, onClose, onSave, onDelete }) {
  return (
    <Overlay onClose={onClose} flip>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <input
          value={task.title}
          onChange={(e) => onSave({ title: e.target.value })}
          style={{ ...inputStyle, border: "none", background: "transparent", fontSize: 17, fontWeight: 500, padding: "0", fontFamily: "'Space Grotesk', sans-serif" }}
        />
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#B0AC9E", flexShrink: 0, marginLeft: 8 }}><X size={18} /></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          {fieldLabel("Owner")}
          <select style={inputStyle} value={task.owner} onChange={(e) => onSave({ owner: e.target.value })}>
            {OWNERS.map((o) => <option key={o.id} value={o.id}>{o.name} — {o.role}</option>)}
          </select>
        </div>
        <div>
          {fieldLabel("Track")}
          <select style={inputStyle} value={task.track} onChange={(e) => onSave({ track: e.target.value })}>
            {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          {fieldLabel("Status")}
          <select style={inputStyle} value={task.status} onChange={(e) => onSave({ status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          {fieldLabel("Priority")}
          <select style={inputStyle} value={task.priority} onChange={(e) => onSave({ priority: e.target.value })}>
            {["Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          {fieldLabel("Due date")}
          <input type="date" style={inputStyle} value={task.due} onChange={(e) => onSave({ due: e.target.value })} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        {fieldLabel("Notes / linked doc")}
        <textarea
          style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
          value={task.notes}
          placeholder="Add context, or paste a link to the relevant doc"
          onChange={(e) => onSave({ notes: e.target.value })}
        />
      </div>

      <button
        onClick={onDelete}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #F0DAD4", color: "#A8402C", borderRadius: 7, padding: "7px 12px", fontSize: 12.5, cursor: "pointer" }}
      >
        <Trash2 size={13} /> Delete task
      </button>
    </Overlay>
  );
}

function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", owner: "meenal", track: "hardware", status: "To Do", priority: "Medium", due: "", notes: "" });
  const [error, setError] = useState("");

  function submit() {
    if (!form.title.trim()) { setError("Give the task a title first"); return; }
    onAdd(form);
  }

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 17, margin: "0 0 16px" }}>New task</h3>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel("Title")}
        <input
          style={inputStyle}
          value={form.title}
          placeholder="e.g. Design rigid PCB housing in waistband"
          onChange={(e) => { setForm({ ...form, title: e.target.value }); if (error) setError(""); }}
        />
        {error && <p style={{ color: "#A8402C", fontSize: 12, margin: "5px 0 0" }}>{error}</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          {fieldLabel("Owner")}
          <select style={inputStyle} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
            {OWNERS.map((o) => <option key={o.id} value={o.id}>{o.name} — {o.role}</option>)}
          </select>
        </div>
        <div>
          {fieldLabel("Track")}
          <select style={inputStyle} value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}>
            {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          {fieldLabel("Status")}
          <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          {fieldLabel("Priority")}
          <select style={inputStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {["Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          {fieldLabel("Due date (optional)")}
          <input type="date" style={inputStyle} value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} className="pill">Cancel</button>
        <button onClick={submit} className="pill" style={{ background: "#C8551F", color: "#fff", borderColor: "#C8551F" }}>Add task</button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose, flip }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,27,22,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20, perspective: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={flip ? "modal-flip-in" : ""}
        style={{ background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}
