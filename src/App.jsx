import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, Plus, Trash2, ArrowUp, ArrowDown, X,
  ListMusic, Library, UserRound, Image as ImageIcon, Pencil, Check
} from "lucide-react";

/* ----------------------------- design tokens ----------------------------- */
const T = {
  bg: "#16120C",
  surface: "#201A11",
  surface2: "#2B2316",
  line: "#3C3220",
  text: "#F2E9D6",
  dim: "#A8987A",
  faint: "#6E6048",
  amber: "#E8A33D",
  amberDeep: "#8A6420",
};

const INSTRUMENTS = [
  { id: "drums", label: "Drums", color: "#E07A5F" },
  { id: "bas", label: "Bas", color: "#81B29A" },
  { id: "gitaar", label: "Gitaar", color: "#E8A33D" },
  { id: "zang", label: "Zang", color: "#C98BC9" },
  { id: "toetsen", label: "Toetsen", color: "#6FA8DC" },
];
const instById = (id) => INSTRUMENTS.find((i) => i.id === id);

/* ------------------------------- demo data ------------------------------- */
/* BPM/toonsoort zijn startschattingen waar bekend — alles is aanpasbaar */
const seedSongs = [
  { id: 1, set: 1, title: "Hold Me", artist: "Anouk & Douwe Bob" },
  { id: 2, set: 1, title: "Roller Coaster", artist: "Danny Vera" },
  { id: 3, set: 1, title: "Wrong", artist: "Novastar" },
  { id: 4, set: 1, title: "World of Hurt", artist: "Ilse DeLange" },
  { id: 5, set: 1, title: "The River", artist: "Bruce Springsteen" },
  { id: 6, set: 1, title: "Lose Control", artist: "Teddy Swims" },
  {
    id: 7, set: 1, title: "Come Together", artist: "The Beatles",
    bpm: 82, key: "Dm", countIn: "Drums + bas (riff)",
    notes: "Strakke pocket. Riff van bas en drums moet als één klinken.",
    structure: [
      { label: "Intro", bars: 4, instruments: ["drums", "bas"] },
      { label: "Couplet 1", bars: 8, instruments: ["drums", "bas", "zang"] },
      { label: "Refrein", bars: 4, instruments: ["drums", "bas", "gitaar", "zang", "toetsen"] },
      { label: "Couplet 2", bars: 8, instruments: ["drums", "bas", "zang", "gitaar"] },
      { label: "Refrein", bars: 4, instruments: ["drums", "bas", "gitaar", "zang", "toetsen"] },
      { label: "Solo", bars: 8, instruments: ["drums", "bas", "gitaar", "toetsen"] },
      { label: "Outro", bars: 8, instruments: ["drums", "bas", "gitaar", "zang", "toetsen"] },
    ],
  },
  { id: 8, set: 2, title: "Mercy", artist: "Duffy", bpm: 130 },
  { id: 9, set: 2, title: "Crazy Little Thing Called Love", artist: "Queen", bpm: 154, key: "D", countIn: "Zang" },
  { id: 10, set: 2, title: "Rehab", artist: "Amy Winehouse", bpm: 145, key: "Cm" },
  { id: 11, set: 2, title: "Losing My Religion", artist: "R.E.M.", bpm: 126, key: "Am" },
  { id: 12, set: 2, title: "One", artist: "U2", bpm: 91, key: "Am" },
  { id: 13, set: 2, title: "These Boots Are Made for Walkin'", artist: "Nancy Sinatra", key: "E" },
  { id: 14, set: 2, title: "Beds Are Burning", artist: "Midnight Oil", key: "Em" },
  { id: 15, set: 3, title: "Multicolor", artist: "Son Mieux" },
  {
    id: 16, set: 3, title: "Go Your Own Way", artist: "Fleetwood Mac",
    bpm: 134, key: "F",
    structure: [
      { label: "Intro", bars: 4, instruments: ["drums", "gitaar"] },
      { label: "Couplet 1", bars: 8, instruments: ["drums", "gitaar", "bas", "zang"] },
      { label: "Refrein", bars: 8, instruments: ["drums", "gitaar", "bas", "zang", "toetsen"] },
      { label: "Couplet 2", bars: 8, instruments: ["drums", "gitaar", "bas", "zang"] },
      { label: "Refrein", bars: 8, instruments: ["drums", "gitaar", "bas", "zang", "toetsen"] },
      { label: "Solo", bars: 16, instruments: ["drums", "gitaar", "bas", "toetsen"] },
      { label: "Refrein / outro", bars: 8, instruments: ["drums", "gitaar", "bas", "zang", "toetsen"] },
    ],
  },
  { id: 17, set: 3, title: "Never Be Clever", artist: "Herman Brood" },
  { id: 18, set: 3, title: "Venus", artist: "Shocking Blue" },
  { id: 19, set: 3, title: "Bad Woman Blues", artist: "Beth Hart" },
  { id: 20, set: 3, title: "Don't You (Forget About Me)", artist: "Simple Minds" },
  { id: 21, set: 3, title: "Iedereen Is Van De Wereld", artist: "The Scene" },
  { id: 22, set: 3, title: "Sex on Fire", artist: "Kings of Leon", bpm: 153 },
  { id: 23, set: 3, title: "I've Got a Feeling", artist: "The Beatles", key: "A" },
].map((s) => ({
  bpm: null, key: "", countIn: "", notes: "", structure: [], ...s,
}));

