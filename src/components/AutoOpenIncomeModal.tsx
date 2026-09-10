"use client";

import { useState } from "react";
import { IncomeModal } from "./IncomeModal";

type IncomeDefaults = React.ComponentProps<typeof IncomeModal>["defaults"];
type Product = React.ComponentProps<typeof IncomeModal>["products"][number];

// Opens the "Изменить доход" modal on mount, no trigger — used when arriving at
// /income?open=<id> (see the "Доход добавлен" link on a Заказы card) so the record
// is right there instead of requiring a search through the table.
export function AutoOpenIncomeModal({
  action,
  products,
  defaults,
}: {
  action: (formData: FormData) => void;
  products: Product[];
  defaults: IncomeDefaults;
}) {
  const [open, setOpen] = useState(true);
  return (
    <IncomeModal
      title="Изменить доход"
      action={action}
      products={products}
      defaults={defaults}
      open={open}
      onOpenChange={setOpen}
    />
  );
}
