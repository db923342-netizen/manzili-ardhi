import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { arabicAuthError } from "@/lib/auth";
import { Field, inputCls, btnPrimary } from "@/components/site";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | منزلي وأرضي" },
      { name: "description", content: "أنشئ حسابك مجانًا لنشر العقارات وطلبات البحث." },
      { property: "og:title", content: "إنشاء حساب" },
      { property: "og:description", content: "انضم إلى منزلي وأرضي." },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password.length < 6) return setError("كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.");
    setBusy(true); setError("");
    const full_name = String(f.get("name")).trim();
    const phone = String(f.get("phone") ?? "").trim();
    const { data, error } = await supabase.auth.signUp({
      email: String(f.get("email")).trim(), password,
      options: { emailRedirectTo: window.location.origin, data: { full_name, phone } },
    });
    setBusy(false);
    if (error) return setError(arabicAuthError(error.message));
    if (data.user && data.user.identities?.length === 0) return setError("هذا البريد الإلكتروني مسجّل مسبقًا. سجّل الدخول بدلًا من ذلك.");
    if (data.session) {
      // Signed in immediately (no email confirmation) — create own profile row (allowed by existing policy).
      await supabase.from("profiles").insert({ id: data.user!.id, full_name, phone: phone || null });
      navigate({ to: "/profile", replace: true });
    } else setSent(true);
  }

  if (sent)
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div role="status" className="space-y-4 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-2xl font-bold text-primary">تم إنشاء حسابك بنجاح</h1>
          <p className="text-muted-foreground">أرسلنا رابط تأكيد إلى بريدك الإلكتروني. افتحه لتفعيل الحساب، ثم سجّل الدخول.</p>
          <Link to="/login" search={{ registered: "1" }} className={`${btnPrimary} inline-block`}>الذهاب لتسجيل الدخول</Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-bold">إنشاء حساب جديد</h1>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Field label="الاسم الكامل"><input name="name" required className={inputCls} /></Field>
        <Field label="البريد الإلكتروني"><input name="email" type="email" dir="ltr" required autoComplete="email" className={inputCls} /></Field>
        <Field label="رقم الهاتف (مخفي عن الآخرين)"><input name="phone" type="tel" dir="ltr" placeholder="05XX XX XX XX" className={inputCls} /></Field>
        <Field label="كلمة المرور (6 أحرف على الأقل)"><input name="password" type="password" dir="ltr" required minLength={6} autoComplete="new-password" className={inputCls} /></Field>
        <button disabled={busy} className={`${btnPrimary} w-full disabled:opacity-60`}>{busy ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}</button>
        <p className="text-center text-sm text-muted-foreground">لديك حساب؟ <Link to="/login" className="font-bold text-primary">سجّل الدخول</Link></p>
      </form>
    </div>
  );
}
