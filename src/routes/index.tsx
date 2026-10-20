import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Search, FileText, Handshake, Clock } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { useQuery } from "@tanstack/react-query";
import { propertiesQuery, requestsQuery } from "@/lib/listings";
import { PropertyCard, RequestCard, WilayaCommune, TypeSelect, btnGold, DeveloperSection } from "@/components/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منزلي وأرضي | إيجار العقارات في الجزائر" },
      { name: "description", content: "ابحث عن شقق وفيلات ومحلات للإيجار في جميع ولايات الجزائر، أو انشر طلب بحثك." },
      { property: "og:title", content: "منزلي وأرضي | إيجار العقارات في الجزائر" },
      { property: "og:description", content: "ابحث عن عقار للإيجار حسب الولاية والبلدية ونوع العقار." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [wilaya, setWilaya] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <section className="relative">
        <img src={hero} alt="فيلا جزائرية مطلة على البحر" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-20 text-deep-foreground md:pt-32">
          <p className="text-gold font-bold">منصة الإيجار العقاري الأولى في الجزائر</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">بيتك القادم في الجزائر، بأمان وشفافية</h1>
          <p className="mt-4 max-w-xl opacity-85">من العاصمة إلى ورقلة، تصفّح آلاف العقارات للإيجار أو انشر طلبك ودع الملاك يجدونك.</p>
          <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search" }); }} className="mt-8 grid gap-3 rounded-2xl bg-card p-4 text-card-foreground shadow-card md:grid-cols-4 md:items-end">
            <WilayaCommune wilaya={wilaya} setWilaya={setWilaya} />
            <TypeSelect />
            <button className={`${btnGold} flex items-center justify-center gap-2`}><Search size={18} />بحث</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Search, t: "ابحث أو انشر", d: "انشر عقارك للإيجار أو طلب بحث مجانًا." },
            { i: ShieldCheck, t: "خصوصية تامة", d: "أرقام الهواتف مخفية حتى إتمام الصفقة." },
            { i: Handshake, t: "صفقة بموافقة المدير", d: "يراجع المدير كل صفقة قبل كشف بيانات التواصل." },
            { i: Clock, t: "كراء شقق مؤقتة", d: "لمدة 24 ساعة فقط، بأسعار تنافسية." },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card p-5">
              <I className="text-gold" />
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">أحدث العقارات</h2>
          <Link to="/search" className="text-sm font-bold text-primary">عرض الكل ←</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(properties ?? []).slice(0, 3).map((p) => <PropertyCard key={p.id} p={p} />)}
          {properties && !properties.length && <p className="col-span-full py-8 text-center text-muted-foreground">لا توجد عقارات منشورة بعد.</p>}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">طلبات البحث</h2>
          <Link to="/request-new" className="flex items-center gap-1 text-sm font-bold text-primary"><FileText size={16} />انشر طلبك</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(requests ?? []).slice(0, 4).map((r) => <RequestCard key={r.id} r={r} />)}
          {requests && !requests.length && <p className="col-span-full py-8 text-center text-muted-foreground">لا توجد طلبات بحث منشورة بعد.</p>}
        </div>
      </section>
      <DeveloperSection />
    </>
  );
}
