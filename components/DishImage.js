"use client";

import { useState } from "react";

// Dish photo with a graceful fallback: if a dish has no photo, or the image
// fails to load (offline, dead link), show a tinted tile with the dish's
// first letter instead of a broken-image icon.
export default function DishImage({ item }) {
  const [failed, setFailed] = useState(false);

  if (!item.image_url || failed) {
    return (
      <div className="aspect-[4/3] w-full rounded-t-xl bg-gradient-to-br from-ember-500/25 via-char-900/10 to-olive-500/20 flex items-center justify-center">
        <span className="font-display text-3xl text-char-900/30">{item.name.charAt(0)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.image_url}
      alt={item.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-[4/3] w-full rounded-t-xl object-cover"
    />
  );
}
