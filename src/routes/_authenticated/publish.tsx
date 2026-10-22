import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, CheckCircle2, Phone } from "lucide-react";
import { PageTitle, Field, inputCls, btnGold, WilayaCommune, TypeSelect } from "@/components/site";

export const Route = createFileRoute("/_authenticated/publish")({
  head: () => ({
    meta: [
      { title: "انشر عقارك للإيجار | منزلي وأرضي" },
      { name: "description", content: "انشر عقارك للإيجار مجانًا في جميع ولايات الجزائر." },
      { property: "og:title", content: "انشر عقارك للإيجار" },
      { property: "og:description", content: "النشر مجاني ورقم هاتفك محمي على منزلي وأرضي." },
    ],
  }),
  component: Publish,
});

function Publish() {
  const [w, setW] = useState("");
  const [c, setC] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <PageTitle
        title="انشر عقارك للإيجار"
        sub="النشر مجاني، ورقم هاتفك يبقى مخفيًا ومشفرًا حتى إتمام الصفقة وموافقة الإدارة."
      />
      {submitted ? (
        <div className="mx-auto -mt-6 max-w-xl rounded-2xl bg-card p-8 text-center shadow-card">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold">تم إرسال إعلانك للمراجعة بنجاح!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            تم تسجيل عقارك مع رقم هاتفك (
            <span dir="ltr" className="font-mono font-bold text-primary">
              {phone}
            </span>
            ) بنجاح. سيقوم المشرف بمراجعته ونشره، ورقمك سيبقى محميًا ومخفيًا عن العامة.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            نشر عقار آخر
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="mx-auto -mt-6 grid max-w-3xl gap-4 rounded-2xl bg-card p-6 shadow-card md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <Field label="عنوان الإعلان">
              <input required className={inputCls} placeholder="مثال: شقة F3 مجهزة للكراء" />
            </Field>
          </div>
          <TypeSelect />
          <Field label="السعر الشهري (د.ج)">
            <input type="number" required className={inputCls} placeholder="مثال: 35000" />
          </Field>

          {/* خانة رقم هاتف صاحب العقار مع التوضيح الأمني */}
          <div className="md:col-span-2">
            <Field label="رقم هاتف صاحب العقار (يبقى مخفيًا ومشفرًا)">
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${inputCls} font-mono`}
                  placeholder="05 / 06 / 07 XX XX XX XX"
                />
              </div>
              <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Lock size={14} className="mt-0.5 shrink-0 text-gold" />
                <span>
                  <b>أمان تام:</b> رقم هاتفك لن يظهر للعامة على الموقع. يتم تشفيره ويُكشف فقط
                  للمستأجر الجاد بعد إتمام الصفقة رسميًا ودفع الرسوم وموافقة الإدارة.
                </span>
              </div>
            </Field>
          </div>

          <WilayaCommune wilaya={w} setWilaya={setW} commune={c} setCommune={setC} />
          <Field label="عدد الغرف">
            <input type="number" min={1} className={inputCls} placeholder="مثال: 3" />
          </Field>
          <Field label="المساحة (م²)">
            <input type="number" min={1} className={inputCls} placeholder="مثال: 85" />
          </Field>
          <div className="md:col-span-2">
            <Field label="الوصف والمواصفات">
              <textarea
                rows={4}
                className={inputCls}
                placeholder="صف تفاصيل العقار: التجهيزات، الطابق، توفر الغاز والماء والمصعد، شروط الإيجار..."
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="الصور">
              <input type="file" multiple accept="image/*" className={inputCls} />
            </Field>
          </div>
          <button type="submit" className={`${btnGold} md:col-span-2`}>
            إرسال للمراجعة والنشر
          </button>
        </form>
      )}
    </>
  );
}
