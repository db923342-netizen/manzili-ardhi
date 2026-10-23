import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, BedDouble, Ruler, User } from "lucide-react";
import { formatDA, fees } from "@/lib/data";
import { propertiesQuery } from "@/lib/listings";
import { HiddenPhone, btnPrimary } from "@/components/site";
import { useIsAdmin } from "@/lib/auth";
import { PropertyViewer3D } from "@/components/PropertyViewer3D";

export const Route = createFileRoute("/property/$id")({
  loader: async ({ params, context }) => {
    const p = (await context.queryClient.ensureQueryData(propertiesQuery)).find(
      (x) => x.id === params.id,
    );
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} | منزلي وأرضي` : "عقار غير متوفر" },
      { name: "description", content: loaderData?.description ?? "تفاصيل العقار" },
      { property: "og:title", content: loaderData?.title ?? "عقار" },
      { property: "og:description", content: loaderData?.description ?? "تفاصيل العقار" },
      ...(loaderData
        ? [
            { property: "og:image", content: loaderData.image },
            { name: "twitter:image", content: loaderData.image },
          ]
        : []),
    ],
  }),
  notFoundComponent: () => (
    <p className="py-24 text-center">
      العقار غير موجود.{" "}
      <Link to="/search" className="text-primary">
        العودة
      </Link>
    </p>
  ),
  errorComponent: ({ error }) => (
    <p role="alert" className="py-24 text-center text-destructive">
      {error instanceof Error ? error.message : "حدث خطأ"}
    </p>
  ),
  component: Detail,
});

function Detail() {
  const p = Route.useLoaderData();
  const { isAdmin } = useIsAdmin();
  const [viewMode, setViewMode] = useState<"image" | "3d">("image");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* View Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("image")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              viewMode === "image"
                ? "bg-primary text-primary-foreground shadow"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            صور العقار
          </button>
          <button
            type="button"
            onClick={() => setViewMode("3d")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
              viewMode === "3d"
                ? "bg-gold text-deep shadow"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>معاينة ثلاثية الأبعاد 3D</span>
            <span className="rounded-full bg-deep/15 px-1.5 py-0.2 text-[10px]">ميزة حية</span>
          </button>
        </div>
      </div>

      {viewMode === "3d" ? (
        <PropertyViewer3D propertyTitle={p.title} wilaya={p.wilaya} area={p.area} />
      ) : (
        <img
          src={p.image}
          alt={p.title}
          className="aspect-[16/9] w-full rounded-2xl object-cover md:aspect-[21/9]"
        />
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-bold">
            {p.type} • {p.status}
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">{p.title}</h1>
          <p className="flex items-center gap-1 text-muted-foreground">
            <MapPin size={16} />
            {p.commune}، ولاية {p.wilaya}
          </p>
          <div className="flex gap-6 rounded-xl bg-secondary p-4 text-sm">
            <span className="flex items-center gap-1">
              <BedDouble size={16} />
              {p.rooms} غرف
            </span>
            <span className="flex items-center gap-1">
              <Ruler size={16} />
              {p.area} م²
            </span>
          </div>
          <h2 className="text-lg font-bold">الوصف</h2>
          <p className="leading-8 text-muted-foreground">{p.description}</p>
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="font-display text-2xl font-bold text-primary">
            {formatDA(p.price)}{" "}
            <span className="text-sm font-normal text-muted-foreground">/ شهر</span>
          </p>
          <p className="flex items-center gap-2 text-sm">
            <User size={16} />
            المالك: {p.owner}
          </p>
          <HiddenPhone label="رقم هاتف صاحب العقار" phone={p.ownerPhone} isAdmin={isAdmin} />
          <button className={`${btnPrimary} w-full`}>طلب إتمام الصفقة وكشف الرقم</button>
          <p className="text-xs text-muted-foreground">
            رسوم إتمام الصفقة للمستأجر: {formatDA(fees.dealTenant)}.{" "}
            <Link to="/fees" className="text-primary">
              التفاصيل
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
