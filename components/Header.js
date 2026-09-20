import Link from "next/link";

// `right` lets a page slot in something page-specific (a cart button, a
// table number) next to the standard nav links.
export default function Header({ right }) {
  return (
    <header className="sticky top-0 z-10 bg-linen/95 backdrop-blur border-b border-char-900/10">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl text-char-900 shrink-0">
          MeetPoint
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden sm:flex items-center gap-6 text-sm text-char-700/70">
            <Link href="/menu" className="hover:text-char-900">
              Menu
            </Link>
            <Link href="/login" className="hover:text-char-900">
              Staff sign in
            </Link>
          </nav>
          {right}
        </div>
      </div>
    </header>
  );
}