const SET_TITLES = { 1: "Openers / builders", 2: "Swing / soul", 3: "Rock" };
const STORAGE_KEY = "bandapp:v1";
const IMG_PREFIX = "bandapp:img:";

/* Opslag op dit apparaat via localStorage */
const storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v == null ? null : { key, value: v };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
};

/* --------------------------------- helpers ------------------------------- */
function compressImage(file, maxDim = 1500) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ------------------------------ tiny components -------------------------- */
function Chip({ label, value, onChange, mono = true, width = 64, placeholder = "—" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);
  const commit = () => { setEditing(false); onChange(draft); };
  return (
    <div className="flex flex-col items-stretch" style={{ minWidth: width }}>
      <span className="uppercase tracking-widest" style={{ fontSize: 9, color: T.faint, fontFamily: "'Barlow', sans-serif", letterSpacing: "0.14em" }}>
        {label}
      </span>
      {editing ? (
        <input
          autoFocus value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="bg-transparent outline-none"
          style={{ color: T.amber, borderBottom: `1px solid ${T.amber}`, fontFamily: mono ? "'IBM Plex Mono', monospace" : "'Barlow', sans-serif", fontSize: 16, padding: "2px 0" }}
        />
      ) : (
        <button onClick={() => setEditing(true)} className="text-left" style={{ color: value ? T.text : T.faint, fontFamily: mono ? "'IBM Plex Mono', monospace" : "'Barlow', sans-serif", fontSize: 16, padding: "2px 0", borderBottom: `1px dashed ${T.line}` }}>
          {value || placeholder}
        </button>
      )}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div className="flex items-end justify-between mt-6 mb-2">
      <h3 className="uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "0.18em", color: T.dim }}>
        {children}
      </h3>
      {right}
    </div>
  );
}

/* ---------------------------- structure timeline ------------------------- */
const BAR_W = 18;

