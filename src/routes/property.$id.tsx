import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, BedDouble, Ruler, User } from "lucide-react";
import { properties, formatDA, fees } from "@/lib/data";
import { HiddenPhone, btnPrimary } from "@/components/site";

export const Route = createFileRoute("/property/$id")({
  loader: ({ params }) => {
    const p = properties.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} | منزلي وأرضي` : "عقار غير متوفر" },
      { name: "description", content: loaderData?.description ?? "تفاصيل العقار" },
      { property: "og:title", content: loaderData?.title ?? "عقار" },
      { property: "og:description", content: loaderData?.description ?? "تفاصيل العقار" },
      ...(loaderData ? [{ property: "og:image", content: loaderData.image }, { name: "twitter:image", content: loaderData.image }] : []),
    ],
  }),
  notFoundComponent: () => <p className="py-24 text-center">العقار غير موجود. <Link to="/search" className="text-primary">العودة</Link></p>,
  component: Detail,
});

function Detail() {
  const p = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <img src={p.image} alt={p.title} className="aspect-[16/9] w-full rounded-2xl object-cover md:aspect-[21/9]" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-bold">{p.type} • {p.status}</span>
          <h1 className="text-2xl font-bold md:text-3xl">{p.title}</h1>
          <p className="flex items-center gap-1 text-muted-foreground"><MapPin size={16} />{p.commune}، ولاية {p.wilaya}</p>
          <div className="flex gap-6 rounded-xl bg-secondary p-4 text-sm">
            <span className="flex items-center gap-1"><BedDouble size={16} />{p.rooms} غرف</span>
            <span className="flex items-center gap-1"><Ruler size={16} />{p.area} م²</span>
          </div>
          <h2 className="text-lg font-bold">الوصف</h2>
          <p className="leading-8 text-muted-foreground">{p.description}</p>
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="font-display text-2xl font-bold text-primary">{formatDA(p.price)} <span className="text-sm font-normal text-muted-foreground">/ شهر</span></p>
          <p className="flex items-center gap-2 text-sm"><User size={16} />المالك: {p.owner}</p>
          <HiddenPhone />
          <button className={`${btnPrimary} w-full`}>طلب إتمام الصفقة</button>
          <p className="text-xs text-muted-foreground">رسوم إتمام الصفقة للمستأجر: {formatDA(fees.dealTenant)}. <Link to="/fees" className="text-primary">التفاصيل</Link></p>
        </aside>
      </div>
    </div>
  );
}
