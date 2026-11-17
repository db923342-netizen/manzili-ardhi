import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, CheckCircle2, Loader2, AlertTriangle, Building2, Tag } from "lucide-react";
import { PageTitle, Field, inputCls, btnGold, WilayaCommune, TypeSelect } from "@/components/site";
import { executeCreateRequest } from "@/lib/listings";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/request-new")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    purpose?: "كراء" | "شراء";
  } => ({
    purpose: s["purpose"] === "شراء" ? "شراء" : "كراء",
  }),
  head: () => ({
    meta: [
      { title: "انشر طلب بحث عن عقار (كراء أو شراء) | منزلي وأرضي" },
      {
        name: "description",
        content: "صف العقار الذي تبحث عنه للكراء أو الشراء ودع الملاك يتواصلون معك.",
      },
      { property: "og:title", content: "انشر طلب بحث عن عقار" },
      { property: "og:description", content: "دع الملاك يجدونك برقم هاتف محمي." },
    ],
  }),
  component: NewRequest,
});

function NewRequest() {
  const queryClient = useQueryClient();
  const searchParams = Route.useSearch();
  const [purpose, setPurpose] = useState<"كراء" | "شراء">(searchParams.purpose || "كراء");
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("شقة");
  const [budget, setBudget] = useState("");
  const [w, setW] = useState("");
  const [c, setC] = useState("");
  const [phone, setPhone] = useState("");
  const [rooms, setRooms] = useState("3");
  const [duration, setDuration] = useState("سنة (12 شهر)");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!w || !c) {
      toast.error("يرجى تحديد الولاية والبلدية أولاً.");
      return;
    }
    if (!phone || phone.trim().length < 9) {
      toast.error("يرجى إدخال رقم هاتف جزائري صحيح.");
      return;
    }

    setIsSubmitting(true);
    const res = await executeCreateRequest(
      {
        title:
          title.trim() ||
          (purpose === "شراء"
            ? `مطلوب شراء ${propertyType} في ${w}`
            : `مطلوب ${propertyType} للكراء في ${w}`),
        propertyType,
        wilaya: w,
        commune: c,
        budget: Number(budget) || (purpose === "شراء" ? 15000000 : 30000),
        rooms: Number(rooms) || 3,
        duration: purpose === "شراء" ? "شراء نهائي كاش / بنكي" : duration,
        details:
          details.trim() ||
          (purpose === "شراء"
            ? "مطلوب عقار بوثائق قانونية سليمة (عقد توثيقي ودفتر عقاري)."
            : "مطلوب سكن مريح ومناسب."),
        phone: phone.trim(),
        purpose,
      },
      queryClient,
    );

    setIsSubmitting(false);
    toast.success(
      purpose === "شراء"
        ? "تم نشر طلب الشراء بنجاح وأصبح متاحاً فوراً في ركن البيع والشراء!"
        : "تم نشر طلب الكراء بنجاح وأصبح متاحاً فوراً في ركن الكراء الدائم!",
    );
    setSubmitted(true);
  }

  return (
    <>
      <PageTitle
        title={purpose === "شراء" ? "انشر طلب شراء عقار" : "انشر طلب بحث عن عقار للإيجار"}
        sub="صف ما تبحث عنه وسيقترح عليك الملاك عقاراتهم. رقم هاتفك محمي ولا يظهر إلا للطرف المعني بعد موافقة الإدارة."
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
            ). أصبح طلبك متاحاً وظاهراً فوراً لجميع الملاك والمستخدمين، ورقمك سيبقى محميًا ومخفيًا
            حتى الاتفاق المتبادل وموافقة الإدارة.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {purpose === "شراء" ? (
              <Link
                to="/sales"
                search={{ section: "requests" }}
                className="rounded-lg bg-amber-500 hover:bg-amber-600 px-6 py-2.5 text-sm font-bold text-slate-950 shadow transition"
              >
                مشاهدة طلبك في ركن البيع والشراء ←
              </Link>
            ) : (
              <Link
                to="/search"
                search={{ section: "requests" }}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow hover:opacity-90 transition"
              >
                مشاهدة طلبك في ركن الكراء الدائم ←
              </Link>
            )}
            <button
              onClick={() => {
                setSubmitted(false);
                setTitle("");
                setBudget("");
                setDetails("");
              }}
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground hover:bg-secondary transition"
            >
              نشر طلب آخر
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto -mt-6 grid max-w-3xl gap-4 rounded-2xl bg-card p-6 shadow-card md:grid-cols-2"
        >
          {/* Choice between Rental Request and Purchase Request */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-bold text-foreground">نوع طلب البحث:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPurpose("كراء")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3.5 text-xs font-bold transition cursor-pointer ${
                  purpose === "كراء"
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
                }`}
              >
                <Building2 size={16} />
                <span>طلب كراء دائم (إيجار)</span>
              </button>

              <button
                type="button"
                onClick={() => setPurpose("شراء")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3.5 text-xs font-bold transition cursor-pointer ${
                  purpose === "شراء"
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-blue-500/30 bg-blue-600/10 text-blue-900 dark:text-blue-200 hover:bg-blue-600/20"
                }`}
              >
                <Tag size={16} />
                <span>طلب شراء نهائي (تمليك)</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <Field label="عنوان الطلب">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
                placeholder={
                  purpose === "شراء"
                    ? "مثال: أبحث عن شقة F3 أو F4 للشراء كاش في الجزائر العاصمة"
                    : "مثال: أبحث عن شقة F3 للكراء للعائلة"
                }
              />
            </Field>
          </div>

          <TypeSelect value={propertyType} onChange={(e) => setPropertyType(e.target.value)} />

          <Field
            label={
              purpose === "شراء"
                ? "الميزانية المتاحة للشراء (د.ج)"
                : "الميزانية المقترحة للكراء (د.ج)"
            }
          >
            <input
              type="number"
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={inputCls}
              placeholder={purpose === "شراء" ? "مثال: 15000000" : "مثال: 30000"}
            />
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle
                size={15}
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              />
              <span>
                <b>تنبيه إجباري:</b> يُشترط إجبارياً وضع السعر الحقيقي والفعلي للمعاملة، وإلا سيتم
                حذف الطلب مباشرة من طرف المدير.
              </span>
            </div>
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

          <WilayaCommune
            wilaya={w}
            setWilaya={setW}
            commune={c}
            setCommune={setC}
            required={true}
          />
          <Field label="عدد الغرف">
            <input
              type="number"
              min={1}
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              className={inputCls}
              placeholder="مثال: 3"
            />
          </Field>
          <Field label={purpose === "شراء" ? "طريقة الدفع المقترحة" : "مدة الإيجار"}>
            {purpose === "شراء" ? (
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputCls}
              >
                <option value="شراء كاش فوري (دفع نقدي)">شراء كاش فوري (دفع نقدي)</option>
                <option value="دفع عبر شيك بنكي موثق">دفع عبر شيك بنكي موثق</option>
                <option value="تمويل وقرض بنكي حلال (مرابحة)">تمويل وقرض بنكي حلال (مرابحة)</option>
                <option value="دفعات / تسبيق + أقساط">دفعات / تسبيق + أقساط</option>
              </select>
            ) : (
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputCls}
              >
                <option value="سنة (12 شهر)">سنة (12 شهر)</option>
                <option value="6 أشهر">6 أشهر</option>
                <option value="أكثر من سنة">أكثر من سنة</option>
                <option value="أقل من 6 أشهر">أقل من 6 أشهر</option>
              </select>
            )}
          </Field>
          <div className="md:col-span-2">
            <Field label="تفاصيل ومواصفات إضافية">
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className={inputCls}
                placeholder="صف العقار المطلوب: التجهيزات المرغوبة، الطابق المفضل، الحي السكني، القرب من المواصلات..."
              />
            </Field>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${btnGold} md:col-span-2 flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جارٍ النشر...</span>
              </>
            ) : (
              "نشر الطلب مجاناً"
            )}
          </button>
        </form>
      )}
    </>
  );
}
