import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Search, FileText, Handshake, Clock } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { useQuery } from "@tanstack/react-query";
import { propertiesQuery, requestsQuery, temporaryRentalsQuery } from "@/lib/listings";
import {
  PropertyCard,
  RequestCard,
  WilayaCommune,
  TypeSelect,
  btnGold,
  DeveloperSection,
} from "@/components/site";
import { formatDA } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منزلي وأرضي | إيجار العقارات في الجزائر" },
      {
        name: "description",
        content: "ابحث عن شقق وفيلات ومحلات للإيجار في جميع ولايات الجزائر، أو انشر طلب بحثك.",
      },
      { property: "og:title", content: "منزلي وأرضي | إيجار العقارات في الجزائر" },
      {
        property: "og:description",
        content: "ابحث عن عقار للإيجار حسب الولاية والبلدية ونوع العقار.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const navigate = useNavigate();
  const { data: properties } = useQuery(propertiesQuery);
  const { data: requests } = useQuery(requestsQuery);
  const { data: temporaryRentals = [] } = useQuery(temporaryRentalsQuery);
  return (
    <>
      <section className="relative">
        <img
          src={hero}
          alt="فيلا جزائرية مطلة على البحر"
          width={1600}
          height={912}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-hero" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-20 text-deep-foreground md:pt-32">
          <div className="flex flex-col-reverse items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="font-bold text-gold">منصة الإيجار العقاري الأولى في الجزائر</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">
                بيتك القادم في الجزائر، بأمان وشفافية
              </h1>
              <p className="mt-4 max-w-xl opacity-85">
                عبر كافة ولايات الجزائر الـ 69، تصفّح آلاف العقارات للإيجار أو انشر طلبك ودع الملاك
                يجدونك.
              </p>
            </div>
            <div className="shrink-0 self-center md:self-auto">
              <img
                src="/assets/logo.png"
                alt="شعار منزلي وأرضي لكراء العقارات والأراضي"
                className="h-32 w-32 md:h-44 md:w-44 rounded-2xl bg-white/95 p-2 shadow-2xl border-2 border-gold/40 object-contain"
              />
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({
                to: "/search",
                search: {
                  w: wilaya || undefined,
                  c: commune || undefined,
                },
              });
            }}
            className="mt-8 grid gap-3 rounded-2xl bg-card p-4 text-card-foreground shadow-card md:grid-cols-4 md:items-end"
          >
            <WilayaCommune
              wilaya={wilaya}
              setWilaya={setWilaya}
              commune={commune}
              setCommune={setCommune}
              allOption={true}
            />
            <TypeSelect />
            <button className={`${btnGold} flex items-center justify-center gap-2`}>
              <Search size={18} />
              بحث
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              i: Search,
              t: "ابحث أو انشر",
              d: "انشر عقارك للإيجار أو طلب بحث مجانًا.",
              link: "/search",
            },
            {
              i: ShieldCheck,
              t: "خصوصية تامة",
              d: "أرقام الهواتف مخفية حتى إتمام الصفقة.",
              link: "/fees",
            },
            {
              i: Handshake,
              t: "صفقة بموافقة المدير",
              d: "يراجع المدير كل صفقة قبل كشف بيانات التواصل.",
              link: "/fees",
            },
            {
              i: Clock,
              t: "كراء شقق مؤقتة",
              d: "باليوم و24 ساعة فما فوق، بأسعار تنافسية وشقق مفروشة.",
              link: "/temporary-rentals",
              highlight: true,
            },
          ].map(({ i: I, t, d, link, highlight }) => (
            <Link
              key={t}
              to={link}
              className={`rounded-xl border p-5 transition group block ${
                highlight
                  ? "border-gold/50 bg-gold/5 hover:border-gold hover:shadow-md"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <I className={highlight ? "text-gold" : "text-primary"} />
                {highlight && (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-black text-gold">
                    ميزة جديدة
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-bold group-hover:text-gold transition">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Temporary Rentals Highlight Section */}
      <section className="mx-auto max-w-6xl px-4 mb-14">
        <div className="rounded-3xl border border-gold/30 bg-gradient-to-r from-deep via-deep/95 to-secondary/30 p-6 sm:p-8 text-deep-foreground shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-white/10 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-0.5 text-xs font-bold text-gold mb-2">
                <Clock size={13} />
                <span>كراء شقق مؤقتة باليوم (24 ساعة)</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                شقق واستوديوهات مفروشة للكراء المؤقت
              </h2>
              <p className="text-xs md:text-sm text-deep-foreground/75 mt-1">
                خيارات مثالية لرحلات العمل، العطلات العائلية، والزيارات القصيرة عبر الجزائر، وهران،
                قسنطينة وبجاية.
              </p>
            </div>
            <Link
              to="/temporary-rentals"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-black text-deep hover:brightness-105 transition shrink-0"
            >
              <span>استكشف كل الشقق المؤقتة</span>
              <span>←</span>
            </Link>
          </div>

          {temporaryRentals.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card p-8 text-center text-card-foreground shadow">
              <Clock className="mx-auto h-10 w-10 text-gold mb-2" />
              <h3 className="font-bold text-base">لا توجد شقق مؤقتة معروضة حالياً</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                هل تملك شقة مفروشة أو استوديو؟ انشرها الآن للكراء المؤقت باليوم واستقبل مستأجرين
                موثوقين.
              </p>
              <Link
                to="/publish"
                search={{ mode: "temporary" }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-black text-deep shadow hover:brightness-105 transition"
              >
                <span>انشر شقتك للكراء المؤقت مجاناً</span>
                <span>←</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {temporaryRentals.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-white/10 bg-card text-card-foreground overflow-hidden shadow hover:shadow-lg transition flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <img src={r.image} alt={r.title} className="h-full w-full object-cover" />
                    <div className="absolute top-2.5 right-2.5 rounded-md bg-gold px-2 py-0.5 text-[11px] font-black text-deep">
                      كراء مؤقت
                    </div>
                    <div className="absolute bottom-2 right-2 rounded bg-black/60 backdrop-blur px-2 py-0.5 text-[11px] text-white">
                      {r.commune}، {r.wilaya}
                    </div>
                  </div>
                  <div className="p-4 flex flex-1 flex-col">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{r.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {r.description}
                    </p>
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
                      <span className="font-black text-primary text-sm">
                        {formatDA(r.nightlyPrice)}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {" "}
                          / 24 سا
                        </span>
                      </span>
                      <Link
                        to="/temporary-rentals"
                        className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground hover:bg-gold hover:text-deep transition"
                      >
                        حجز الشقة
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">أحدث العقارات للإيجار الدائم</h2>
          <Link to="/search" className="text-sm font-bold text-primary">
            عرض الكل ←
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(properties ?? []).slice(0, 3).map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
          {properties && !properties.length && (
            <p className="col-span-full py-8 text-center text-muted-foreground">
              لا توجد عقارات منشورة بعد.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">طلبات البحث</h2>
          <Link
            to="/request-new"
            className="flex items-center gap-1 text-sm font-bold text-primary"
          >
            <FileText size={16} />
            انشر طلبك
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(requests ?? []).slice(0, 4).map((r) => (
            <RequestCard key={r.id} r={r} />
          ))}
          {requests && !requests.length && (
            <p className="col-span-full py-8 text-center text-muted-foreground">
              لا توجد طلبات بحث منشورة بعد.
            </p>
          )}
        </div>
      </section>

      <DeveloperSection />
    </>
  );
}
