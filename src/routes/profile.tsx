import { createFileRoute, Link } from "@tanstack/react-router";
import { properties, requests, formatDA } from "@/lib/data";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "ملفي الشخصي | منزلي وأرضي" },
      { name: "description", content: "إدارة إعلاناتك وطلباتك وصفقاتك." },
      { property: "og:title", content: "ملفي الشخصي" },
      { property: "og:description", content: "حسابك على منزلي وأرضي." },
    ],
  }),
  component: Profile,
});

function Profile() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-deep p-6 text-deep-foreground sm:flex-row">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-gold font-display text-3xl font-bold text-deep">ك</div>
        <div className="text-center sm:text-right">
          <h1 className="text-2xl font-bold">كريم بن علي</h1>
          <p className="opacity-75" dir="ltr">karim@example.dz</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-gold"><Lock size={14} />رقم هاتفك مخفي عن المستخدمين الآخرين</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[["إعلاناتي", 2], ["طلباتي", 1], ["صفقاتي", 1]].map(([t, n]) => (
          <div key={t} className="rounded-xl border border-border bg-card p-4"><p className="font-display text-2xl font-bold text-primary">{n}</p><p className="text-sm text-muted-foreground">{t}</p></div>
        ))}
      </div>
      <h2 className="mt-8 text-lg font-bold">إعلاناتي</h2>
      <div className="mt-3 space-y-2">
        {properties.slice(0, 2).map((p) => (
          <Link key={p.id} to="/property/$id" params={{ id: p.id }} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <span>{p.title}</span><span className="text-sm text-muted-foreground">{formatDA(p.price)} • {p.status}</span>
          </Link>
        ))}
      </div>
      <h2 className="mt-8 text-lg font-bold">طلباتي</h2>
      <Link to="/request/$id" params={{ id: requests[0]!.id }} className="mt-3 flex justify-between rounded-xl border border-border bg-card p-4">
        <span>{requests[0]!.title}</span><span className="text-sm text-muted-foreground">{requests[0]!.wilaya}</span>
      </Link>
    </div>
  );
}
