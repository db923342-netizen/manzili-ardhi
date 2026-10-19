import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { properties as demoProperties, propertyTypes, wilayas, type Property } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, PropertyCard, Field, inputCls } from "@/components/site";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "البحث عن عقارات للإيجار | منزلي وأرضي" },
      { name: "description", content: "ابحث عن عقارات للإيجار حسب الولاية والبلدية ونوع العقار." },
      { property: "og:title", content: "البحث عن عقارات للإيجار" },
      { property: "og:description", content: "شقق، فيلات، محلات وأراضٍ للإيجار في الجزائر." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [w, setW] = useState("");
  const [c, setC] = useState("");
  const [t, setT] = useState("");
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("public_properties")
        .select("*");

      if (!active) return;

      if (queryError) {
        console.error("Supabase properties error:", queryError.message);
        setError("تعذر تحميل العقارات من قاعدة البيانات. يرجى المحاولة لاحقًا.");
        setList([]);
        setLoading(false);
        return;
      }

      const mapped: Property[] = (data ?? []).map((row) => {
        const item = row as Record<string, unknown>;

        return {
          id: String(item.id ?? ""),
          title: String(item.title ?? item.property_type ?? "عقار للإيجار"),
          type: String(item.property_type ?? ""),
          wilaya: String(item.wilaya ?? ""),
          commune: String(item.municipality ?? ""),
          price: Number(item.monthly_rent ?? 0),
          rooms: Number(item.rooms ?? 0),
          area: Number(item.area_m2 ?? 0),
          description: String(item.description ?? ""),
          owner: "",
          status: String(item.status ?? ""),
          image: demoProperties[0]?.image ?? "",
        };
      });

      setList(mapped);
      setLoading(false);
    }

    loadProperties();

    return () => {
      active = false;
    };
  }, []);

  const filtered = list.filter(
    (p) =>
      (!w || p.wilaya === w) &&
      (!c || p.commune === c) &&
      (!t || p.type === t),
  );

  return (
    <>
      <PageTitle
        title="العقارات المتاحة للإيجار"
        sub={loading ? "جارٍ تحميل العقارات..." : `${filtered.length} عقار`}
      />

      <div className="mx-auto -mt-6 max-w-6xl px-4">
        <div className="grid gap-3 rounded-2xl bg-card p-4 shadow-card md:grid-cols-3">
          <Field label="الولاية">
            <select
              className={inputCls}
              value={w}
              onChange={(e) => {
                setW(e.target.value);
                setC("");
              }}
            >
              <option value="">كل الولايات</option>
              {Object.keys(wilayas).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>

          <Field label="البلدية">
            <select
              className={inputCls}
              value={c}
              onChange={(e) => setC(e.target.value)}
              disabled={!w}
            >
              <option value="">كل البلديات</option>
              {(wilayas[w] ?? []).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>

          <Field label="نوع العقار">
            <select
              className={inputCls}
              value={t}
              onChange={(e) => setT(e.target.value)}
            >
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
          <p className="py-12 text-center text-muted-foreground">
            جارٍ تحميل العقارات...
          </p>
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
