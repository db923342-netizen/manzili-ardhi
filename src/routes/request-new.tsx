import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle, Field, inputCls, btnGold, WilayaCommune, TypeSelect } from "@/components/site";

export const Route = createFileRoute("/request-new")({
  head: () => ({
    meta: [
      { title: "انشر طلب بحث عن عقار | منزلي وأرضي" },
      { name: "description", content: "صف العقار الذي تبحث عنه ودع الملاك يتواصلون معك." },
      { property: "og:title", content: "انشر طلب بحث عن عقار" },
      { property: "og:description", content: "دع الملاك يجدونك." },
    ],
  }),
  component: NewRequest,
});

function NewRequest() {
  const [w, setW] = useState("");
  return (
    <>
      <PageTitle title="انشر طلب بحث عن عقار للإيجار" sub="صف ما تبحث عنه وسيقترح عليك الملاك عقاراتهم." />
      <form onSubmit={(e) => e.preventDefault()} className="mx-auto -mt-6 grid max-w-3xl gap-4 rounded-2xl bg-card p-6 shadow-card md:grid-cols-2">
        <div className="md:col-span-2"><Field label="عنوان الطلب"><input required className={inputCls} placeholder="مثال: أبحث عن شقة F3" /></Field></div>
        <TypeSelect />
        <Field label="الميزانية القصوى (د.ج / شهر)"><input type="number" className={inputCls} /></Field>
        <WilayaCommune wilaya={w} setWilaya={setW} />
        <Field label="عدد الغرف"><input type="number" className={inputCls} /></Field>
        <Field label="مدة الإيجار"><select className={inputCls}><option>شهر</option><option>6 أشهر</option><option>سنة</option><option>أكثر من سنة</option></select></Field>
        <div className="md:col-span-2"><Field label="تفاصيل إضافية"><textarea rows={4} className={inputCls} /></Field></div>
        <button className={`${btnGold} md:col-span-2`}>نشر الطلب</button>
      </form>
    </>
  );
}
