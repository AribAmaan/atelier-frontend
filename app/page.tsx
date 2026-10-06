"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCachedUser, fetchAndCacheUser } from "@/lib/authCache";
import Logo from "@/components/Logo";

const CAST = [
  { name: "Satoru Gojo", tag: "A little chaos. A lot of confidence.", image: "Satoru_Gojo", genre: "Adventure" },
  { name: "Faye Valentine", tag: "Every secret has a price.", image: "Faye_Valentine", genre: "Mystery" },
  { name: "Yor Forger", tag: "There's more beneath the surface.", image: "Yor_Forger", genre: "Slice of life" },
  { name: "Spike Spiegel", tag: "Some stories follow you everywhere.", image: "Spike_Spiegel", genre: "Sci-fi" },
];
const SCENES = [
  { label: "Mystery", name: "Faye Valentine", image: "Faye_Valentine", place: "AFTER HOURS · THE LAST TRAIN", text: "The station clock stops. Faye glances at the envelope in your hand, then at the empty platform. “Tell me you didn't open that.”", answer: "Would it help if I said no?" },
  { label: "Adventure", name: "Satoru Gojo", image: "Satoru_Gojo", place: "NEW CHAPTER · AN UNLIKELY ALLIANCE", text: "Gojo turns the map upside down, grinning. “Good news: I know exactly where we are. Bad news: so does everyone looking for us.”", answer: "Then we'd better keep moving." },
  { label: "Cozy", name: "Yor Forger", image: "Yor_Forger", place: "SUNDAY MORNING · A SMALL CAFÉ", text: "Yor nudges a warm cup across the table. Rain traces little paths down the window. “We don't have to rush anywhere today, do we?”", answer: "No. I think we're exactly where we should be." },
];
const portrait = (name: string) => `/assets/characters/${name}_202608132107.jpeg`;

