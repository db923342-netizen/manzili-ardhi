import { createFileRoute, Link } from "@tanstack/react-router";
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
  component: () => (
    <div className="mx-auto max-w-md px-4 py-14">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-bold">إنشاء حساب جديد</h1>
        <Field label="الاسم الكامل"><input required className={inputCls} /></Field>
        <Field label="البريد الإلكتروني"><input type="email" dir="ltr" required className={inputCls} /></Field>
        <Field label="رقم الهاتف (مخفي عن الآخرين)"><input type="tel" dir="ltr" placeholder="05XX XX XX XX" className={inputCls} /></Field>
        <Field label="كلمة المرور"><input type="password" dir="ltr" required className={inputCls} /></Field>
        <button className={`${btnPrimary} w-full`}>إنشاء الحساب</button>
        <p className="text-center text-sm text-muted-foreground">لديك حساب؟ <Link to="/login" className="font-bold text-primary">سجّل الدخول</Link></p>
      </form>
    </div>
  ),
});
