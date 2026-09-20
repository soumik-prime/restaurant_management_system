// Small green / red "veg / non-veg" marker, as used on South Asian menus.
export default function VegBadge({ isVeg }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-sm border-2 shrink-0 ${
        isVeg ? "border-olive-600" : "border-brick-600"
      }`}
      title={isVeg ? "Vegetarian" : "Contains meat"}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? "bg-olive-600" : "bg-brick-600"}`} />
    </span>
  );
}
