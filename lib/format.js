export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `\u09F3${n.toFixed(0)}`; 
}

export const STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

export const STATUS_STEPS = ["CONFIRMED", "PREPARING", "READY", "SERVED"];
