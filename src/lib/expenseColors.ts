import type { ExpenseCategory } from "@/lib/types";

// Badge colors per expense category, taken from the Figma design (reuses
// the same 7-color palette as product types, in a different assignment).
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  SEBESTOIMOST: "#db803f",
  RAZVITIE: "#519ef5",
  MASTERSKAYA: "#d33fdb",
  NALOG: "#886dff",
  ZARPLATA: "#3fdb5c",
  OTPRAVKA: "#db3f3f",
};

export function colorForExpenseCategory(category: string): string {
  return CATEGORY_COLORS[category as ExpenseCategory] ?? "#8f8f8f";
}
