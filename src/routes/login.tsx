import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { arabicAuthError, safeRedirect } from "@/lib/auth";
import { Field, inputCls, btnPrimary } from "@/components/site";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
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
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")).trim(), password: String(f.get("password")),
    });
    setBusy(false);
    if (error) return setError(arabicAuthError(error.message));
    navigate({ to: safeRedirect(redirect), replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
        {registered && <p role="status" className="rounded-lg bg-secondary p-3 text-sm text-primary">تم إنشاء حسابك بنجاح. إذا طُلب منك، أكّد بريدك الإلكتروني ثم سجّل الدخول.</p>}
        {redirect && !registered && <p className="rounded-lg bg-gold-soft p-3 text-sm">يجب تسجيل الدخول للوصول إلى هذه الصفحة.</p>}
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Field label="البريد الإلكتروني"><input name="email" type="email" dir="ltr" required autoComplete="email" className={inputCls} /></Field>
        <Field label="كلمة المرور"><input name="password" type="password" dir="ltr" required autoComplete="current-password" className={inputCls} /></Field>
        <button disabled={busy} className={`${btnPrimary} w-full disabled:opacity-60`}>{busy ? "جارٍ الدخول..." : "دخول"}</button>
        <p className="text-center text-sm text-muted-foreground">ليس لديك حساب؟ <Link to="/register" className="font-bold text-primary">أنشئ حسابًا</Link></p>
      </form>
    </div>
  );
}
