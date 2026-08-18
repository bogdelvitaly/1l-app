import { prisma } from "@/lib/prisma";
import { createCertificate, deleteCertificate } from "./actions";
import { DateInput, Field, inputClass } from "@/components/form-fields";

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function CertificatesPage() {
  const certificates = await prisma.certificate.findMany({ orderBy: { sequenceNo: "desc" } });

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4 p-8">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Сертификаты</h1>
      </div>

      <div className="flex flex-col gap-4 px-8 pb-8">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Добавить новый сертификат</h2>
          <p className="text-sm text-[var(--text-muted)]">Введите данные для генерации нового сертификата.</p>
        </div>

        <form action={createCertificate} className="flex flex-wrap items-end gap-4 rounded-xl bg-[var(--surface)] p-6">
          <Field label="Дата">
            <DateInput name="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-[250px]" />
          </Field>
          <Field label="Сумма (BYN)">
            <input
              type="number"
              step="0.01"
              name="amount"
              required
              placeholder="Введите..."
              className={`${inputClass} w-[250px]`}
            />
          </Field>
          <button
            type="submit"
            className="h-10 shrink-0 cursor-pointer rounded-lg bg-[var(--accent-orange)] px-5 text-sm font-medium text-white hover:brightness-110"
          >
            Создать сертификат
          </button>
        </form>

        <div className="rounded-xl border border-[var(--devider)] bg-[var(--surface)]">
          <div className="flex h-12 items-center justify-between border-b border-[var(--devider)] px-6">
            <div className="min-w-[300px] flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Номер</div>
            <div className="flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Дата</div>
            <div className="flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Сумма</div>
            <div className="flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Скачать</div>
            <div className="flex-1 px-2" />
          </div>

          {certificates.map((c, i) => (
            <div
              key={c.id}
              className="flex h-16 items-center justify-between px-6"
              style={i % 2 === 1 ? { backgroundColor: "rgba(123,160,175,0.05)" } : undefined}
            >
              <div className="min-w-[300px] flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{c.number}</div>
              <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">
                {c.date.toLocaleDateString("ru-RU")}
              </div>
              <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{fmt(c.amount)} BYN</div>
              <div className="flex-1 px-2">
                <a
                  href={`/api/certificates/${c.id}/pdf`}
                  className="inline-flex items-center gap-2.5 text-sm font-medium whitespace-nowrap text-[var(--accent-blue)] hover:underline"
                >
                  Скачать сертификат
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/figma/download.svg" alt="" width={12} height={16} />
                </a>
              </div>
              <div className="flex flex-1 justify-end px-2">
                <form action={deleteCertificate}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="inline-flex cursor-pointer items-center gap-4 text-sm font-medium whitespace-nowrap text-[var(--negative)]"
                  >
                    Удалить сертификат
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/figma/trash.svg" alt="" width={16} height={16} />
                  </button>
                </form>
              </div>
            </div>
          ))}

          {certificates.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">Пока нет сертификатов</div>
          )}
        </div>
      </div>
    </div>
  );
}
