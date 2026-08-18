import { colorForProductType, shortProductTypeLabel } from "@/lib/typeColors";
import { Badge } from "./Badge";

export function TypeBadge({ code, label }: { code: string; label: string }) {
  return <Badge color={colorForProductType(code)} label={shortProductTypeLabel(label)} />;
}
