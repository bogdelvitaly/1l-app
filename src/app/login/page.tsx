import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { Field, inputClass } from "@/components/form-fields";

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth();
  if (session) redirect("/income");

  const searchParams = await props.searchParams;
  const error = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        username: formData.get("username"),
        password: formData.get("password"),
        redirectTo: "/income",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=1");
      }
      throw err;
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--background)] px-4">
      <form
        action={login}
        className="flex w-full max-w-[420px] flex-col items-center gap-8 rounded-xl border border-[var(--devider)] bg-[var(--surface)] px-6 py-10 sm:px-10 sm:py-14"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/figma/logo.svg" alt="" width={50} height={58} />

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">1L Accounting</h1>
          <p className="text-base text-[var(--text-muted)]">Учёт мастерской</p>
        </div>

        {error && (
          <p className="w-full rounded-md bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
            Неверный логин или пароль
          </p>
        )}

        <div className="flex w-full flex-col gap-6">
          <Field label="Логин">
            <input name="username" required autoFocus placeholder="Введите..." className={inputClass} />
          </Field>
          <Field label="Пароль">
            <input name="password" type="password" required placeholder="Введите..." className={inputClass} />
          </Field>
        </div>

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-[var(--accent-orange)] text-base font-medium text-white hover:brightness-110"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
