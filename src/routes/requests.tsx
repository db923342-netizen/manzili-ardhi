import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { requestsQuery } from "@/lib/listings";
import { normalizeWilayaName } from "@/lib/data";
import { PageTitle, RequestCard, WilayaCommune, btnGold } from "@/components/site";
import { Building2, FileText, PlusCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "ركن الكراء الدائم - قسم طلبات الكراء | منزلي وأرضي" },
      {
        name: "description",
        content: "تصفح طلبات المستأجرين الباحثين عن شقق، أراضي، ومحلات للإيجار في الجزائر.",
      },
      { property: "og:title", content: "طلبات الكراء - ركن الكراء الدائم" },
      { property: "og:description", content: "مستأجرون يبحثون عن عقارك الآن عبر 69 ولاية." },
    ],
  }),
  component: RequestsPage,
});

const propertyPatternTabs = [
  { key: "", label: "كافة الأنماط" },
  { key: "شقة", label: "🏢 طلبات شقق" },
  { key: "أرض", label: "🏞️ طلبات أراضي" },
  { key: "محل تجاري", label: "🏬 طلبات محلات" },
  { key: "فيلا", label: "🏡 طلبات فيلات" },
  { key: "منزل", label: "🏠 طلبات منازل" },
  { key: "مستودع", label: "📦 طلبات مستودعات" },
];

function RequestsPage() {
  const [w, setW] = useState("");
  const [c, setC] = useState("");
  const [t, setT] = useState("");

  const { data: requests, isLoading, isError } = useQuery(requestsQuery);
  const list = requests ?? [];
  const normSearchW = normalizeWilayaName(w);

  const filtered = list.filter((r) => {
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
        title="ركن الكراء الدائم: قسم طلبات الكراء"
        sub="تصفح طلبات المستأجرين الباحثين عن كراء دائم حسب النمط: شقق، أراضي، محلات تجارية وفيلات"
      />

      <div className="mx-auto -mt-6 max-w-6xl px-4 pb-16">
        {/* Quick Nav to other Pillars */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">الأركان:</span>
            <Link
              to="/search"
              search={{ section: "offers" }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1 font-bold text-foreground hover:bg-secondary transition"
            >
              <Building2 size={13} className="text-primary" />
              <span>قسم العقارات المعروضة</span>
            </Link>
            <Link
              to="/temporary-rentals"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3 py-1 font-bold text-gold hover:bg-gold/20 transition"
            >
              <Clock size={13} />
              <span>ركن الكراء المؤقت (24 سا)</span>
            </Link>
          </div>
          <Link
            to="/request-new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 font-bold text-deep shadow hover:brightness-105 transition"
          >
            <PlusCircle size={14} />
            <span>انشر طلب كراء جديد</span>
          </Link>
        </div>

        {/* Pattern & Location Filter Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <p className="mb-2 text-xs font-bold text-muted-foreground">
            تصفح طلبات الكراء حسب النمط:
          </p>
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

        {/* Results */}
        {isLoading && (
          <p className="py-12 text-center text-muted-foreground">جارٍ تحميل طلبات الكراء...</p>
        )}

        {isError && (
          <p role="alert" className="py-8 text-center text-destructive">
            تعذر تحميل طلبات الكراء. يرجى المحاولة لاحقاً.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>طلبات المستأجرين النشطة</span>
                {t && <span className="text-sm font-normal text-muted-foreground">({t})</span>}
              </h2>
              <span className="text-xs text-muted-foreground">{filtered.length} طلب معلن</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <RequestCard key={r.id} r={r} />
              ))}
            </div>

            {!filtered.length && (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3 opacity-60" />
                <h3 className="font-bold text-base">لا توجد طلبات تطابق هذا النمط حالياً</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  هل تبحث عن كراء شقة أو أرض أو محل؟ انشر طلبك الآن مجاناً ليراه الملاك وأصحاب
                  العقارات.
                </p>
                <Link
                  to="/request-new"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-deep shadow"
                >
                  <PlusCircle size={14} />
                  <span>انشر طلبك الآن</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
