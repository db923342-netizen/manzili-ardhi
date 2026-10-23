import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { arabicAuthError, safeRedirect } from "@/lib/auth";
import { Field, inputCls, btnPrimary } from "@/components/site";

export const Route = createFileRoute("/login")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { redirect?: string | undefined; registered?: string | undefined } => ({
    redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined,
    registered: s["registered"] === "1" || s["registered"] === 1 ? "1" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | منزلي وأرضي" },
      { name: "description", content: "سجّل دخولك إلى حسابك في منزلي وأرضي." },
      { property: "og:title", content: "تسجيل الدخول" },
      { property: "og:description", content: "الدخول إلى منصة منزلي وأرضي." },
    ],
  }),
  component: Login,
});

function Login() {
  const { redirect, registered } = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rawEmail = String(f.get("email") ?? "");
    const email = rawEmail.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("البريد الإلكتروني غير صالح.");
    }
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) return setError(arabicAuthError(error.message));
    navigate({ to: safeRedirect(redirect), replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card text-center sm:text-right"
      >
        <div className="flex flex-col items-center justify-center pb-2">
          <img
            src="/assets/icon-circle.png"
            alt="شعار منزلي وأرضي"
            className="h-16 w-16 rounded-full border-2 border-gold/40 shadow object-cover"
          />
          <h1 className="mt-3 text-2xl font-bold">تسجيل الدخول</h1>
          <p className="text-xs text-muted-foreground">أهلاً بك مجدداً في منصة منزلي وأرضي</p>
        </div>
        {registered && (
          <p role="status" className="rounded-lg bg-secondary p-3 text-sm text-primary">
            تم إنشاء حسابك بنجاح. إذا طُلب منك، أكّد بريدك الإلكتروني ثم سجّل الدخول.
          </p>
        )}
        {redirect && !registered && (
          <p className="rounded-lg bg-gold-soft p-3 text-sm">
            يجب تسجيل الدخول للوصول إلى هذه الصفحة.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <Field label="البريد الإلكتروني">
          <input
            name="email"
            type="text"
            inputMode="email"
            dir="ltr"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="email"
            className={inputCls}
            placeholder="example@gmail.com"
          />
        </Field>
        <Field label="كلمة المرور">
          <input
            name="password"
            type="password"
            dir="ltr"
            required
            autoComplete="current-password"
            className={inputCls}
          />
        </Field>
        <button disabled={busy} className={`${btnPrimary} w-full disabled:opacity-60`}>
          {busy ? "جارٍ الدخول..." : "دخول"}
        </button>

        <div className="relative my-3 flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="bg-card px-2 text-xs text-muted-foreground">أو</span>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              setBusy(true);
              setError("");
              const { signInWithGoogle } = await import("@/lib/firebase");
              await signInWithGoogle();
              navigate({ to: safeRedirect(redirect), replace: true });
            } catch (err) {
              console.error(err);
              setError("تعذر تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-bold text-foreground hover:bg-secondary transition disabled:opacity-60 cursor-pointer shadow-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          الدخول السريع بواسطة Google
        </button>

        <p className="text-center text-sm text-muted-foreground">
          ليس لديك حساب؟{" "}
          <Link to="/register" className="font-bold text-primary">
            أنشئ حسابًا
          </Link>
        </p>
      </form>
    </div>
  );
}
