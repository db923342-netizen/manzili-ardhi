import { createFileRoute, Link } from "@tanstack/react-router";
import { Field, inputCls, btnPrimary } from "@/components/site";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | منزلي وأرضي" },
      { name: "description", content: "سجّل دخولك إلى حسابك في منزلي وأرضي." },
      { property: "og:title", content: "تسجيل الدخول" },
      { property: "og:description", content: "الدخول إلى منصة منزلي وأرضي." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-md px-4 py-14">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
        <Field label="البريد الإلكتروني"><input type="email" dir="ltr" required className={inputCls} /></Field>
        <Field label="كلمة المرور"><input type="password" dir="ltr" required className={inputCls} /></Field>
        <button className={`${btnPrimary} w-full`}>دخول</button>
        <p className="text-center text-sm text-muted-foreground">ليس لديك حساب؟ <Link to="/register" className="font-bold text-primary">أنشئ حسابًا</Link></p>
      </form>
    </div>
  ),
});
