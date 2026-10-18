import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { properties, propertyTypes, wilayas } from "@/lib/data";
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
  const list = properties.filter((p) => (!w || p.wilaya === w) && (!c || p.commune === c) && (!t || p.type === t));
  return (
    <>
      <PageTitle title="العقارات المتاحة للإيجار" sub={`${list.length} عقار`} />
      <div className="mx-auto -mt-6 max-w-6xl px-4">
        <div className="grid gap-3 rounded-2xl bg-card p-4 shadow-card md:grid-cols-3">
          <Field label="الولاية">
            <select className={inputCls} value={w} onChange={(e) => { setW(e.target.value); setC(""); }}>
              <option value="">كل الولايات</option>
              {Object.keys(wilayas).map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="البلدية">
            <select className={inputCls} value={c} onChange={(e) => setC(e.target.value)} disabled={!w}>
              <option value="">كل البلديات</option>
              {(wilayas[w] ?? []).map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="نوع العقار">
            <select className={inputCls} value={t} onChange={(e) => setT(e.target.value)}>
              <option value="">كل الأنواع</option>
              {propertyTypes.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
        {!list.length && <p className="py-16 text-center text-muted-foreground">لا توجد نتائج مطابقة.</p>}
      </div>
    </>
  );
}
