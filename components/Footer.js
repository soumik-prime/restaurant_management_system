import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-char-900/10 bg-char-900 text-linen/80 mt-20">
      <div className="max-w-5xl mx-auto px-5 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <span className="font-display text-xl text-linen">MeetPoint</span>
          <p className="mt-3 text-sm leading-relaxed">
            Dine-in ordering made simple — browse, order from your table, and
            watch it move from kitchen to plate.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-linen uppercase tracking-wide mb-3">
            Visit us
          </h3>
          <ul className="text-sm space-y-1.5">
            <li>College Road, Netrokona 2400, Bangladesh</li>
            <li>Open daily, 11:00 AM – 11:00 PM</li>
            <li>
              <a href="tel:+8801700000000" className="hover:text-linen">
                +880 1700-000000
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-linen uppercase tracking-wide mb-3">
            Quick links
          </h3>
          <ul className="text-sm space-y-1.5">
            <li>
              <Link href="/menu" className="hover:text-linen">
                Order online
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-linen">
                Staff sign in
              </Link>
            </li>
          </ul>
          <div className="flex gap-3 mt-4">
            {["Facebook", "Instagram"].map((label) => (
              <span
                key={label}
                className="text-xs rounded-full border border-linen/25 px-3 py-1 text-linen/70"
                title={`${label} (placeholder — link up your real page)`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-linen/10">
        <p className="max-w-5xl mx-auto px-5 py-4 text-xs text-linen/50">
          © {new Date().getFullYear()} MeetPoint Restaurant. Built for CSE-3112 — Software Engineering, Netrokona University.
        </p>
      </div>
    </footer>
  );
}
