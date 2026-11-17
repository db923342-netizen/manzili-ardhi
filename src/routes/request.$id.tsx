import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, User, Calendar, Trash2, Loader2, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDA, fees, formatPublishTime } from "@/lib/data";
import { requestsQuery, salesRequestsQuery, executeDeleteRequest } from "@/lib/listings";
import { HiddenPhone, btnPrimary } from "@/components/site";
import { useIsAdmin } from "@/lib/auth";
import { maskPhoneNumbers } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/request/$id")({
  loader: async ({ params, context }) => {
    const [rentalReqs, saleReqs] = await Promise.all([
      context.queryClient.ensureQueryData(requestsQuery),
      context.queryClient.ensureQueryData(salesRequestsQuery),
    ]);
    const r = [...rentalReqs, ...saleReqs].find((x) => x.id === params.id);
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
  notFoundComponent: () => (
    <p className="py-24 text-center">
      الطلب غير موجود.{" "}
      <Link to="/requests" className="text-primary">
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
  const r = Route.useLoaderData();
  const { isAdmin } = useIsAdmin();
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleAdminDelete() {
    setIsDeleting(true);
    try {
      await executeDeleteRequest(r, queryClient);
      toast.success("تم حذف طلب البحث بنجاح.");
      navigate({ to: "/requests" });
    } catch {
      toast.error("تعذر حذف طلب البحث.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-10 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
            {r.purpose === "شراء" ? "طلب شراء نهائي" : "طلب بحث"} • {r.type}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Clock size={13} className="text-gold" />
            وقت النشر: {formatPublishTime(r.createdAt || r.date)}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{maskPhoneNumbers(r.title)}</h1>
        <p className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
          <MapPin size={16} className="text-primary" />
          <span>
            {r.commune}، ولاية {r.wilaya}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-secondary p-4 text-sm">
          <span>
            {r.purpose === "شراء" ? "الميزانية المحددة للشراء:" : "السعر:"}{" "}
            <b className="text-primary font-extrabold">{formatDA(r.budget)}</b>
          </span>
          <span>
            عدد الغرف: <b>{r.rooms}</b>
          </span>
          <span className="flex items-center gap-1">
            <User size={14} />
            {r.author}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} className="text-gold" />
            {formatPublishTime(r.createdAt || r.date)}
          </span>
        </div>
        <h2 className="font-bold">التفاصيل</h2>
        <p className="leading-8 text-muted-foreground whitespace-pre-line">
          {maskPhoneNumbers(r.details)}
        </p>
      </div>
      <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
        <HiddenPhone
          label="رقم هاتف صاحب الطلب"
          phone={r.contactPhone}
          listingId={r.id}
          listingType="request"
          isAdmin={isAdmin}
        />
        <button className={`${btnPrimary} w-full`}>اقترح عقارك وتواصل معه</button>
        <p className="text-xs text-muted-foreground">
          رسوم إتمام الصفقة للمالك: {formatDA(fees.dealOwner)}.
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
              حذف هذا الطلب نهائياً
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
