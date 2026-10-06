"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function WelcomeOnboarding({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { try { if (!localStorage.getItem("rolichat:welcome:v2")) setOpen(true); } catch { /* Optional onboarding. */ } }, []);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  function finish() { try { localStorage.setItem("rolichat:welcome:v2", "1"); } catch { /* Optional. */ } setOpen(false); onDone?.(); }
  return <dialog ref={dialog} className="rp-dialog" aria-labelledby="welcome-title" onCancel={finish}><div className="rp-dialog-heading"><div><p className="rp-eyebrow">MAKE YOURSELF AT HOME</p><h2 id="welcome-title">A story only you can tell.</h2></div><button className="rp-icon-button" aria-label="Close welcome" onClick={finish}>✕</button></div><p className="rp-muted">A few things to try when you meet your first character.</p><div className="rp-note"><strong>01 · Find your cast</strong><p>Choose a character and start a private story. Save favorites with the heart.</p></div><div className="rp-note"><strong>02 · Set the scene</strong><p>Open Scene director in chat to choose your role, the setting, and your preferences.</p></div><div className="rp-note"><strong>03 · Make it your own</strong><p>Edit or regenerate replies, shape the character's memory, and export a conversation.</p></div><footer className="rp-dialog-footer"><Link href="/dashboard" onClick={finish} className="rp-text-button">Create my own ↗</Link><button onClick={finish} className="rp-button">Meet the cast ↗</button></footer></dialog>;
}
