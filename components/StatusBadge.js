import { STATUS_LABELS } from "../lib/format";

const COLORS = {
  PENDING: "bg-char-900/10 text-char-700",
  CONFIRMED: "bg-ember-500/15 text-ember-600",
  PREPARING: "bg-ember-500/15 text-ember-600",
  READY: "bg-olive-500/15 text-olive-600",
  SERVED: "bg-char-900/10 text-char-700",
  CANCELLED: "bg-brick-500/15 text-brick-600",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${COLORS[status] || COLORS.PENDING}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
