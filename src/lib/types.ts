import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "NALOG",
  "SEBESTOIMOST",
  "ZARPLATA",
  "RAZVITIE",
  "MASTERSKAYA",
  "OTPRAVKA",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  NALOG: "Налог",
  SEBESTOIMOST: "Себестоимость",
  ZARPLATA: "Заработная плата",
  RAZVITIE: "Развитие",
  MASTERSKAYA: "Мастерская",
  OTPRAVKA: "Отправка",
};

export const PAYMENT_METHODS = ["NAL", "BEZNAL"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  NAL: "Наличные",
  BEZNAL: "Безналичный",
};

// Short form for table cells, matching the design (full words used in the form).
export const PAYMENT_METHOD_SHORT_LABELS: Record<PaymentMethod, string> = {
  NAL: "Нал",
  BEZNAL: "Безнал",
};

// Типы товара больше не жёсткий enum — управляются пользователем в /settings
// (таблица ProductType). Список ниже используется только для первоначального
// заполнения БД (prisma/seed.ts), не для валидации.
export const DEFAULT_PRODUCT_TYPES = [
  { code: "V_K", label: "В-К (Винтаж Классика)" },
  { code: "V_V", label: "В-В (Винтаж Волат)" },
  { code: "V_RGB", label: "В-RGB (Винтаж RGB)" },
  { code: "VV_RGB", label: "ВВ-RGB (Винтаж Волат RGB)" },
  { code: "M_30", label: "М-30 (Буська/Каханне/Цеплыня Мадэрн/Iльдзiна)" },
  { code: "M_50", label: "М-50 (Мроя)" },
  { code: "M_70", label: "М-70 (Прамень/Жарынка)" },
] as const;

export const expenseSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1, "Укажите описание"),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
});

export const incomeSchema = z.object({
  date: z.coerce.date(),
  saleDetails: z.string().min(1, "Укажите детали продажи"),
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  shipping: z.coerce.number().min(0).default(0),
  delivery: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(PAYMENT_METHODS),
  productType: z.string().min(1, "Выберите тип товара"),
  // Added alongside saleDetails — a specific catalog Product plus who/where it
  // was sold to. All optional so old-style entries (and old rows) keep working.
  productId: z.string().optional(),
  buyer: z.string().optional(),
  city: z.string().optional(),
  taxable: z.boolean().default(true),
});

export const certificateSchema = z.object({
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  date: z.coerce.date(),
});

export const productTypeSchema = z.object({
  code: z
    .string()
    .min(1, "Укажите код")
    .regex(/^[A-Za-zА-Яа-яЁёІіЎў0-9_-]+$/, "Только буквы, цифры, _ и -"),
  label: z.string().min(1, "Укажите название"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  price: z.coerce.number().min(0, "Цена не может быть отрицательной"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет")
    .default("#519ef5"),
  productTypeId: z.string().min(1, "Выберите тип товара"),
});

export const storeSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  location: z.string().min(1, "Укажите локацию"),
});

export const costComponentSchema = z.object({
  name: z.string().min(1, "Укажите название компонента"),
  price: z.coerce.number().min(0, "Цена не может быть отрицательной"),
});

export const userSchema = z.object({
  name: z.string().min(1, "Укажите имя"),
  username: z
    .string()
    .min(3, "Минимум 3 символа")
    .regex(/^[a-zA-Z0-9_.]+$/, "Только латиница, цифры, _ и ."),
  password: z.string().min(6, "Минимум 6 символов"),
});
