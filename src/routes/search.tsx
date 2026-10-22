import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { propertiesQuery } from "@/lib/listings";
import { propertyTypes, wilayasList, getCommunesForWilaya } from "@/lib/data";
import { PageTitle, PropertyCard, Field, inputCls } from "@/components/site";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): { w?: string | undefined; c?: string | undefined; t?: string | undefined } => ({
    w: typeof s["w"] === "string" ? s["w"] : undefined,
    c: typeof s["c"] === "string" ? s["c"] : undefined,
    t: typeof s["t"] === "string" ? s["t"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "البحث عن عقارات للإيجار في 69 ولاية | منزلي وأرضي" },
      {
        name: "description",
        content: "ابحث عن عقارات للإيجار حسب الولاية (69 ولاية) والبلدية ونوع العقار.",
      },
      { property: "og:title", content: "البحث عن عقارات للإيجار" },
      {
        property: "og:description",
        content: "شقق، فيلات، محلات وأراضٍ للإيجار في كافة ولايات وبلديات الجزائر.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const searchParams = Route.useSearch();
  const [w, setW] = useState(searchParams.w ?? "");
  const [c, setC] = useState(searchParams.c ?? "");
  const [t, setT] = useState(searchParams.t ?? "");
  const [customCommune, setCustomCommune] = useState(false);
  const { data, isLoading: loading, isError } = useQuery(propertiesQuery);
  const list = data ?? [];
  const error = isError ? "تعذر تحميل العقارات من قاعدة البيانات. يرجى المحاولة لاحقًا." : "";

  const communes = getCommunesForWilaya(w);

  const filtered = list.filter(
    (p) => (!w || p.wilaya === w) && (!c || p.commune === c) && (!t || p.type === t),
  );

  return (
    <>
      <PageTitle
        title="العقارات المتاحة للإيجار"
        sub={loading ? "جارٍ تحميل العقارات..." : `${filtered.length} عقار متوفر عبر الوطن`}
      />

      <div className="mx-auto -mt-6 max-w-6xl px-4">
        <div className="grid gap-3 rounded-2xl bg-card p-4 shadow-card md:grid-cols-3">
          <Field label="الولاية (69 ولاية)">
            <select
              className={inputCls}
              value={w}
              onChange={(e) => {
                setW(e.target.value);
                setC("");
                setCustomCommune(false);
              }}
            >
              <option value="">كل الولايات (01 إلى 69)</option>
              {wilayasList.map((x) => (
                <option key={x.code} value={x.nameAr}>
                  {x.code} - {x.nameAr}
                </option>
              ))}
            </select>
          </Field>

          <Field label="البلدية">
            {customCommune ? (
              <div>
                <input
                  type="text"
                  list="search-communes-datalist"
                  className={inputCls}
                  placeholder="اكتب اسم البلدية مباشرة..."
                  value={c}
                  onChange={(e) => setC(e.target.value)}
                />
                <datalist id="search-communes-datalist">
                  {communes.map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={() => setCustomCommune(false)}
                  className="mt-1 text-xs text-primary underline"
                >
                  العودة للقائمة المنسدلة
                </button>
              </div>
            ) : (
              <div>
                <select
                  className={inputCls}
                  value={c}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setCustomCommune(true);
                      setC("");
                    } else {
                      setC(e.target.value);
                    }
                  }}
                  disabled={!w}
                >
                  <option value="">كل البلديات</option>
                  {communes.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                  {w && <option value="__custom__">-- كتابة بلدية أخرى يدوياً --</option>}
                </select>
                {w && (
                  <button
                    type="button"
                    onClick={() => setCustomCommune(true)}
                    className="mt-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    بلدية غير مذكورة؟ اكتبها يدوياً
                  </button>
                )}
              </div>
            )}
          </Field>

          <Field label="نوع العقار">
            <select className={inputCls} value={t} onChange={(e) => setT(e.target.value)}>
              <option value="">كل الأنواع</option>
              {propertyTypes.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p role="alert" className="py-8 text-center text-destructive">
            {error}
          </p>
        )}

        {loading && (
          <p className="py-12 text-center text-muted-foreground">جارٍ تحميل العقارات...</p>
        )}

        {!loading && !error && (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>

            {!filtered.length && (
              <p className="py-16 text-center text-muted-foreground">
                لا توجد عقارات متاحة تطابق معايير البحث حاليًا.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
