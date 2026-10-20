import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, User, Calendar } from "lucide-react";
import { formatDA, fees } from "@/lib/data";
import { requestsQuery } from "@/lib/listings";
import { HiddenPhone, btnPrimary } from "@/components/site";

export const Route = createFileRoute("/request/$id")({
  loader: async ({ params, context }) => {
    const r = (await context.queryClient.ensureQueryData(requestsQuery)).find((x) => x.id === params.id);
    if (!r) throw notFound();
    return r;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} | منزلي وأرضي` : "طلب غير متوفر" },
      { name: "description", content: loaderData?.details ?? "تفاصيل طلب البحث" },
      { property: "og:title", content: loaderData?.title ?? "طلب بحث" },
      { property: "og:description", content: loaderData?.details ?? "تفاصيل طلب البحث" },
    ],
  }),
  notFoundComponent: () => <p className="py-24 text-center">الطلب غير موجود. <Link to="/requests" className="text-primary">العودة</Link></p>,
  errorComponent: ({ error }) => <p role="alert" className="py-24 text-center text-destructive">{error instanceof Error ? error.message : "حدث خطأ"}</p>,
  component: Detail,
});

function Detail() {
  const r = Route.useLoaderData();
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-10 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-bold">طلب بحث • {r.type}</span>
        <h1 className="text-2xl font-bold">{r.title}</h1>
        <p className="flex items-center gap-1 text-muted-foreground"><MapPin size={16} />{r.commune}، ولاية {r.wilaya}</p>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-secondary p-4 text-sm">
          <span>الميزانية القصوى: <b>{formatDA(r.budget)}</b></span>
          <span>عدد الغرف: <b>{r.rooms}</b></span>
          <span className="flex items-center gap-1"><User size={14} />{r.author}</span>
          <span className="flex items-center gap-1"><Calendar size={14} />{r.date}</span>
        </div>
        <h2 className="font-bold">التفاصيل</h2>
        <p className="leading-8 text-muted-foreground">{r.details}</p>
      </div>
      <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
        <HiddenPhone />
        <button className={`${btnPrimary} w-full`}>اقترح عقارك</button>
        <p className="text-xs text-muted-foreground">رسوم إتمام الصفقة للمالك: {formatDA(fees.dealOwner)}.</p>
      </aside>
    </div>
  );
}
