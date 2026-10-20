import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Building2, FileText, Handshake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDA } from "@/lib/data";
import { propertiesQuery, requestsQuery } from "@/lib/listings";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم المدير | منزلي وأرضي" },
      { name: "description", content: "إدارة المستخدمين والعقارات والطلبات والصفقات." },
      { property: "og:title", content: "لوحة تحكم المدير" },
      { property: "og:description", content: "إدارة منصة منزلي وأرضي." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const users: { n: string; e: string; s: string }[] = [];
const deals: { id: string; p: string; a: string; b: string; paid: boolean; s: string }[] = [];

const tabs = [
  { k: "deals", t: "الصفقات", i: Handshake },
  { k: "props", t: "العقارات", i: Building2 },
  { k: "reqs", t: "الطلبات", i: FileText },
  { k: "users", t: "المستخدمون", i: Users },
] as const;

const btn = "rounded-md px-3 py-1 text-xs font-bold";

function Admin() {
  const [tab, setTab] = useState<(typeof tabs)[number]["k"]>("deals");
  const properties = useQuery(propertiesQuery).data ?? [];
  const requests = useQuery(requestsQuery).data ?? [];
  const empty = { deals: deals.length, props: properties.length, reqs: requests.length, users: users.length }[tab] === 0;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">لوحة تحكم المدير</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["المستخدمون", users.length], ["العقارات", properties.length], ["الطلبات", requests.length], ["إيرادات الشهر", formatDA(0)]].map(([t, v]) => (
          <div key={t} className="rounded-xl bg-deep p-4 text-deep-foreground"><p className="text-sm opacity-75">{t}</p><p className="mt-1 font-display text-xl font-bold text-gold">{v}</p></div>
        ))}
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto">
        {tabs.map(({ k, t, i: I }) => (
          <button key={k} onClick={() => setTab(k)} className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${tab === k ? "bg-primary text-primary-foreground" : "bg-secondary"}`}><I size={16} />{t}</button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {empty && <p className="py-10 text-center text-muted-foreground">لا توجد بيانات في قاعدة البيانات.</p>}
        {tab === "deals" && deals.map((d) => (
          <Row key={d.id} title={`${d.id} — ${d.p}`} sub={`المالك: ${d.a} • المستأجر: ${d.b} • ${d.paid ? "مدفوعة" : "غير مدفوعة"}`} status={d.s}>
            {d.s === "بانتظار الموافقة" && <><button className={`${btn} bg-primary text-primary-foreground`}>موافقة وكشف الأرقام</button><button className={`${btn} bg-destructive text-destructive-foreground`}>رفض</button></>}
          </Row>
        ))}
        {tab === "props" && properties.map((p) => (
          <Row key={p.id} title={p.title} sub={`${p.wilaya} • ${p.owner} • ${formatDA(p.price)}`} status={p.status}>
            <button className={`${btn} bg-primary text-primary-foreground`}>قبول</button><button className={`${btn} bg-destructive text-destructive-foreground`}>حذف</button>
          </Row>
        ))}
        {tab === "reqs" && requests.map((r) => (
          <Row key={r.id} title={r.title} sub={`${r.wilaya} • ${r.author} • ${formatDA(r.budget)}`} status="منشور">
            <button className={`${btn} bg-destructive text-destructive-foreground`}>حذف</button>
          </Row>
        ))}
        {tab === "users" && users.map((u) => (
          <Row key={u.e} title={u.n} sub={u.e} status={u.s}>
            <button className={`${btn} bg-secondary`}>{u.s === "نشط" ? "إيقاف" : "تفعيل"}</button>
          </Row>
        ))}
      </div>
    </div>
  );
}

function Row({ title, sub, status, children }: { title: string; sub: string; status: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-bold">{title}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-gold-soft px-3 py-1 text-xs">{status}</span>{children}</div>
    </div>
  );
}
