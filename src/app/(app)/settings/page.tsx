import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createProductType,
  deleteProductType,
  createComponent,
  deleteComponent,
  createProduct,
  deleteProduct,
  importExcel,
  createUser,
  deleteUser,
} from "./actions";
import { Badge } from "@/components/Badge";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { ImportSubmitButton, ImportOverlay } from "@/components/ImportProgress";

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MAX_USERS = 10;
type Tab = "general" | "types" | "products";

export default async function SettingsPage(props: PageProps<"/settings">) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const tab: Tab =
    searchParams?.tab === "types" ? "types" : searchParams?.tab === "products" ? "products" : "general";

  const [productTypes, users, products] = await Promise.all([
    prisma.productType.findMany({
      include: { components: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({
      include: { productType: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const imported = searchParams?.imported === "1";

  return (
    <div className="flex flex-col">
      <div className="p-4 pb-0 sm:p-8 sm:pb-0">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Настройки</h1>
      </div>

      <div className="mt-8 flex gap-6 overflow-x-auto border-b border-[var(--devider)] px-4 sm:px-8">
        <TabLink tab="general" current={tab}>
          Общие настройки
        </TabLink>
        <TabLink tab="types" current={tab}>
          Типы товаров
        </TabLink>
        <TabLink tab="products" current={tab}>
          Товары
        </TabLink>
      </div>

      <div className="flex flex-col gap-8 p-4 sm:p-8">
        {imported && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            Импорт завершён: расходов — {searchParams?.expenses}, доходов — {searchParams?.incomes}, пропущено строк —{" "}
            {searchParams?.skipped}.
          </div>
        )}

        {tab === "general" ? (
          <>
            <section className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Импорт / экспорт Excel</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Загрузите файл в том же формате (вкладки «Расходы {"{год}"}» / «Доходы {"{год}"}»). Внимание:
                  загрузка полностью заменяет текущие доходы и расходы данными из файла — старые записи будут
                  удалены. Экспорт выгружает все текущие данные в .xlsx с вкладками по годам.
                </p>
              </div>
              <div className="flex flex-col items-end justify-between gap-4 rounded-xl bg-[var(--surface)] p-6 sm:flex-row">
                <form action={importExcel} className="flex flex-wrap items-end gap-4">
                  <label className="flex flex-col gap-2 text-xs text-[var(--text-muted)]">
                    Файл .xlsx
                    <input type="file" name="file" accept=".xlsx" className="text-sm text-[var(--text-primary)]" />
                  </label>
                  <span className="pb-2 text-xs text-[var(--text-muted)]">или</span>
                  <label className="flex flex-col gap-2 text-xs text-[var(--text-muted)]">
                    Ссылка на файл
                    <input
                      type="url"
                      name="url"
                      placeholder="Введите..."
                      className="h-10 w-[250px] rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                    />
                  </label>
                  <ImportSubmitButton />
                  <ImportOverlay />
                </form>
                <a
                  href="/api/export"
                  className="flex h-10 shrink-0 items-center rounded-lg bg-[var(--accent-orange)] px-5 text-sm font-medium text-white hover:brightness-110"
                >
                  Скачать экспорт .xlsx
                </a>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
                  Участники ({users.length}/{MAX_USERS})
                </h2>
                <p className="text-sm text-[var(--text-muted)]">Логин и пароль для входа в приложение.</p>
              </div>

              <div className="flex flex-col gap-4 rounded-xl bg-[var(--surface)] p-6">
                {users.length < MAX_USERS && (
                  <form action={createUser} className="flex flex-wrap items-end gap-4">
                    <label className="flex w-[250px] flex-col gap-2 text-xs text-[var(--text-muted)]">
                      Имя
                      <input
                        name="name"
                        required
                        placeholder="Введите..."
                        className="h-10 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                      />
                    </label>
                    <label className="flex w-[250px] flex-col gap-2 text-xs text-[var(--text-muted)]">
                      Логин
                      <input
                        name="username"
                        required
                        placeholder="Введите..."
                        className="h-10 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                      />
                    </label>
                    <label className="flex w-[250px] flex-col gap-2 text-xs text-[var(--text-muted)]">
                      Пароль
                      <input
                        name="password"
                        type="password"
                        required
                        placeholder="Введите..."
                        className="h-10 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                      />
                    </label>
                    <button
                      type="submit"
                      className="h-10 rounded-lg bg-[var(--accent-orange)] px-5 text-sm font-medium text-white hover:brightness-110"
                    >
                      Добавить участника
                    </button>
                  </form>
                )}

                <div className="w-full overflow-x-auto">
                  <div className="flex h-12 min-w-[550px] items-center border-b border-[var(--devider)] px-2">
                    <div className="min-w-[200px] flex-1 px-2 text-xs font-semibold text-[var(--text-inactive)]">
                      Имя
                    </div>
                    <div className="min-w-[150px] flex-1 px-2 text-xs font-semibold text-[var(--text-inactive)]">
                      Логин
                    </div>
                    <div className="flex-1 px-2 text-xs font-semibold text-[var(--text-inactive)]">Пароль</div>
                    <div className="w-20 shrink-0 px-2" />
                  </div>
                  {users.map((u) => (
                    <div key={u.id} className="flex h-16 min-w-[550px] items-center px-2">
                      <div className="min-w-[200px] flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">
                        {u.name}
                        {u.id === session?.user?.id && (
                          <span className="ml-2 text-xs text-[var(--text-inactive)]">(вы)</span>
                        )}
                      </div>
                      <div className="min-w-[150px] flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">
                        {u.username}
                      </div>
                      {/* Пароли никогда не показываются в открытом виде — только маска, независимо от значения */}
                      <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">••••••••</div>
                      <div className="w-20 shrink-0 px-2 text-right">
                        {u.id !== session?.user?.id && (
                          <ConfirmDeleteForm action={deleteUser} id={u.id} ariaLabel="Удалить">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icons/figma/trash.svg" alt="" width={20} height={20} />
                          </ConfirmDeleteForm>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : tab === "types" ? (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Типы товара и себестоимость</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Себестоимость типа = сумма цен всех его компонентов. Используется в квартальном отчёте.
              </p>
            </div>

            <form action={createProductType} className="flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-2 text-xs text-[var(--text-muted)]">
                Код типа
                <input
                  name="code"
                  required
                  placeholder="Введите..."
                  className="h-10 w-[200px] rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs text-[var(--text-muted)]">
                Название
                <input
                  name="label"
                  required
                  placeholder="Введите..."
                  className="h-10 w-[250px] rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-lg bg-[var(--accent-orange)] px-5 text-sm font-medium text-white hover:brightness-110"
              >
                Добавить тип
              </button>
            </form>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {productTypes.map((pt) => {
                const total = pt.components.reduce((sum, c) => sum + c.price, 0);
                const addComponent = createComponent.bind(null, pt.id);
                return (
                  <div key={pt.id} className="rounded-xl bg-[var(--surface)] p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{pt.label}</div>
                        <div className="text-xs text-[var(--text-muted)]">код: {pt.code}</div>
                      </div>
                      <ConfirmDeleteForm action={deleteProductType} id={pt.id} ariaLabel="Удалить тип">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icons/figma/trash.svg" alt="" width={20} height={20} />
                      </ConfirmDeleteForm>
                    </div>

                    <div className="mb-4 flex flex-col gap-2">
                      {pt.components.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text-primary)]">{c.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[var(--text-primary)]">{fmt(c.price)} BYN</span>
                            <ConfirmDeleteForm action={deleteComponent} id={c.id} className="text-[var(--negative)]">
                              ✕
                            </ConfirmDeleteForm>
                          </div>
                        </div>
                      ))}
                      {pt.components.length === 0 && (
                        <p className="text-center text-sm text-[var(--text-inactive)]">Нет компонентов</p>
                      )}
                      {pt.components.length > 0 && (
                        <div className="flex items-center justify-between border-t border-[var(--devider)] pt-2 text-sm font-semibold">
                          <span className="text-[var(--text-primary)]">Итого себестоимость</span>
                          <span className="text-[var(--text-primary)]">{fmt(total)} BYN</span>
                        </div>
                      )}
                    </div>

                    <form action={addComponent} className="flex gap-2">
                      <input
                        name="name"
                        required
                        placeholder="Введите..."
                        className="h-10 min-w-0 flex-1 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                      />
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        required
                        placeholder="Введите..."
                        className="h-10 w-24 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-orange)] text-white hover:brightness-110"
                      >
                        +
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Товары</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Конкретные товары для продажи — каждый привязан к типу товара и получает свой цвет для колонки
                «Товар» на вкладке Доходы.
              </p>
            </div>

            <form action={createProduct} className="flex flex-wrap items-end gap-4 rounded-xl bg-[var(--surface)] p-6">
              <label className="flex w-[220px] flex-col gap-2 text-xs text-[var(--text-muted)]">
                Имя
                <input
                  name="name"
                  required
                  placeholder="Введите..."
                  className="h-10 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                />
              </label>
              <label className="flex w-[160px] flex-col gap-2 text-xs text-[var(--text-muted)]">
                Сумма (BYN)
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Введите..."
                  className="h-10 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
                />
              </label>
              <label className="flex w-[220px] flex-col gap-2 text-xs text-[var(--text-muted)]">
                Тип товара
                <select
                  name="productTypeId"
                  required
                  defaultValue=""
                  className="h-10 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="" disabled>
                    Выберите...
                  </option>
                  {productTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs text-[var(--text-muted)]">
                Цвет
                <input
                  name="color"
                  type="color"
                  defaultValue="#519ef5"
                  className="h-10 w-14 cursor-pointer rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] p-1"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-lg bg-[var(--accent-orange)] px-5 text-sm font-medium text-white hover:brightness-110"
              >
                Добавить товар
              </button>
            </form>

            <div className="w-full overflow-x-auto rounded-xl border border-[var(--devider)] bg-[var(--surface)]">
              <div className="flex h-12 min-w-[650px] items-center border-b border-[var(--devider)] px-6">
                <div className="min-w-[200px] flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Имя</div>
                <div className="flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Тип товара</div>
                <div className="flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Сумма</div>
                <div className="w-16 shrink-0 px-2" />
              </div>
              {products.map((p, i) => (
                <div
                  key={p.id}
                  className="flex h-16 min-w-[650px] items-center px-6"
                  style={i % 2 === 1 ? { backgroundColor: "rgba(123,160,175,0.05)" } : undefined}
                >
                  <div className="min-w-[200px] flex-1 px-2">
                    <Badge color={p.color} label={p.name} />
                  </div>
                  <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">
                    {p.productType.label}
                  </div>
                  <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{fmt(p.price)} BYN</div>
                  <div className="w-16 shrink-0 px-2 text-right">
                    <ConfirmDeleteForm action={deleteProduct} id={p.id} ariaLabel="Удалить товар">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/icons/figma/trash.svg" alt="" width={20} height={20} />
                    </ConfirmDeleteForm>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">Пока нет товаров</div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function TabLink({ tab, current, children }: { tab: Tab; current: Tab; children: React.ReactNode }) {
  const active = tab === current;
  return (
    <Link
      href={`/settings?tab=${tab}`}
      className={`border-b-2 pb-4 text-base font-extrabold ${
        active
          ? "border-[var(--accent-orange)] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
    </Link>
  );
}
