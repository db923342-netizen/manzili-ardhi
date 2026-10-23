import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { PageTitle, Field, inputCls, btnGold, WilayaCommune, TypeSelect } from "@/components/site";

export const Route = createFileRoute("/_authenticated/request-new")({
  head: () => ({
    meta: [
      { title: "انشر طلب بحث عن عقار | منزلي وأرضي" },
      { name: "description", content: "صف العقار الذي تبحث عنه ودع الملاك يتواصلون معك." },
      { property: "og:title", content: "انشر طلب بحث عن عقار" },
      { property: "og:description", content: "دع الملاك يجدونك برقم هاتف محمي." },
    ],
  }),
  component: NewRequest,
});

function NewRequest() {
  const [w, setW] = useState("");
  const [c, setC] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <PageTitle
        title="انشر طلب بحث عن عقار للإيجار"
        sub="صف ما تبحث عنه وسيقترح عليك الملاك عقاراتهم. رقم هاتفك محمي ولا يظهر إلا للمالك المعني."
      />
      {submitted ? (
        <div className="mx-auto -mt-6 max-w-xl rounded-2xl bg-card p-8 text-center shadow-card">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold">تم نشر طلب البحث بنجاح!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            تم تسجيل طلبك برقم هاتفك (
            <span dir="ltr" className="font-mono font-bold text-primary">
              {phone}
            </span>
            ). سيتلقى طلبك عروض الملاك، ورقمك سيبقى محميًا ومخفيًا حتى الاتفاق المتبادل وموافقة
            الإدارة.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            نشر طلب آخر
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
            <Field label="عنوان الطلب">
              <input required className={inputCls} placeholder="مثال: أبحث عن شقة F3 للكراء" />
            </Field>
          </div>
          <TypeSelect />
          <Field label="الميزانية القصوى (د.ج / شهر)">
            <input type="number" required className={inputCls} placeholder="مثال: 30000" />
          </Field>

          {/* خانة رقم هاتف صاحب الطلب */}
          <div className="md:col-span-2">
            <Field label="رقم هاتف صاحب الطلب (يبقى مخفيًا لحمايتك)">
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
                  <b>خصوصية تامة:</b> رقم هاتفك محمي ومخفي تماماً عن سائر المستخدمين على الموقع،
                  ويظهر فقط لإدارة المنصة (الأدمن) للمتابعة وللمالك بعد اعتماد الصفقة وموافقة
                  الإدارة.
                </span>
              </div>
            </Field>
          </div>

          <WilayaCommune wilaya={w} setWilaya={setW} commune={c} setCommune={setC} />
          <Field label="عدد الغرف">
            <input type="number" min={1} className={inputCls} placeholder="مثال: 3" />
          </Field>
          <Field label="مدة الإيجار">
            <select className={inputCls}>
              <option>سنة (12 شهر)</option>
              <option>6 أشهر</option>
              <option>أكثر من سنة</option>
              <option>أقل من 6 أشهر</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="تفاصيل ومواصفات إضافية">
              <textarea
                rows={4}
                className={inputCls}
                placeholder="صف العقار المطلوب: التجهيزات المرغوبة، الطابق المفضل، الحي السكني، القرب من المواصلات..."
              />
            </Field>
          </div>
          <button type="submit" className={`${btnGold} md:col-span-2`}>
            نشر الطلب
          </button>
        </form>
      )}
    </>
  );
}
