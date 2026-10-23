import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Building2, Sparkles, Lock, CheckCircle2, Phone, Check } from "lucide-react";
import { PageTitle, Field, inputCls, btnGold, WilayaCommune, TypeSelect } from "@/components/site";

export const Route = createFileRoute("/_authenticated/publish")({
  head: () => ({
    meta: [
      { title: "انشر عقارك للإيجار أو كراء مؤقت | منزلي وأرضي" },
      {
        name: "description",
        content: "انشر عقارك للإيجار الشهري أو الكراء المؤقت باليوم في جميع ولايات الجزائر.",
      },
      { property: "og:title", content: "انشر عقارك للإيجار أو كراء شقق مؤقتة" },
      { property: "og:description", content: "النشر مجاني ورقم هاتفك محمي على منزلي وأرضي." },
    ],
  }),
  component: Publish,
});

function Publish() {
  const [rentalMode, setRentalMode] = useState<"standard" | "temporary">("standard");
  const [w, setW] = useState("");
  const [c, setC] = useState("");
  const [phone, setPhone] = useState("");
  const [minStay, setMinStay] = useState("1");
  const [maxGuests, setMaxGuests] = useState("4");
  const [amenities, setAmenities] = useState<string[]>(["تكييف", "واي فاي", "مفروشة بالكامل"]);
  const [submitted, setSubmitted] = useState(false);

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  return (
    <>
      <PageTitle
        title={
          rentalMode === "temporary"
            ? "انشر شقة للكراء المؤقت (24 ساعة / باليوم)"
            : "انشر عقارك للإيجار الدائم"
        }
        sub="النشر مجاني، ورقم هاتفك يبقى مخفيًا ومشفرًا حتى إتمام الصفقة وموافقة الإدارة."
      />
      {submitted ? (
        <div className="mx-auto -mt-6 max-w-xl rounded-2xl bg-card p-8 text-center shadow-card">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold">تم إرسال إعلانك للمراجعة بنجاح!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {rentalMode === "temporary"
              ? "تم تسجيل شقتك في قسم الكراء المؤقت بنجاح. سيقوم المشرف بالتحقق منها ونشرها فوراً للزوار والباحثين عن إقامة 24 ساعة أو أكثر."
              : "تم تسجيل عقارك بنجاح. سيقوم المشرف بمراجعته ونشره، ورقمك سيبقى محميًا ومخفيًا عن العامة."}
            <br />
            رقم هاتفك المسجل: (
            <span dir="ltr" className="font-mono font-bold text-primary">
              {phone}
            </span>
            ).
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            نشر إعلان آخر
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
          {/* Choice of Rental Category */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-bold text-foreground">نوع نظام الكراء:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRentalMode("standard")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-bold transition cursor-pointer ${
                  rentalMode === "standard"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Building2 size={16} />
                <span>إيجار دائم (شهري / سنوي)</span>
              </button>

              <button
                type="button"
                onClick={() => setRentalMode("temporary")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-bold transition cursor-pointer ${
                  rentalMode === "temporary"
                    ? "border-gold bg-gold/10 text-gold shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Clock size={16} className="text-gold" />
                <span>كراء شقق مؤقتة (باليوم / 24 ساعة)</span>
                <span className="rounded-full bg-gold/20 px-1.5 py-0.2 text-[10px] text-gold font-black">
                  مطلوب
                </span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <Field label="عنوان الإعلان">
              <input
                required
                className={inputCls}
                placeholder={
                  rentalMode === "temporary"
                    ? "مثال: شقة F3 فاخرة ومفروشة للكراء المؤقت 24 ساعة مطلة على البحر"
                    : "مثال: شقة F3 مجهزة للكراء"
                }
              />
            </Field>
          </div>

          <TypeSelect />

          {rentalMode === "temporary" ? (
            <>
              <Field label="السعر بالليلة الواحدة (د.ج)">
                <input
                  type="number"
                  required
                  min={1000}
                  className={inputCls}
                  placeholder="مثال: 6000 د.ج / 24 سا"
                />
              </Field>

              <Field label="أدنى مدة حجز (أيام)">
                <select
                  value={minStay}
                  onChange={(e) => setMinStay(e.target.value)}
                  className={inputCls}
                >
                  <option value="1">1 يوم (متاح 24 ساعة فوري)</option>
                  <option value="2">يومان على الأقل</option>
                  <option value="3">3 أيام فما فوق</option>
                  <option value="7">أسبوع كامل</option>
                </select>
              </Field>

              <Field label="الحد الأقصى لعدد الضيوف">
                <input
                  type="number"
                  min={1}
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(e.target.value)}
                  className={inputCls}
                  placeholder="مثال: 4"
                />
              </Field>
            </>
          ) : (
            <Field label="السعر الشهري (د.ج)">
              <input type="number" required className={inputCls} placeholder="مثال: 35000" />
            </Field>
          )}

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
                  <b>أمان تام:</b> رقم هاتفك محمي ومخفي تماماً عن سائر المستخدمين على الموقع، ويظهر
                  فقط لإدارة المنصة (الأدمن) للمراجعة وللمستأجر الجاد بعد اعتماد الصفقة رسميًا
                  وموافقة الإدارة.
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
          {/* Amenities & Rules for Temporary Rental */}
          {rentalMode === "temporary" && (
            <div className="md:col-span-2 rounded-xl border border-gold/30 bg-gold/5 p-4">
              <label className="block text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-gold" />
                <span>التجهيزات والمرافق المتوفرة بالشقة المؤقتة:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  "مفروشة بالكامل",
                  "تكييف",
                  "واي فاي سريع",
                  "مطبخ مجهز",
                  "موقف سيارات",
                  "إطلالة على البحر",
                  "مصعد بالعمارة",
                  "تلفاز 4K ذكي",
                  "غسالة ملابس",
                  "تدفئة مركزية",
                  "مسبح",
                  "مياه 24/24",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`flex items-center gap-1.5 rounded-lg border p-2 text-xs font-medium text-right transition cursor-pointer ${
                      amenities.includes(item)
                        ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Check
                      size={13}
                      className={amenities.includes(item) ? "opacity-100" : "opacity-0"}
                    />
                    <span>{item}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-muted-foreground">
                * الشقق المؤقتة تشترط التزام الضيوف بالقوانين والأنظمة (الدفتر العائلي للعائلات،
                احترام الجيران، وعدم إقامة الحفلات).
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <Field label="الوصف والمواصفات">
              <textarea
                rows={4}
                className={inputCls}
                placeholder={
                  rentalMode === "temporary"
                    ? "صف تفاصيل الشقة المؤقتة: الأثاث، القرب من الشواطئ أو المراكز، ساعات الدخول والخروج، وأي شروط خاصة..."
                    : "صف تفاصيل العقار: التجهيزات، الطابق، توفر الغاز والماء والمصعد، شروط الإيجار..."
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="الصور">
              <input type="file" multiple accept="image/*" className={inputCls} />
            </Field>
          </div>
          <button type="submit" className={`${btnGold} md:col-span-2`}>
            {rentalMode === "temporary"
              ? "إرسال الشقة المؤقتة للمراجعة والنشر"
              : "إرسال للمراجعة والنشر"}
          </button>
        </form>
      )}
    </>
  );
}