export default function Home() {
  const router = useRouter();
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = SCENES[sceneIndex];
  useEffect(() => {
    let live = true;
    const cached = getCachedUser();
    if (cached?.user && cached.fresh) router.replace("/explore");
    else fetchAndCacheUser().then(user => { if (live && user) router.replace("/explore"); });
    return () => { live = false; };
  }, [router]);
  return (
    <main className="rp-landing">
      <header className="rp-nav"><Link href="/" className="rp-brand"><Logo size={32} decorative />Rolichat<span className="rp-brand-tagline">YOUR STORY STARTS HERE</span></Link><nav><a href="#cast" className="rp-nav-discover">Meet the cast</a><Link href="/login">Log in</Link><Link href="/signup" className="rp-button rp-button-small">Start your story ↗</Link></nav></header>
      <section className="rp-hero">
        <div className="rp-hero-copy"><p className="rp-eyebrow"><span className="rp-status-dot" /> A PLACE FOR YOUR IMAGINATION</p><h1>Not just a chat.<br />A world <em>you<br className="rp-desktop-break" /> belong in.</em></h1><p className="rp-hero-description">Meet a character. Take an unexpected turn. Build a story that could only happen with you.</p><div className="rp-hero-actions"><Link href="/signup" className="rp-button">Find your next story <span>↗</span></Link><a href="#preview" className="rp-text-button">Take a peek <span>↓</span></a></div><div className="rp-hero-footnote"><span>✧ Your own characters</span><span>◇ Memories that carry forward</span></div></div>
        <div className="rp-hero-art" aria-label="Meet Faye Valentine, Satoru Gojo, and Yor Forger"><div className="rp-orbit rp-orbit-one" /><div className="rp-orbit rp-orbit-two" /><span className="rp-art-star">✧</span><div className="rp-portrait rp-portrait-left"><Image src={portrait("Satoru_Gojo")} alt="Satoru Gojo" fill sizes="(max-width: 700px) 30vw, 220px" /><span>THE UNEXPECTED ALLY</span></div><div className="rp-portrait rp-portrait-right"><Image src={portrait("Yor_Forger")} alt="Yor Forger" fill sizes="(max-width: 700px) 30vw, 220px" /><span>THE QUIET MYSTERY</span></div><div className="rp-portrait rp-portrait-main"><Image src={portrait("Faye_Valentine")} alt="Faye Valentine" fill priority sizes="(max-width: 700px) 56vw, 300px" /><div className="rp-portrait-caption"><small>YOUR NEXT CHAPTER</small><strong>Faye Valentine</strong><span>Mystery · Wit · A little trouble</span></div></div><div className="rp-floating-line"><span>✦</span> “So, what's our next move?”<small>You decide where this goes.</small></div></div>
      </section>
      <div className="rp-marquee" aria-label="Explore different kinds of stories"><span>FANTASY</span><i>✦</i><span>SLOW-BURN STORIES</span><i>✦</i><span>MYSTERY</span><i>✦</i><span>SLICE OF LIFE</span><i>✦</i><span>ADVENTURE</span><i>✦</i><span>YOUR IMAGINATION</span></div>
      <section id="cast" className="rp-section"><div className="rp-section-heading"><div><p className="rp-eyebrow">01 / MEET YOUR NEXT OBSESSION</p><h2>Someone worth <em>staying up for.</em></h2></div><Link href="/explore" className="rp-text-button">Explore characters ↗</Link></div><div className="rp-cast-grid">{CAST.map(c => <Link href="/explore" key={c.name} className="rp-cast-card"><div className="rp-cast-image"><Image src={portrait(c.image)} alt={c.name} fill sizes="(max-width: 640px) 45vw, 25vw" /><span>{c.genre}</span><b aria-hidden="true">↗</b></div><h3>{c.name}</h3><p>{c.tag}</p></Link>)}</div></section>
      <section id="preview" className="rp-section rp-preview-section"><div className="rp-preview-copy"><p className="rp-eyebrow">02 / ONE MESSAGE. A THOUSAND POSSIBILITIES.</p><h2>Follow the story.<br /><em>Or change it.</em></h2><p>Set the scene, play your part, and see what happens next. Your character brings the personality. You bring the possibilities.</p><div className="rp-scene-tabs" role="tablist" aria-label="Story preview genre">{SCENES.map((s, i) => <button id={`preview-tab-${i}`} role="tab" aria-selected={sceneIndex === i} aria-controls="story-preview" key={s.label} onClick={() => setSceneIndex(i)}>{s.label}</button>)}</div><p className="rp-sample-note">Illustrative scene previews. Sign in to start a live conversation.</p></div><div className="rp-story-preview" id="story-preview" role="tabpanel" aria-labelledby={`preview-tab-${sceneIndex}`}><div className="rp-preview-header"><Image src={portrait(scene.image)} alt="" width={42} height={42} /><div><strong>{scene.name}</strong><span>AI character · Story preview</span></div><span className="rp-status-dot" /></div><p className="rp-preview-location">{scene.place}</p><div className="rp-preview-dialogue" key={sceneIndex}><p>{scene.text}</p><div className="rp-preview-answer">{scene.answer}<small>YOU</small></div></div><Link href="/signup" className="rp-preview-composer">What happens next? <span>↗</span></Link></div></section>
      <section className="rp-section"><div className="rp-section-heading"><div><p className="rp-eyebrow">03 / MADE FOR THE WAY YOU IMAGINE</p><h2>A little more <em>yours.</em></h2></div></div><div className="rp-feature-grid">{[["◇", "A memory you can shape", "Keep the details that matter. Read and edit your character's conversation memory whenever you need."], ["✧", "You're in the director's chair", "Give yourself a role, choose the setting, and set the tone before the next chapter begins."], ["↺", "There's always another way", "Edit a message, regenerate a reply, or try an entirely new direction. Your story stays in your hands."]].map(([icon,title,text]) => <article key={title}><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="rp-final"><span>✧</span><p className="rp-eyebrow">THE NEXT CHAPTER IS UNWRITTEN</p><h2>Make it <em>yours.</em></h2><Link href="/signup" className="rp-button">Start your story ↗</Link><p>No perfect opening line required.</p></section>
      <footer className="rp-footer"><Link href="/" className="rp-brand"><Logo size={24} decorative />Rolichat</Link><p>Fictional characters. Real imagination. For adults 18+.</p><div><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></div></footer>
    </main>
  );
}
