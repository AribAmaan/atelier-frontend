import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <span className="font-display text-xl tracking-wide">Atelier</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/login" className="hover:text-gold focus-ring rounded px-2 py-1">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-gold text-ink px-4 py-1.5 rounded-full font-medium hover:brightness-110 focus-ring"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 md:px-12 py-16">
        <p className="font-display italic text-gold mb-4">a workshop for characters</p>
        <h1 className="font-display text-4xl md:text-6xl max-w-3xl leading-tight">
          Give a personality a voice, then talk to it.
        </h1>
        <p className="mt-6 max-w-xl text-parchment/70 font-body">
          Sketch a character's traits and backstory, and Atelier brings them into a conversation.
          Every character you make is yours: private, editable, and ready whenever you are.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="bg-gold text-ink px-6 py-3 rounded-full font-medium hover:brightness-110 focus-ring"
          >
            Create your first character
          </Link>
          <Link
            href="/login"
            className="border border-parchment/30 px-6 py-3 rounded-full font-medium hover:border-gold focus-ring"
          >
            I already have an account
          </Link>
        </div>
      </section>

      <div className="stitched mx-6 mb-12 md:mx-12 rounded-2xl bg-plum/60 px-8 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-display text-lg text-gold mb-2">01 — Craft</p>
          <p className="text-sm text-parchment/70">
            Name a character, describe their traits and background, and write the line they open with.
          </p>
        </div>
        <div>
          <p className="font-display text-lg text-gold mb-2">02 — Converse</p>
          <p className="text-sm text-parchment/70">
            Chat naturally. Each character remembers your conversation with them, and only them.
          </p>
        </div>
        <div>
          <p className="font-display text-lg text-gold mb-2">03 — Iterate</p>
          <p className="text-sm text-parchment/70">
            Edit a character's backstory any time and the next reply reflects the change.
          </p>
        </div>
      </div>
    </main>
  );
}
