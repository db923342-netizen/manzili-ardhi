import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, BedDouble, Ruler, User, Trash2, Loader2, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDA, fees, formatPublishTime } from "@/lib/data";
import { propertiesQuery, salesPropertiesQuery, executeDeleteProperty } from "@/lib/listings";
import { HiddenPhone, btnPrimary } from "@/components/site";
import { useIsAdmin } from "@/lib/auth";
import { maskPhoneNumbers } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/property/$id")({
  loader: async ({ params, context }) => {
    const [rentalProps, saleProps] = await Promise.all([
      context.queryClient.ensureQueryData(propertiesQuery),
      context.queryClient.ensureQueryData(salesPropertiesQuery),
    ]);
    const p = [...rentalProps, ...saleProps].find((x) => x.id === params.id);
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
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleAdminDelete() {
    setIsDeleting(true);
    try {
      await executeDeleteProperty(p, queryClient);
      toast.success("تم حذف العقار نهائياً بنجاح.");
      navigate({ to: "/search" });
    } catch {
      toast.error("تعذر حذف العقار.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <img
        src={p.image}
        alt={p.title}
        className="aspect-[16/9] w-full rounded-2xl object-cover md:aspect-[21/9] shadow-card"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-foreground">
              {p.type} • {p.status}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Clock size={13} className="text-gold" />
              وقت النشر: {formatPublishTime(p.publishedAt || p.createdAt)}
            </span>
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{maskPhoneNumbers(p.title)}</h1>
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
          <p className="leading-8 text-muted-foreground whitespace-pre-line">
            {maskPhoneNumbers(p.description)}
          </p>
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="font-display text-2xl font-bold text-primary">
            {formatDA(p.price)}{" "}
            {p.purpose === "بيع" ? (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full mr-2">
                سعر البيع النهائي
              </span>
            ) : (
              <span className="text-sm font-normal text-muted-foreground">/ شهر</span>
            )}
          </p>
          {p.legalStatus && (
            <div className="rounded-lg bg-emerald-500/10 p-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              الوضع القانوني: {p.legalStatus}
            </div>
          )}
          <p className="flex items-center gap-2 text-sm">
            <User size={16} />
            المالك: {p.owner}
          </p>
          <HiddenPhone
            label="رقم هاتف صاحب العقار"
            phone={p.ownerPhone}
            listingId={p.id}
            listingType="property"
            isAdmin={isAdmin}
          />
          <button className={`${btnPrimary} w-full`}>
            {p.purpose === "بيع"
              ? "طلب التواصل للشراء ومعاينة الوثائق"
              : "طلب إتمام الصفقة وكشف الرقم"}
          </button>
          <p className="text-xs text-muted-foreground">
            وساطة آمنة ورقم الهاتف محمي ومشفر لحين موافقة الإدارة وتأكيد الطرفين.
          </p>

          {isAdmin && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="text-xs font-bold text-destructive">صلاحيات المدير</p>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleAdminDelete}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                حذف هذا العقار نهائياً
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
