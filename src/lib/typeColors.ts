// Badge colors per product type code, taken from the Figma design.
// Unknown/custom codes (added later in /settings) fall back to a
// deterministic pick from the same palette, so they still look distinct.
const KNOWN_COLORS: Record<string, string> = {
  V_K: "#db803f",
  V_V: "#519ef5",
  V_RGB: "#d33fdb",
  VV_RGB: "#886dff",
  M_30: "#3fdb5c",
  M_50: "#8f8f8f", // darkened from Figma's #d3d3d3 — that value is unreadable on a white/light-theme background
  M_70: "#db3f3f",
};

const FALLBACK_PALETTE = Object.values(KNOWN_COLORS);

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function colorForProductType(code: string): string {
  return KNOWN_COLORS[code] ?? FALLBACK_PALETTE[hashCode(code) % FALLBACK_PALETTE.length];
}

// Labels follow the "Short (long description)" convention (e.g. "В-К (Винтаж Классика)") —
// compact spots (badges, report table) show only the short part.
export function shortProductTypeLabel(label: string): string {
  return label.split(" (")[0];
}
