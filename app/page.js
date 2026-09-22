import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DishImage from "../components/DishImage";
import VegBadge from "../components/VegBadge";
import { formatMoney } from "../lib/format";
import { query } from "../lib/db";

// Read the menu from the database on every visit, so dishes the manager adds,
// edits or hides show up straight away instead of being frozen at build time.
export const dynamic = "force-dynamic";

// Show sections in the order a meal is eaten; any other category the manager
// invents comes after these, alphabetically.
const CATEGORY_ORDER = [
  "Starter",
  "Main Course",
  "Grill",
  "Dessert",
  "Beverage",
];

async function loadMenu() {
  try {
    const items = await query(
      `SELECT id, name, description, price, category, image_url, is_veg, is_featured
       FROM menu_items
       WHERE is_available = 1`,
    );
    return { items, failed: false };
  } catch (err) {
    console.error(
      "Landing page: could not load the menu from the database:",
      err,
    );
    return { items: [], failed: true };
  }
}

function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }

  const rank = (category) => {
    const i = CATEGORY_ORDER.indexOf(category);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };

  return Array.from(groups.entries())
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
    .map(([category, list]) => ({
      category,
      // Popular dishes first, then alphabetical
      items: [...list].sort(
        (a, b) => b.is_featured - a.is_featured || a.name.localeCompare(b.name),
      ),
    }));
}

function DishCard({ item }) {
  return (
    <article className="rounded-xl border border-char-900/10 bg-white overflow-hidden flex flex-col text-left">
      <div className="relative">
        <DishImage item={item} />
        {item.is_featured ? (
          <span className="absolute top-2 left-2 rounded-full bg-ember-500 text-white text-xs font-medium px-2.5 py-1">
            Popular
          </span>
        ) : null}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-2">
          <VegBadge isVeg={!!item.is_veg} />
          <h3 className="font-medium text-char-900 leading-snug">
            {item.name}
          </h3>
        </div>
        {item.description && (
          <p className="text-sm text-char-700/70 mt-1 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="mt-auto pt-3 text-ember-600 font-medium">
          {formatMoney(item.price)}
        </p>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const { items, failed } = await loadMenu();
  const sections = groupByCategory(items);

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-16 pb-12 sm:pt-20 text-center">
        <span className="text-ember-600 font-medium tracking-wide mb-4">
          MeetPoint
        </span>
        <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] text-char-900 max-w-2xl">
          Order from your table, watch it come together.
        </h1>
        <p className="mt-5 text-char-700/80 max-w-md text-lg">
          Browse today&apos;s menu, send your order straight to the kitchen, and
          follow it from pan to plate — no app to install.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/menu"
            className="focus-ring inline-flex items-center justify-center rounded-full bg-char-900 text-linen px-8 py-3.5 text-base font-medium hover:bg-char-800 transition-colors"
          >
            Start an order
          </Link>
          <a
            href="#menu"
            className="focus-ring inline-flex items-center justify-center rounded-full border border-char-900/20 px-8 py-3.5 text-base font-medium text-char-900 hover:border-char-900/50 transition-colors"
          >
            Browse the dishes
          </a>
        </div>
      </section>

      {/* Food items */}
      <section id="menu" className="max-w-6xl mx-auto w-full px-5 scroll-mt-20">
        <div className="text-center">
          <h2 className="font-display text-3xl text-char-900">
            What&apos;s cooking today
          </h2>
          <p className="text-char-700/70 mt-1">
            Fresh from our kitchen — ready when you are.
          </p>
        </div>

        {failed && (
          <p className="mt-10 text-center text-brick-600">
            We couldn&apos;t load the menu just now. Please refresh, or ask a
            member of staff.
          </p>
        )}

        {!failed && sections.length === 0 && (
          <p className="mt-10 text-center text-char-700/60">
            No dishes are available right now. Please check back soon.
          </p>
        )}

        {sections.length > 1 && (
          <nav
            aria-label="Menu categories"
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {sections.map((section, index) => (
              <a
                key={section.category}
                href={`#category-${index}`}
                className="focus-ring text-sm rounded-full px-3.5 py-1.5 border border-char-900/20 text-char-700 hover:border-char-900/50 transition-colors"
              >
                {section.category}
              </a>
            ))}
          </nav>
        )}

        {sections.map((section, index) => (
          <div
            key={section.category}
            id={`category-${index}`}
            className="mt-12 scroll-mt-20"
          >
            <div className="flex items-baseline gap-3 mb-5">
              <h2 className="font-display text-2xl text-char-900">
                {section.category}
              </h2>
              <span className="text-sm text-char-700/50">
                {section.items.length}{" "}
                {section.items.length === 1 ? "dish" : "dishes"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((item) => (
                <DishCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}

        {sections.length > 0 && (
          <div className="mt-14 rounded-2xl bg-char-900 text-linen px-6 py-10 text-center">
            <h2 className="font-display text-2xl">Found something you like?</h2>
            <p className="mt-2 text-linen/70">
              Pick your dishes and send them straight to the kitchen.
            </p>
            <Link
              href="/menu"
              className="focus-ring mt-6 inline-flex items-center justify-center rounded-full bg-linen text-char-900 px-8 py-3 font-medium hover:bg-white transition-colors"
            >
              Start an order
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
