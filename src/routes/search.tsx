import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Clock,
  Building2,
  FileText,
  PlusCircle,
  Home,
  Check,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { propertiesQuery, requestsQuery } from "@/lib/listings";
import { normalizeWilayaName } from "@/lib/data";
import {
  PageTitle,
  PropertyCard,
  RequestCard,
  Field,
  inputCls,
  WilayaCommune,
  btnGold,
} from "@/components/site";

export const Route = createFileRoute("/search")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    section?: "offers" | "requests";
    w?: string | undefined;
    c?: string | undefined;
    t?: string | undefined;
  } => ({
    section: s["section"] === "requests" ? "requests" : "offers",
    w: typeof s["w"] === "string" ? s["w"] : undefined,
    c: typeof s["c"] === "string" ? s["c"] : undefined,
    t: typeof s["t"] === "string" ? s["t"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ركن الكراء الدائم | عقارات وطلبات إيجار في الجزائر" },
      {
        name: "description",
        content:
          "ركن الكراء الدائم في الجزائر: شقق، أراضي، محلات تجارية وفيلات للإيجار، وطلبات كراء معلنة من المستأجرين.",
      },
      { property: "og:title", content: "ركن الكراء الدائم - منزلي وأرضي" },
      {
        property: "og:description",
        content: "قسم العقارات المعروضة وقسم طلبات الكراء بأنماط متعددة: شقق، أراضي، محلات وفلل.",
      },
    ],
  }),
  component: PermanentRentalsPage,
});

const propertyPatternTabs = [
  { key: "", label: "كافة الأنماط" },
  { key: "شقة", label: "🏢 كراء شقق" },
  { key: "أرض", label: "🏞️ كراء أراضي" },
  { key: "محل تجاري", label: "🏬 كراء محلات" },
  { key: "فيلا", label: "🏡 كراء فيلات" },
  { key: "منزل", label: "🏠 كراء منازل" },
  { key: "مستودع", label: "📦 مستودعات" },
];

