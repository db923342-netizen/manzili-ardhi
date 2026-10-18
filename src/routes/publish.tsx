import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle, Field, inputCls, btnGold, WilayaCommune, TypeSelect } from "@/components/site";

export const Route = createFileRoute("/publish")({
  head: () => ({
    meta: [
      { title: "انشر عقارك للإيجار | منزلي وأرضي" },
      { name: "description", content: "انشر عقارك للإيجار مجانًا في جميع ولايات الجزائر." },
      { property: "og:title", content: "انشر عقارك للإيجار" },
      { property: "og:description", content: "النشر مجاني على منزلي وأرضي." },
    ],
  }),
  component: Publish,
});

function Publish() {
  const [w, setW] = useState("");
  return (
    <>
      <PageTitle title="انشر عقارك للإيجار" sub="النشر مجاني، ورقمك يبقى مخفيًا حتى إتمام الصفقة." />
      <form onSubmit={(e) => e.preventDefault()} className="mx-auto -mt-6 grid max-w-3xl gap-4 rounded-2xl bg-card p-6 shadow-card md:grid-cols-2">
        <div className="md:col-span-2"><Field label="عنوان الإعلان"><input required className={inputCls} placeholder="مثال: شقة F3 مجهزة" /></Field></div>
        <TypeSelect />
        <Field label="السعر الشهري (د.ج)"><input type="number" className={inputCls} /></Field>
        <WilayaCommune wilaya={w} setWilaya={setW} />
        <Field label="عدد الغرف"><input type="number" className={inputCls} /></Field>
        <Field label="المساحة (م²)"><input type="number" className={inputCls} /></Field>
        <div className="md:col-span-2"><Field label="الوصف"><textarea rows={4} className={inputCls} /></Field></div>
        <div className="md:col-span-2"><Field label="الصور"><input type="file" multiple accept="image/*" className={inputCls} /></Field></div>
        <button className={`${btnGold} md:col-span-2`}>إرسال للمراجعة</button>
      </form>
    </>
  );
}
