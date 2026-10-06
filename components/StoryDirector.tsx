"use client";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_STORY, STORY_STARTERS, type StorySettings } from "@/lib/storySettings";

type Props = { open: boolean; value: StorySettings; onClose: () => void; onApply: (value: StorySettings, opener?: string) => void };
export default function StoryDirector({ open, value, onClose, onApply }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(value);
  const [opener, setOpener] = useState("");
  useEffect(() => {
    if (open) { setDraft(value); setOpener(""); dialog.current?.showModal(); }
    else dialog.current?.close();
  }, [open, value]);
  function field(key: keyof StorySettings, value: string) { setDraft(d => ({ ...d, [key]: value })); }
  return (
    <dialog ref={dialog} className="rp-dialog" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-labelledby="director-title">
      <form onSubmit={e => { e.preventDefault(); onApply(draft, opener || undefined); onClose(); }}>
        <header className="rp-dialog-heading"><div><p className="rp-eyebrow">YOUR STORY, YOUR RULES</p><h2 id="director-title">Scene director</h2></div><button type="button" onClick={onClose} className="rp-icon-button" aria-label="Close scene director">✕</button></header>
        <p className="rp-muted">Give the next reply a little direction. These settings stay with this character on this browser.</p>
        <div className="rp-starters">{STORY_STARTERS.map(s => <button type="button" key={s.label} onClick={() => { field("scene", s.scene); setOpener(s.opener); }}><span>{s.icon}</span>{s.label}</button>)}</div>
        <label className="rp-field">Your name in this story<input maxLength={60} value={draft.personaName} onChange={e => field("personaName", e.target.value)} placeholder="What should they call you?" /></label>
        <label className="rp-field">Your role<textarea rows={2} maxLength={800} value={draft.persona} onChange={e => field("persona", e.target.value)} placeholder="A curious traveler, a rival detective, an old friend…" /></label>
        <label className="rp-field">The scene<textarea rows={3} maxLength={1200} value={draft.scene} onChange={e => field("scene", e.target.value)} placeholder="Where are you? What just happened?" /></label>
        <label className="rp-field">Writing style<select value={draft.tone} onChange={e => field("tone", e.target.value)}><option value="character">Follow the character</option><option value="cinematic">Cinematic atmosphere</option><option value="dialogue">Dialogue first</option><option value="gentle">Cozy and gentle</option></select></label>
        <label className="rp-field">Boundaries & preferences<textarea rows={2} maxLength={500} value={draft.boundaries} onChange={e => field("boundaries", e.target.value)} placeholder="For example: no horror, no tragic endings, let me choose my actions." /></label>
        {opener && <div className="rp-note">A starter message will be placed in your composer. You can edit it before sending.</div>}
        <footer className="rp-dialog-footer"><button type="button" className="rp-text-button" onClick={() => { setDraft(DEFAULT_STORY); setOpener(""); }}>Reset settings</button><button type="submit" className="rp-button">Save direction <span>↗</span></button></footer>
      </form>
    </dialog>
  );
}