function Timeline({ structure, myInstrument }) {
  if (!structure.length) return null;
  let cum = 1;
  const blocks = structure.map((b) => {
    const start = cum; cum += b.bars;
    return { ...b, start };
  });
  const totalBars = cum - 1;
  return (
    <div className="flex" style={{ border: `1px solid ${T.line}`, borderRadius: 10, background: T.surface, overflow: "hidden" }}>
      {/* sticky instrument labels */}
      <div className="flex flex-col" style={{ borderRight: `1px solid ${T.line}`, background: T.surface2, flexShrink: 0 }}>
        <div style={{ height: 40 }} />
        {INSTRUMENTS.map((ins) => (
          <div key={ins.id} className="flex items-center px-2" style={{ height: 30, gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: ins.color, opacity: 0.9, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: ins.id === myInstrument ? T.amber : T.dim, fontWeight: ins.id === myInstrument ? 600 : 400 }}>
              {ins.label}
            </span>
          </div>
        ))}
      </div>
      {/* scrollable grid */}
      <div className="overflow-x-auto" style={{ flexGrow: 1 }}>
        <div style={{ width: totalBars * BAR_W + 8, padding: "0 4px" }}>
          {/* block labels + maat numbers */}
          <div className="flex" style={{ height: 40 }}>
            {blocks.map((b, i) => (
              <div key={i} className="flex flex-col justify-end" style={{ width: b.bars * BAR_W, borderLeft: i ? `1px solid ${T.line}` : "none", paddingLeft: 4, paddingBottom: 3 }}>
                <span className="truncate" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 13, color: T.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {b.label}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: T.faint }}>
                  m.{b.start}–{b.start + b.bars - 1}
                </span>
              </div>
            ))}
          </div>
          {/* instrument rows */}
          {INSTRUMENTS.map((ins) => (
            <div key={ins.id} className="flex items-center" style={{ height: 30 }}>
              {blocks.map((b, i) => {
                const on = b.instruments.includes(ins.id);
                return (
                  <div key={i} style={{ width: b.bars * BAR_W, padding: "0 2px", borderLeft: i ? `1px solid ${T.line}` : "none", height: "100%", display: "flex", alignItems: "center" }}>
                    <div style={{
                      width: "100%", height: 14, borderRadius: 4,
                      background: on ? ins.color : "transparent",
                      opacity: on ? (ins.id === myInstrument ? 1 : 0.78) : 1,
                      border: on ? "none" : `1px dashed ${T.line}`,
                      boxShadow: on && ins.id === myInstrument ? `0 0 8px ${ins.color}55` : "none",
                    }} />
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ height: 6 }} />
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange, onDelete, onMove, isFirst, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 8, background: T.surface, marginBottom: 6 }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 text-left">
        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: T.text }}>
          {block.label || "Naamloos blok"}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.faint, marginLeft: 8 }}>{block.bars} maten</span>
        </span>
        <Pencil size={14} color={T.faint} />
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col" style={{ gap: 10, borderTop: `1px solid ${T.line}`, paddingTop: 10 }}>
          <div className="flex" style={{ gap: 10 }}>
            <input
              value={block.label} placeholder="Naam (intro, couplet...)"
              onChange={(e) => onChange({ ...block, label: e.target.value })}
              className="bg-transparent outline-none flex-grow"
              style={{ color: T.text, borderBottom: `1px solid ${T.line}`, fontFamily: "'Barlow', sans-serif", fontSize: 14, padding: "4px 0" }}
            />
            <input
              type="number" min={1} value={block.bars}
              onChange={(e) => onChange({ ...block, bars: Math.max(1, parseInt(e.target.value) || 1) })}
              className="bg-transparent outline-none text-center"
              style={{ color: T.amber, borderBottom: `1px solid ${T.line}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, width: 56 }}
            />
          </div>
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {INSTRUMENTS.map((ins) => {
              const on = block.instruments.includes(ins.id);
              return (
                <button key={ins.id}
                  onClick={() => onChange({
                    ...block,
                    instruments: on ? block.instruments.filter((x) => x !== ins.id) : [...block.instruments, ins.id],
                  })}
                  style={{
                    padding: "5px 11px", borderRadius: 99, fontSize: 12, fontFamily: "'Barlow', sans-serif",
                    border: `1px solid ${on ? ins.color : T.line}`,
                    background: on ? `${ins.color}26` : "transparent",
                    color: on ? ins.color : T.faint,
                  }}>
                  {ins.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex" style={{ gap: 6 }}>
              <button disabled={isFirst} onClick={() => onMove(-1)} style={{ opacity: isFirst ? 0.3 : 1, padding: 6 }}><ArrowUp size={15} color={T.dim} /></button>
              <button disabled={isLast} onClick={() => onMove(1)} style={{ opacity: isLast ? 0.3 : 1, padding: 6 }}><ArrowDown size={15} color={T.dim} /></button>
            </div>
            <button onClick={onDelete} className="flex items-center" style={{ gap: 5, color: "#C66", fontSize: 12, fontFamily: "'Barlow', sans-serif", padding: 6 }}>
              <Trash2 size={14} /> Verwijder blok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ song detail ------------------------------ */
function SongScreen({ song, update, remove, back, myInstrument, images, setImage }) {
  const [showEditor, setShowEditor] = useState(false);
  const [viewer, setViewer] = useState(null); // dataURL
  const fileRefs = useRef({});

  const set = (patch) => update({ ...song, ...patch });
  const updBlock = (i, b) => {
    const s = [...song.structure]; s[i] = b; set({ structure: s });
  };
  const moveBlock = (i, dir) => {
    const s = [...song.structure];
    const [b] = s.splice(i, 1); s.splice(i + dir, 0, b);
    set({ structure: s });
  };
  const sheetOrder = useMemo(() => {
    const rest = INSTRUMENTS.filter((i) => i.id !== myInstrument);
    const mine = INSTRUMENTS.find((i) => i.id === myInstrument);
    return mine ? [mine, ...rest] : INSTRUMENTS;
  }, [myInstrument]);

  return (
    <div className="pb-28">
      <div className="flex items-center px-2 pt-3" style={{ gap: 4 }}>
        <button onClick={back} className="p-2"><ChevronLeft size={22} color={T.dim} /></button>
        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.faint }}>
          {song.set ? `Set ${song.set}` : "Repertoire"}
        </span>
      </div>

      <div className="px-4">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 34, lineHeight: 1.05, color: T.text, textTransform: "uppercase", letterSpacing: "0.02em" }}>
          {song.title}
        </h1>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 15, color: T.dim, marginTop: 2 }}>{song.artist}</p>

        {/* chips */}
        <div className="flex flex-wrap mt-4" style={{ gap: 16, rowGap: 12 }}>
          <Chip label="BPM" value={song.bpm ? String(song.bpm) : ""} onChange={(v) => set({ bpm: v ? parseInt(v) || null : null })} width={56} />
          <Chip label="Toonsoort" value={song.key} onChange={(v) => set({ key: v })} width={72} />
          <Chip label="Wie zet in" value={song.countIn} onChange={(v) => set({ countIn: v })} mono={false} width={120} />
        </div>

        {/* structure */}
        <SectionTitle right={
          <button onClick={() => setShowEditor(!showEditor)} style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.amber, padding: "4px 8px" }}>
            {showEditor ? "Klaar" : "Bewerken"}
          </button>
        }>
          Opbouw
        </SectionTitle>

        {song.structure.length > 0 ? (
          <Timeline structure={song.structure} myInstrument={myInstrument} />
        ) : !showEditor ? (
          <button onClick={() => setShowEditor(true)} className="w-full text-center" style={{ border: `1px dashed ${T.line}`, borderRadius: 10, padding: "18px 12px", color: T.faint, fontFamily: "'Barlow', sans-serif", fontSize: 13 }}>
            Nog geen opbouw — tik om blokken toe te voegen
          </button>
        ) : null}

        {showEditor && (
          <div className="mt-3">
            {song.structure.map((b, i) => (
              <BlockEditor key={i} block={b}
                onChange={(nb) => updBlock(i, nb)}
                onDelete={() => set({ structure: song.structure.filter((_, j) => j !== i) })}
                onMove={(dir) => moveBlock(i, dir)}
                isFirst={i === 0} isLast={i === song.structure.length - 1}
              />
            ))}
            <button
              onClick={() => set({ structure: [...song.structure, { label: "", bars: 4, instruments: [] }] })}
              className="w-full flex items-center justify-center"
              style={{ gap: 6, border: `1px dashed ${T.amberDeep}`, borderRadius: 8, padding: "10px 0", color: T.amber, fontFamily: "'Barlow', sans-serif", fontSize: 13 }}>
              <Plus size={15} /> Blok toevoegen
            </button>
          </div>
        )}

        {/* notes */}
        <SectionTitle>Notities</SectionTitle>
        <textarea
          value={song.notes} onChange={(e) => set({ notes: e.target.value })}
          placeholder="Afspraken, breaks, dingen om te onthouden..."
          rows={3}
          className="w-full bg-transparent outline-none resize-none"
          style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: 12, color: T.text, fontFamily: "'Barlow', sans-serif", fontSize: 14, background: T.surface }}
        />

        {/* sheet music */}
        <SectionTitle>Bladmuziek / tab</SectionTitle>
        <div className="flex flex-col" style={{ gap: 8 }}>
          {sheetOrder.map((ins) => {
            const key = `${song.id}:${ins.id}`;
            const img = images[key];
            const mine = ins.id === myInstrument;
            return (
              <div key={ins.id} className="flex items-center" style={{ gap: 12, border: `1px solid ${mine ? T.amberDeep : T.line}`, borderRadius: 10, padding: 10, background: mine ? "#2A2112" : T.surface }}>
                {img ? (
                  <button onClick={() => setViewer(img)} style={{ flexShrink: 0 }}>
                    <img src={img} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, border: `1px solid ${T.line}` }} />
                  </button>
                ) : (
                  <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 6, border: `1px dashed ${T.line}`, flexShrink: 0 }}>
                    <ImageIcon size={18} color={T.faint} />
                  </div>
                )}
                <div className="flex-grow">
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: mine ? T.amber : T.text, fontWeight: mine ? 600 : 400 }}>
                    {ins.label} {mine && <span style={{ fontSize: 10, color: T.faint }}>· jouw partij</span>}
                  </div>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: T.faint }}>
                    {img ? "Tik op de foto om te bekijken" : "Nog geen foto gekoppeld"}
                  </div>
                </div>
                <button
                  onClick={() => fileRefs.current[key]?.click()}
                  style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.amber, border: `1px solid ${T.amberDeep}`, borderRadius: 8, padding: "6px 10px", flexShrink: 0 }}>
                  {img ? "Vervang" : "Foto"}
                </button>
                <input
                  type="file" accept="image/*" className="hidden"
                  ref={(el) => (fileRefs.current[key] = el)}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setImage(key, await compressImage(f));
                    e.target.value = "";
                  }}
                />
              </div>
            );
          })}
        </div>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: T.faint, marginTop: 8 }}>
          Foto's worden op dit apparaat bewaard. PDF- en Guitar Pro-weergave en delen met de band komen in een volgende versie.
        </p>

        <button onClick={remove} className="flex items-center mt-8" style={{ gap: 6, color: "#B05555", fontFamily: "'Barlow', sans-serif", fontSize: 13, padding: 6 }}>
          <Trash2 size={15} /> Nummer verwijderen
        </button>
      </div>

      {/* fullscreen viewer */}
      {viewer && (
        <div className="fixed inset-0 z-50 overflow-auto" style={{ background: "#000000F0" }} onClick={() => setViewer(null)}>
          <button className="fixed top-3 right-3 z-50 p-2" style={{ background: "#00000088", borderRadius: 99 }}>
            <X size={22} color="#fff" />
          </button>
          <img src={viewer} alt="" className="w-full" style={{ minHeight: "100%", objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------- setlists -------------------------------- */
function SongRow({ song, index, onOpen, reorder, onMove, isFirst, isLast }) {
  return (
    <div className="flex items-center" style={{ gap: 10, padding: "10px 4px", borderBottom: `1px solid ${T.line}` }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.faint, width: 22, textAlign: "right", flexShrink: 0 }}>
        {index}
      </span>
      <button onClick={onOpen} className="flex-grow text-left" style={{ minWidth: 0 }}>
        <div className="truncate" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 500, color: T.text }}>
          {song.title}
        </div>
        <div className="truncate" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.dim }}>
          {song.artist}
        </div>
      </button>
      {reorder ? (
        <div className="flex" style={{ gap: 2, flexShrink: 0 }}>
          <button disabled={isFirst} onClick={() => onMove(-1)} style={{ opacity: isFirst ? 0.25 : 1, padding: 8 }}><ArrowUp size={17} color={T.amber} /></button>
          <button disabled={isLast} onClick={() => onMove(1)} style={{ opacity: isLast ? 0.25 : 1, padding: 8 }}><ArrowDown size={17} color={T.amber} /></button>
        </div>
      ) : (
        <div className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
          {song.structure.length > 0 && (
            <span title="Opbouw aanwezig" style={{ width: 6, height: 6, borderRadius: 99, background: T.amber }} />
          )}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: song.bpm ? T.dim : T.faint, width: 38, textAlign: "right" }}>
            {song.bpm ? song.bpm : "—"}
          </span>
        </div>
      )}
    </div>
  );
}

function SetlistsScreen({ songs, openSong, moveSong }) {
  const [reorder, setReorder] = useState(false);
  let counter = 0;
  return (
    <div className="px-4 pb-28">
      <div className="flex items-end justify-between pt-5">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 30, color: T.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Setlist
        </h1>
        <button onClick={() => setReorder(!reorder)} className="flex items-center" style={{ gap: 5, fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.amber, padding: "6px 8px" }}>
          {reorder ? <><Check size={14} /> Klaar</> : "Volgorde wijzigen"}
        </button>
      </div>
      {!reorder && (
        <div className="flex" style={{ gap: 14, marginTop: 2, marginBottom: 4 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.faint }}>● = opbouw klaar</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.faint }}>rechts: BPM</span>
        </div>
      )}
      {[1, 2, 3].map((setNr) => {
        const list = songs.filter((s) => s.set === setNr);
        return (
          <div key={setNr} className="mt-5">
            <div className="flex items-baseline" style={{ gap: 8, borderBottom: `2px solid ${T.amberDeep}`, paddingBottom: 4 }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 19, color: T.amber, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Set {setNr}
              </span>
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.dim }}>{SET_TITLES[setNr]}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.faint, marginLeft: "auto" }}>{list.length}</span>
            </div>
            {list.map((s, i) => {
              counter += 1;
              return (
                <SongRow key={s.id} song={s} index={counter}
                  onOpen={() => openSong(s.id)}
                  reorder={reorder}
                  onMove={(dir) => moveSong(s.id, dir)}
                  isFirst={i === 0} isLast={i === list.length - 1}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ repertoire ------------------------------- */
function RepertoireScreen({ songs, openSong, addSong }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [setNr, setSetNr] = useState(0);
  const sorted = [...songs].sort((a, b) => a.title.localeCompare(b.title));
  const submit = () => {
    if (!title.trim()) return;
    addSong(title.trim(), artist.trim(), setNr || null);
    setTitle(""); setArtist(""); setSetNr(0); setAdding(false);
  };
  return (
    <div className="px-4 pb-28">
      <div className="flex items-end justify-between pt-5">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 30, color: T.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Repertoire
        </h1>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.faint }}>{songs.length} nummers</span>
      </div>

      {adding ? (
        <div className="mt-4 flex flex-col" style={{ gap: 10, border: `1px solid ${T.amberDeep}`, borderRadius: 12, padding: 14, background: T.surface }}>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel"
            className="bg-transparent outline-none" style={{ color: T.text, borderBottom: `1px solid ${T.line}`, fontFamily: "'Barlow', sans-serif", fontSize: 16, padding: "6px 0" }} />
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artiest"
            className="bg-transparent outline-none" style={{ color: T.text, borderBottom: `1px solid ${T.line}`, fontFamily: "'Barlow', sans-serif", fontSize: 14, padding: "6px 0" }} />
          <div className="flex" style={{ gap: 6 }}>
            {[0, 1, 2, 3].map((n) => (
              <button key={n} onClick={() => setSetNr(n)}
                style={{ padding: "6px 12px", borderRadius: 99, fontSize: 12, fontFamily: "'Barlow', sans-serif", border: `1px solid ${setNr === n ? T.amber : T.line}`, color: setNr === n ? T.amber : T.faint, background: setNr === n ? `${T.amber}1A` : "transparent" }}>
                {n === 0 ? "Geen set" : `Set ${n}`}
              </button>
            ))}
          </div>
          <div className="flex justify-end" style={{ gap: 10 }}>
            <button onClick={() => setAdding(false)} style={{ color: T.dim, fontFamily: "'Barlow', sans-serif", fontSize: 13, padding: "8px 10px" }}>Annuleer</button>
            <button onClick={submit} style={{ color: "#16120C", background: T.amber, borderRadius: 8, fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13, padding: "8px 16px" }}>Voeg toe</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center mt-4" style={{ gap: 6, border: `1px dashed ${T.amberDeep}`, borderRadius: 10, padding: "12px 0", color: T.amber, fontFamily: "'Barlow', sans-serif", fontSize: 14 }}>
          <Plus size={16} /> Nummer toevoegen
        </button>
      )}

      <div className="mt-3">
        {sorted.map((s) => (
          <button key={s.id} onClick={() => openSong(s.id)} className="w-full flex items-center text-left" style={{ gap: 10, padding: "10px 2px", borderBottom: `1px solid ${T.line}` }}>
            <div className="flex-grow" style={{ minWidth: 0 }}>
              <div className="truncate" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 500, color: T.text }}>{s.title}</div>
              <div className="truncate" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.dim }}>{s.artist}</div>
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.faint, flexShrink: 0 }}>
              {s.set ? `Set ${s.set}` : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- profile -------------------------------- */
function ProfileScreen({ myInstrument, setMyInstrument, saveState }) {
  return (
    <div className="px-4 pb-28">
      <h1 className="pt-5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 30, color: T.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Mijn instrument
      </h1>
      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.dim, marginTop: 4 }}>
        Bepaalt welke partij bovenaan staat en welke rij oplicht in de opbouw.
      </p>
      <div className="flex flex-col mt-4" style={{ gap: 8 }}>
        {INSTRUMENTS.map((ins) => {
          const on = ins.id === myInstrument;
          return (
            <button key={ins.id} onClick={() => setMyInstrument(ins.id)}
              className="flex items-center" style={{ gap: 12, border: `1px solid ${on ? ins.color : T.line}`, background: on ? `${ins.color}1F` : T.surface, borderRadius: 10, padding: "13px 14px" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: ins.color }} />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 15, color: on ? T.text : T.dim, fontWeight: on ? 600 : 400 }}>{ins.label}</span>
              {on && <Check size={16} color={ins.color} style={{ marginLeft: "auto" }} />}
            </button>
          );
        })}
      </div>
      <div className="mt-8" style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: 14, background: T.surface }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 15, color: T.dim, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Over dit prototype
        </div>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.dim, marginTop: 6, lineHeight: 1.5 }}>
          Nummers, opbouw, notities en foto's worden op dit apparaat bewaard ({saveState}). Delen met de hele band — iedereen ziet hetzelfde repertoire — komt in een volgende versie.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------- app ---------------------------------- */
export default function BandApp() {
  const [songs, setSongs] = useState(seedSongs);
  const [myInstrument, setMyInstrument] = useState("gitaar");
  const [screen, setScreen] = useState({ tab: "sets", songId: null });
  const [images, setImages] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("opslaan...");
  const saveTimer = useRef(null);

  /* load */
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res?.value) {
          const data = JSON.parse(res.value);
          if (Array.isArray(data.songs) && data.songs.length) setSongs(data.songs);
          if (data.myInstrument) setMyInstrument(data.myInstrument);
        }
        const imgs = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(IMG_PREFIX)) imgs[k.slice(IMG_PREFIX.length)] = localStorage.getItem(k);
        }
        if (Object.keys(imgs).length) setImages(imgs);
        setSaveState("automatisch opgeslagen");
      } catch {
        setSaveState("automatisch opgeslagen");
      }
      setLoaded(true);
    })();
  }, []);

  /* save (debounced) */
  useEffect(() => {
    if (!loaded) return;
    setSaveState("opslaan...");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await storage.set(STORAGE_KEY, JSON.stringify({ songs, myInstrument }));
        setSaveState("automatisch opgeslagen");
      } catch {
        setSaveState("opslaan mislukt — wijzigingen alleen in deze sessie");
      }
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [songs, myInstrument, loaded]);

  const openSong = (id) => setScreen({ ...screen, songId: id });
  const song = songs.find((s) => s.id === screen.songId);

  const updateSong = (next) => setSongs(songs.map((s) => (s.id === next.id ? next : s)));
  const removeSong = (id) => {
    setSongs(songs.filter((s) => s.id !== id));
    setScreen({ ...screen, songId: null });
  };
  const addSong = (title, artist, setNr) => {
    const id = Math.max(0, ...songs.map((s) => s.id)) + 1;
    const ns = { id, title, artist, set: setNr, bpm: null, key: "", countIn: "", notes: "", structure: [] };
    setSongs([...songs, ns]);
    setScreen({ tab: "repertoire", songId: id });
  };
  const moveSong = (id, dir) => {
    const s = songs.find((x) => x.id === id);
    const list = songs.filter((x) => x.set === s.set);
    const idx = list.findIndex((x) => x.id === id);
    const tgt = list[idx + dir];
    if (!tgt) return;
    const all = [...songs];
    const i1 = all.findIndex((x) => x.id === id);
    const i2 = all.findIndex((x) => x.id === tgt.id);
    [all[i1], all[i2]] = [all[i2], all[i1]];
    setSongs(all);
  };

  const tabs = [
    { id: "sets", label: "Setlist", icon: ListMusic },
    { id: "repertoire", label: "Repertoire", icon: Library },
    { id: "profile", label: "Ik", icon: UserRound },
  ];

  return (
    <div className="min-h-screen" style={{ background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        body { margin: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 2px; }
        button { cursor: pointer; background: none; border: none; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <div className="mx-auto" style={{ maxWidth: 560 }}>
        {song ? (
          <SongScreen
            song={song} update={updateSong}
            remove={() => removeSong(song.id)}
            back={() => setScreen({ ...screen, songId: null })}
            myInstrument={myInstrument}
            images={images}
            setImage={(k, v) => {
              setImages({ ...images, [k]: v });
              try {
                localStorage.setItem(IMG_PREFIX + k, v);
              } catch {
                alert("Opslag op dit apparaat is vol — de foto blijft alleen tijdens deze sessie zichtbaar.");
              }
            }}
          />
        ) : screen.tab === "sets" ? (
          <SetlistsScreen songs={songs} openSong={openSong} moveSong={moveSong} />
        ) : screen.tab === "repertoire" ? (
          <RepertoireScreen songs={songs} openSong={openSong} addSong={addSong} />
        ) : (
          <ProfileScreen myInstrument={myInstrument} setMyInstrument={setMyInstrument} saveState={saveState} />
        )}
      </div>

      {/* bottom tab bar */}
      {!song && (
        <div className="fixed bottom-0 left-0 right-0" style={{ background: "#16120CF2", borderTop: `1px solid ${T.line}`, backdropFilter: "blur(8px)" }}>
          <div className="mx-auto flex" style={{ maxWidth: 560 }}>
            {tabs.map((t) => {
              const on = screen.tab === t.id;
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setScreen({ tab: t.id, songId: null })}
                  className="flex-1 flex flex-col items-center" style={{ padding: "10px 0 14px" }}>
                  <Icon size={20} color={on ? T.amber : T.faint} strokeWidth={on ? 2.2 : 1.8} />
                  <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 10, marginTop: 3, color: on ? T.amber : T.faint, letterSpacing: "0.06em" }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
