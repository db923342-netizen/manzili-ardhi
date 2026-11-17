import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Search,
  FileText,
  Handshake,
  Clock,
  Building2,
  Home,
  PlusCircle,
  MapPin,
  Calendar,
  Sparkles,
  Tag,
  BadgeCheck,
} from "lucide-react";
import hero from "@/assets/hero.jpg";
import { useQuery } from "@tanstack/react-query";
import {
  propertiesQuery,
  requestsQuery,
  temporaryRentalsQuery,
  temporaryRequestsQuery,
  salesPropertiesQuery,
} from "@/lib/listings";
import {
  PropertyCard,
  RequestCard,
  WilayaCommune,
  TypeSelect,
  btnGold,
  btnPrimary,
  DeveloperSection,
  HiddenPhone,
} from "@/components/site";
import { formatDA, formatPublishTime } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منزلي وأرضي | منصة العقارات الأولى في الجزائر" },
      {
        name: "description",
        content:
          "الأركان الثلاثة للعقارات في الجزائر: ركن الكراء الدائم (عروض وطلبات)، ركن الكراء المؤقت (24 ساعة فما فوق)، وركن البيع والشراء النهائي عبر 69 ولاية.",
      },
      { property: "og:title", content: "منزلي وأرضي | منصة العقارات في الجزائر" },
      {
        property: "og:description",
        content: "كراء دائم، كراء مؤقت، وبيع وشراء نهائي بدون وسطاء عبر كافة ولايات الجزائر.",
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
  const [permanentSection, setPermanentSection] = useState<"offers" | "requests">("offers");
  const [tempSection, setTempSection] = useState<"offers" | "requests">("offers");
  const navigate = useNavigate();

  const { data: properties } = useQuery(propertiesQuery);
  const { data: requests } = useQuery(requestsQuery);
  const { data: temporaryRentals = [] } = useQuery(temporaryRentalsQuery);
  const { data: temporaryRequests = [] } = useQuery(temporaryRequestsQuery);
  const { data: salesList = [] } = useQuery(salesPropertiesQuery);

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
                عبر كافة ولايات الجزائر الـ 69، تصفّح آلاف العقارات للإيجار الدائم أو المؤقت، أو
                انشر طلبك ودع الملاك يجدونك.
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
            <button className={`${btnGold} flex items-center justify-center gap-2 cursor-pointer`}>
              <Search size={18} />
              بحث في العقارات
            </button>
          </form>
        </div>
      </section>

      {/* The 3 Core Pillars Section */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 text-center max-w-2xl mx-auto">
          <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold">
            الهيكلة المعتمدة للمنصة
          </span>
          <h2 className="mt-2 text-2xl font-black md:text-3xl text-foreground">
            الأركان الثلاثة لمنصة منزلي وأرضي
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            كل ما تحتاجه في عالم الإيجار العقاري الجزائري منظم في 3 أركان رئيسية ومستقلة
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Pillar 1: ركن الكراء الدائم (Emerald Green Theme) */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/70 transition-all duration-300">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />
            <div>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                  <Building2 size={24} />
                </div>
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-black text-white shadow-sm">
                  الركن الأول • شهري وسنوي
                </span>
              </div>
              <h3 className="mt-4 text-xl font-black text-emerald-950 dark:text-emerald-100">
                ركن الكراء الدائم
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                إيجار شهري وسنوي مقسم إلى: <b>قسم العقارات المعروضة للكراء</b> و<b>طلبات الكراء</b>،
                بأنماط كراء شقق، أراضي، محلات تجارية وفيلات عبر 58 ولاية.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                <Link
                  to="/search"
                  search={{ t: "شقة" }}
                  className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-600 hover:text-white transition"
                >
                  🏢 شقق
                </Link>
                <Link
                  to="/search"
                  search={{ t: "أرض" }}
                  className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-600 hover:text-white transition"
                >
                  🏞️ أراضي
                </Link>
                <Link
                  to="/search"
                  search={{ t: "محل تجاري" }}
                  className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-600 hover:text-white transition"
                >
                  🏬 محلات
                </Link>
                <Link
                  to="/search"
                  search={{ t: "فيلا" }}
                  className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-600 hover:text-white transition"
                >
                  🏡 فيلات
                </Link>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold">
              <Link
                to="/search"
                search={{ section: "offers" }}
                className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>العقارات المعروضة</span>
                <span>←</span>
              </Link>
              <Link
                to="/search"
                search={{ section: "requests" }}
                className="text-muted-foreground hover:text-foreground"
              >
                طلبات الكراء ←
              </Link>
            </div>
          </div>

          {/* Pillar 2: ركن الكراء المؤقت (Sunset Amber & Gold Theme) */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/15 via-card to-amber-500/5 p-6 shadow-sm hover:shadow-xl hover:border-amber-500/80 transition-all duration-300">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300" />
            <div>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30 font-bold">
                  <Clock size={24} />
                </div>
                <span className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-black text-slate-950 shadow-sm">
                  الركن الثاني • 24 سا فوري
                </span>
              </div>
              <h3 className="mt-4 text-xl font-black text-amber-950 dark:text-amber-100">
                ركن الكراء المؤقت
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                شقق واستوديوهات مفروشة للكراء باليوم والأسبوع. يحتوي على <b>العروض</b> و
                <b>الطلبات</b> مستقلين عن بعضهما تماماً مع تأكيد حجز سريع ومباشر.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-900 dark:text-amber-200">
                  ⚡ 24 ساعة فوري
                </span>
                <span className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-900 dark:text-amber-200">
                  🛋️ شقق مفروشة
                </span>
                <span className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-900 dark:text-amber-200">
                  🏖️ استوديوهات
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-amber-500/20 flex items-center justify-between text-xs font-bold">
              <Link
                to="/temporary-rentals"
                search={{ section: "offers" }}
                className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>عروض الشقق المؤقتة</span>
                <span>←</span>
              </Link>
              <Link
                to="/temporary-rentals"
                search={{ section: "requests" }}
                className="text-muted-foreground hover:text-foreground"
              >
                طلبات الكراء المؤقت ←
              </Link>
            </div>
          </div>

          {/* Pillar 3: ركن البيع والشراء النهائي (Royal Sapphire & Indigo Theme) */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-blue-600/40 bg-gradient-to-br from-blue-600/15 via-card to-indigo-600/5 p-6 shadow-sm hover:shadow-xl hover:border-blue-600/70 transition-all duration-300">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
            <div>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                  <Tag size={24} />
                </div>
                <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-black text-white shadow-sm">
                  الركن الثالث • تمليك رسمي
                </span>
              </div>
              <h3 className="mt-4 text-xl font-black text-blue-950 dark:text-blue-100">
                ركن البيع والشراء النهائي
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                عقارات للبيع وطلبات شراء موثقة عبر 58 ولاية (شقق تمليك، أراضي، محلات، فيلات ومنازل)
                مع فحص الوثائق الرسمية والمطابقة العقارية.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-lg bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 font-bold text-blue-900 dark:text-blue-200">
                  📜 عقد توثيقي
                </span>
                <span className="rounded-lg bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 font-bold text-blue-900 dark:text-blue-200">
                  📗 دفتر عقاري
                </span>
                <span className="rounded-lg bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 font-bold text-blue-900 dark:text-blue-200">
                  🏡 تمليك فردي
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-blue-500/20 flex items-center justify-between text-xs font-bold">
              <Link
                to="/sales"
                search={{ section: "offers" }}
                className="text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>عقارات معروضة للبيع</span>
                <span>←</span>
              </Link>
              <Link
                to="/sales"
                search={{ section: "requests" }}
                className="text-muted-foreground hover:text-foreground"
              >
                طلبات الشراء الجادة ←
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pillar 1 Showcase: ركن الكراء الدائم (عروض + طلبات + أنماط) */}
      <section className="mx-auto max-w-6xl px-4 mb-16">
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-emerald-950/5 p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white mb-2 shadow-sm">
                <Building2 size={13} />
                <span>الركن الأول: ركن الكراء الدائم</span>
              </div>
              <h2 className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
                عقارات وطلبات الإيجار الدائم (شهري وسنوي)
              </h2>
            </div>

            {/* Sub-section Switcher */}
            <div className="inline-flex rounded-xl bg-secondary/80 p-1 border border-emerald-500/20">
              <button
                type="button"
                onClick={() => setPermanentSection("offers")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  permanentSection === "offers"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                العقارات المعروضة ({properties?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setPermanentSection("requests")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  permanentSection === "requests"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                طلبات الكراء ({requests?.length ?? 0})
              </button>
            </div>
          </div>

          {/* Quick pattern filters links */}
          <div className="mb-6 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-semibold">تصفح بالأنماط:</span>
            {[
              { label: "🏢 كراء شقق", t: "شقة" },
              { label: "🏞️ كراء أراضي", t: "أرض" },
              { label: "🏬 كراء محلات", t: "محل تجاري" },
              { label: "🏡 كراء فيلات", t: "فيلا" },
              { label: "🏠 كراء منازل", t: "منزل" },
            ].map((pat) => (
              <Link
                key={pat.t}
                to="/search"
                search={{ section: permanentSection, t: pat.t }}
                className="rounded-lg border border-emerald-500/20 bg-background/80 px-3 py-1 font-bold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-600 hover:text-white transition"
              >
                {pat.label}
              </Link>
            ))}
            <Link
              to="/search"
              search={{ section: permanentSection }}
              className="mr-auto font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              عرض الكل في ركن الكراء الدائم ←
            </Link>
          </div>

          {permanentSection === "offers" ? (
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
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(requests ?? []).slice(0, 3).map((r) => (
                <RequestCard key={r.id} r={r} />
              ))}
              {requests && !requests.length && (
                <p className="col-span-full py-8 text-center text-muted-foreground">
                  لا توجد طلبات كراء منشورة بعد.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Pillar 2 Showcase: ركن الكراء المؤقت (مستقل - عروض وطلبات) */}
      <section className="mx-auto max-w-6xl px-4 mb-16">
        <div className="rounded-3xl border border-gold/30 bg-gradient-to-r from-deep via-deep/95 to-secondary/30 p-6 sm:p-8 text-deep-foreground shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-white/10 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-0.5 text-xs font-bold text-gold mb-2">
                <Clock size={13} />
                <span>الركن الثاني: ركن الكراء المؤقت (24 ساعة فما فوق)</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                شقق واستوديوهات مفروشة للكراء المؤقت
              </h2>
              <p className="text-xs md:text-sm text-deep-foreground/75 mt-1">
                ركن مستقل تماماً يضم قسمين مستقلين: عروض الشقق المؤقتة وطلبات الكراء المؤقت
              </p>
            </div>

            {/* Toggle Offers / Requests for Temporary Rentals */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/15">
                <button
                  type="button"
                  onClick={() => setTempSection("offers")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                    tempSection === "offers"
                      ? "bg-gold text-deep shadow"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  عروض الشقق ({temporaryRentals.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTempSection("requests")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                    tempSection === "requests"
                      ? "bg-gold text-deep shadow"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  طلبات الكراء ({temporaryRequests.length})
                </button>
              </div>

              <Link
                to="/temporary-rentals"
                search={{ section: tempSection }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-black text-deep hover:brightness-105 transition shrink-0"
              >
                <span>الدخول إلى ركن الكراء المؤقت</span>
                <span>←</span>
              </Link>
            </div>
          </div>

          {tempSection === "offers" ? (
            temporaryRentals.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-card p-8 text-center text-card-foreground shadow">
                <Clock className="mx-auto h-10 w-10 text-gold mb-2" />
                <h3 className="font-bold text-base">لا توجد شقق مؤقتة معروضة حالياً</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  هل تملك شقة مفروشة أو استوديو؟ انشرها الآن للكراء المؤقت باليوم واستقبل مستأجرين.
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
                          search={{ section: "offers" }}
                          className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground hover:bg-gold hover:text-deep transition"
                        >
                          حجز الشقة
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : temporaryRequests.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card p-8 text-center text-card-foreground shadow">
              <Clock className="mx-auto h-10 w-10 text-gold mb-2" />
              <h3 className="font-bold text-base">لا توجد طلبات كراء مؤقت حالياً</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                هل تبحث عن شقة مفروشة لمدة 24 ساعة أو عدة أيام؟ انشر طلبك الآن مجاناً ليراك الملاك.
              </p>
              <Link
                to="/temporary-rentals"
                search={{ section: "requests" }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-black text-deep shadow hover:brightness-105 transition"
              >
                <span>انشر طلب كراء مؤقت</span>
                <span>←</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {temporaryRequests.slice(0, 3).map((tr) => (
                <div
                  key={tr.id}
                  className="rounded-2xl border border-white/10 bg-card text-card-foreground p-4 shadow flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-gold/20 px-2 py-0.5 text-[11px] font-bold text-gold">
                        طلب مؤقت • {tr.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatPublishTime(tr.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{tr.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {tr.commune}، ولاية {tr.wilaya}
                    </p>
                    <div className="rounded-lg bg-secondary/70 p-2 text-xs flex justify-between">
                      <span>
                        المدة: <b>{tr.durationDays} أيام</b>
                      </span>
                      <span>
                        الميزانية: <b className="text-primary">{formatDA(tr.budgetPerNight)}</b> /
                        ليلة
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{tr.author}</span>
                    <Link
                      to="/temporary-rentals"
                      search={{ section: "requests" }}
                      className="rounded-lg bg-gold px-3 py-1 text-xs font-bold text-deep hover:brightness-105 transition"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pillar 3 Showcase: ركن البيع والشراء النهائي (Royal Blue / Indigo Theme) */}
      <section className="mx-auto max-w-6xl px-4 mb-16">
        <div className="rounded-3xl border-2 border-blue-600/30 bg-gradient-to-br from-blue-600/10 via-card to-indigo-950/10 p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-500/20 pb-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white mb-2 shadow-sm">
                <Tag size={13} />
                <span>الركن الثالث: ركن البيع والشراء النهائي</span>
              </div>
              <h2 className="text-2xl font-black text-blue-950 dark:text-blue-100">
                سوق العقارات للبيع وطلبات الشراء في الجزائر
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                شقق تمليك، أراضي، فيلات ومحلات بعقود ملكية موثقة ودفاتر عقارية خالية من النزاعات
              </p>
            </div>
            <Link
              to="/sales"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition shrink-0"
            >
              <span>دخول ركن البيع والشراء</span>
              <span>←</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesList.data?.slice(0, 3).map((prop) => (
              <div
                key={prop.id}
                className="rounded-2xl border border-blue-500/20 bg-card p-4 shadow-sm hover:shadow-lg hover:border-blue-500/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:text-blue-300">
                      للبيع النهائي
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BadgeCheck size={12} />
                      {prop.legalStatus ?? "عقد توثيقي"}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{prop.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {prop.commune}، ولاية {prop.wilaya}
                  </p>
                  <div className="mt-3 rounded-lg bg-secondary/70 p-2 text-xs flex justify-between">
                    <span>
                      المساحة: <b>{prop.area} م²</b>
                    </span>
                    <span>
                      النوع: <b>{prop.propertyType}</b>
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-black text-blue-700 dark:text-blue-400">
                    {formatDA(prop.price)}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{prop.ownerName}</span>
                  <Link
                    to="/sales"
                    search={{ section: "offers" }}
                    className="rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white px-3 py-1 text-xs font-bold transition"
                  >
                    تفاصيل العقار
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DeveloperSection />
    </>
  );
}
