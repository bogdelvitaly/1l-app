import type { Prisma } from "@prisma/client";

// Manual order from Настройки → Товары, falling back to creation order for rows
// that were never dragged (sortOrder defaults to 0). Used everywhere products
// are listed so the dropdowns follow the same order as the settings table.
export const PRODUCT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [{ sortOrder: "asc" }, { createdAt: "asc" }];