function PermanentRentalsPage() {
  const searchParams = Route.useSearch();
  const [activeSection, setActiveSection] = useState<"offers" | "requests">(
    searchParams.section ?? "offers",
  );
  const [w, setW] = useState(searchParams.w ?? "");
  const [c, setC] = useState(searchParams.c ?? "");
  const [t, setT] = useState(searchParams.t ?? "");

  const {
    data: propertiesData,
    isLoading: loadingProperties,
    isError: errorProperties,
  } = useQuery(propertiesQuery);
  const {
    data: requestsData,
    isLoading: loadingRequests,
    isError: errorRequests,
  } = useQuery(requestsQuery);

  const propertiesList = propertiesData ?? [];
  const requestsList = requestsData ?? [];

  const normSearchW = normalizeWilayaName(w);

  // Filter properties (Offered)
  const filteredProperties = propertiesList.filter((p) => {
    if (w) {
      const pNorm = normalizeWilayaName(p.wilaya);
      if (pNorm !== normSearchW && p.wilaya !== w) return false;
    }
    if (c) {
      const pCommune = (p.commune ?? "").toLowerCase().trim();
      const searchCommune = c.toLowerCase().trim();
      if (!pCommune.includes(searchCommune) && pCommune !== searchCommune) return false;
    }
    if (t) {
      if (t === "محل تجاري") {
        if (!p.type.includes("محل")) return false;
      } else if (!p.type.includes(t)) {
        return false;
      }
    }
    return true;
  });

  // Filter requests
  const filteredRequests = requestsList.filter((r) => {
    if (w) {
      const rNorm = normalizeWilayaName(r.wilaya);
      if (rNorm !== normSearchW && r.wilaya !== w) return false;
    }
    if (c) {
      const rCommune = (r.commune ?? "").toLowerCase().trim();
      const searchCommune = c.toLowerCase().trim();
      if (!rCommune.includes(searchCommune) && rCommune !== searchCommune) return false;
    }
    if (t) {
      if (t === "محل تجاري") {
        if (!r.type.includes("محل")) return false;
      } else if (!r.type.includes(t)) {
        return false;
      }
    }
    return true;
  });

  return (
    <>
      <PageTitle
        title="ركن الكراء الدائم"
        sub="إيجار شهري وسنوي: تصفح العقارات المعروضة للكراء أو طلبات المستأجرين مقسمة حسب الأنماط العقارية عبر 69 ولاية"
      />

      <div className="mx-auto -mt-6 max-w-6xl px-4">
        {/* Quick Nav to other Pillars */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">الأركان الثلاثة:</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-emerald-600 bg-emerald-600 text-white px-3 py-1 font-bold shadow-sm">
              <Building2 size={13} />
              <span>1. ركن الكراء الدائم (الحالي)</span>
            </span>
            <Link
              to="/temporary-rentals"
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-amber-500/40 bg-amber-500/10 px-3 py-1 font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-500 hover:text-slate-950 transition"
            >
              <Clock size={13} />
              <span>2. ركن الكراء المؤقت (24 سا)</span>
            </Link>
            <Link
              to="/sales"
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-blue-600/40 bg-blue-600/10 px-3 py-1 font-bold text-blue-900 dark:text-blue-200 hover:bg-blue-600 hover:text-white transition"
            >
              <Tag size={13} />
              <span>3. ركن البيع والشراء النهائي</span>
            </Link>
          </div>
        </div>

        {/* Pillar Primary Tabs: قسم العقارات المعروضة vs طلبات الكراء */}
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card to-background p-4 sm:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
            <div className="inline-flex rounded-xl bg-secondary/80 p-1 border border-emerald-500/20">
              <button
                type="button"
                onClick={() => setActiveSection("offers")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs md:text-sm font-bold transition cursor-pointer ${
                  activeSection === "offers"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 size={16} />
                <span>قسم العقارات المعروضة للكراء</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    activeSection === "offers"
                      ? "bg-white/20 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {propertiesList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("requests")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs md:text-sm font-bold transition cursor-pointer ${
                  activeSection === "requests"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText size={16} />
                <span>قسم طلبات الكراء</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    activeSection === "requests"
                      ? "bg-white/20 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {requestsList.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeSection === "offers" ? (
                <Link
                  to="/publish"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-bold text-deep hover:brightness-105 transition shadow-sm"
                >
                  <PlusCircle size={15} />
                  <span>انشر عقارك للإيجار مجاناً</span>
                </Link>
              ) : (
                <Link
                  to="/request-new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-bold text-deep hover:brightness-105 transition shadow-sm"
                >
                  <PlusCircle size={15} />
                  <span>انشر طلب كراء جديد</span>
                </Link>
              )}
            </div>
          </div>

          {/* Sub-categories: أنماط كراء شقق أو أراضي أو محلات... */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-muted-foreground">تصفح حسب النمط العقاري:</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {propertyPatternTabs.map((tab) => {
                const isSelected = t === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setT(tab.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location filters */}
          <div className="mt-4 grid gap-3 pt-4 border-t border-border sm:grid-cols-2">
            <WilayaCommune
              wilaya={w}
              setWilaya={setW}
              commune={c}
              setCommune={setC}
              allOption={true}
            />
          </div>
        </div>

        {/* Section Content */}
        {activeSection === "offers" ? (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>العقارات المعروضة للكراء الدائم</span>
                  {t && (
                    <span className="text-sm font-normal text-muted-foreground">(نمط: {t})</span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredProperties.length} عقار متوفر وفقاً لمعايير التصفية المحددة
                </p>
              </div>
              <Link to="/publish" className="text-xs font-bold text-primary hover:underline">
                + انشر عقارك الآن
              </Link>
            </div>

            {errorProperties && (
              <p role="alert" className="py-8 text-center text-destructive">
                تعذر تحميل العقارات من قاعدة البيانات. يرجى المحاولة لاحقاً.
              </p>
            )}

            {loadingProperties && (
              <p className="py-12 text-center text-muted-foreground">جارٍ تحميل العقارات...</p>
            )}

            {!loadingProperties && !errorProperties && (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProperties.map((p) => (
                    <PropertyCard key={p.id} p={p} />
                  ))}
                </div>

                {!filteredProperties.length && (
                  <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                    <Building2 className="mx-auto h-10 w-10 text-muted-foreground mb-3 opacity-60" />
                    <h3 className="font-bold text-base">
                      لا توجد عقارات معروضة تطابق هذا النمط حالياً
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      كن أول من ينشر عقاراً في هذا النمط أو غيّر معايير الولاية والبلدية.
                    </p>
                    <Link
                      to="/publish"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-deep shadow"
                    >
                      <PlusCircle size={14} />
                      <span>انشر عقارك الآن</span>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>طلبات الكراء الدائم</span>
                  {t && (
                    <span className="text-sm font-normal text-muted-foreground">(نمط: {t})</span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredRequests.length} طلب كراء مسجل من المستأجرين
                </p>
              </div>
              <Link to="/request-new" className="text-xs font-bold text-primary hover:underline">
                + انشر طلب كراء جديد
              </Link>
            </div>

            {errorRequests && (
              <p role="alert" className="py-8 text-center text-destructive">
                تعذر تحميل طلبات الكراء. يرجى المحاولة لاحقاً.
              </p>
            )}

            {loadingRequests && (
              <p className="py-12 text-center text-muted-foreground">جارٍ تحميل طلبات الكراء...</p>
            )}

            {!loadingRequests && !errorRequests && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRequests.map((r) => (
                    <RequestCard key={r.id} r={r} />
                  ))}
                </div>

                {!filteredRequests.length && (
                  <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3 opacity-60" />
                    <h3 className="font-bold text-base">
                      لا توجد طلبات كراء تطابق هذا النمط حالياً
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      هل تبحث عن كراء شقة أو أرض أو محل؟ أضف طلبك الآن ودع الملاك يعرضون عليك
                      عقاراتهم.
                    </p>
                    <Link
                      to="/request-new"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-deep shadow"
                    >
                      <PlusCircle size={14} />
                      <span>انشر طلب كراء جديد</span>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
