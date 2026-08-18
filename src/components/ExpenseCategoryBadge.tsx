import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/types";
import { colorForExpenseCategory } from "@/lib/expenseColors";
import { Badge } from "./Badge";

export function ExpenseCategoryBadge({ category }: { category: string }) {
  const label = EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] ?? category;
  return <Badge color={colorForExpenseCategory(category)} label={label} />;
}
