import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { fees, formatDA } from "@/lib/data";
import { PageTitle } from "@/components/site";

export const Route = createFileRoute("/fees")({
  head: () => ({
    meta: [
      { title: "الرسوم والأسعار | منزلي وأرضي" },
      {
        name: "description",
        content: "نظام رسوم واضح بالدينار الجزائري: النشر مجاني والرسوم فقط عند إتمام الصفقة.",
      },
      { property: "og:title", content: "الرسوم والأسعار" },
      { property: "og:description", content: "رسوم واضحة بالدينار الجزائري." },
    ],
  }),
  component: Fees,
});

const items = [
  {
    t: "نشر عقار أو طلب",
    v: fees.publish === 0 ? "مجاني" : formatDA(fees.publish),
    d: ["نشر غير محدود", "مراجعة من الإدارة", "رقمك مخفي"],
  },
  {
    t: "حجز كراء شقة مؤقتة",
    v: formatDA(fees.temporaryBookingFee || 500),
    d: ["تأكيد حجز فوري 24 ساعة", "ضمان تسليم المفاتيح", "متابعة أمنية مباشرة"],
    gold: true,
  },
  {
    t: "إتمام صفقة إيجار دائم",
    v: formatDA(fees.dealTenant),
    d: ["كشف رقم الطرف الآخر", "بعد موافقة المدير", "دفعة واحدة رمزية"],
  },
  {
    t: "إعلان مميز",
    v: formatDA(fees.featured),
    d: ["ظهور في أعلى النتائج", "مدة 15 يومًا", "شارة ذهبية"],
  },
];

function Fees() {
  return (
    <>
      <PageTitle
        title="نظام الرسوم"
        sub="شفافية تامة — لا رسوم خفية. جميع الأسعار بالدينار الجزائري."
      />
      <div className="mx-auto -mt-6 grid max-w-6xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div
            key={i.t}
            className={`rounded-2xl border bg-card p-6 shadow-card ${i.gold ? "border-gold" : "border-border"}`}
          >
            <h3 className="font-bold">{i.t}</h3>
            <p className="mt-3 font-display text-3xl font-extrabold text-primary">{i.v}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {i.d.map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <Check size={16} className="text-gold" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-3xl px-4">
        <h2 className="text-xl font-bold">كيف تتم الصفقة؟</h2>
        <ol className="mt-4 space-y-3">
          {[
            "يتفق الطرفان مبدئيًا عبر المنصة دون كشف الأرقام.",
            "يطلب أحد الطرفين إتمام الصفقة ويدفع الرسوم.",
            "يراجع المدير الصفقة ويوافق عليها.",
            "تُكشف أرقام الهواتف للطرفين.",
          ].map((s, n) => (
            <li key={s} className="flex gap-3 rounded-xl bg-secondary p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold font-bold text-deep">
                {n + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
