import { createFileRoute } from "@tanstack/react-router";

import { Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "ملفي الشخصي | منزلي وأرضي" },
      { name: "description", content: "إدارة إعلاناتك وطلباتك وصفقاتك." },
      { property: "og:title", content: "ملفي الشخصي" },
      { property: "og:description", content: "حسابك على منزلي وأرضي." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ denied: s["denied"] === "1" || s["denied"] === 1 ? "1" : undefined }),
  component: Profile,
});

function Profile() {
  const { user } = Route.useRouteContext();
  const { denied } = Route.useSearch();
  const name = String(user.user_metadata?.["full_name"] ?? "") || "مستخدم";
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {denied && <p role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">ليست لديك صلاحية الوصول إلى لوحة المدير.</p>}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-deep p-6 text-deep-foreground sm:flex-row">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-gold font-display text-3xl font-bold text-deep">{name.charAt(0)}</div>
        <div className="text-center sm:text-right">
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="opacity-75" dir="ltr">{user.email}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-gold"><Lock size={14} />رقم هاتفك مخفي عن المستخدمين الآخرين</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[["إعلاناتي", 0], ["طلباتي", 0], ["صفقاتي", 0]].map(([t, n]) => (
          <div key={t} className="rounded-xl border border-border bg-card p-4"><p className="font-display text-2xl font-bold text-primary">{n}</p><p className="text-sm text-muted-foreground">{t}</p></div>
        ))}
      </div>
      <h2 className="mt-8 text-lg font-bold">إعلاناتي</h2>
      <div className="mt-3 space-y-2">
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">لا توجد إعلانات بعد.</p>
      </div>
      <h2 className="mt-8 text-lg font-bold">طلباتي</h2>
      <p className="mt-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">لا توجد طلبات بعد.</p>
    </div>
  );
}
