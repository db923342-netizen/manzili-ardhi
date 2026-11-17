import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";

const WELCOME_STORAGE_KEY = "manzili_welcome_seen_v1";

const PLATFORM_HIGHLIGHTS: Array<{ title: string; body: string }> = [
  {
    title: "رؤية المنصة ورسالتها",
    body: "فضاء عقاري جزائري متكامل يجمع الباحثين عن السكن والاستثمار مع أصحاب العقارات في بيئة يسودها الوضوح والأمان والمصداقية.",
  },
  {
    title: "تغطية شاملة لـ 69 ولاية",
    body: "محرك بحث دقيق ومنظم يشمل جميع ولايات الجزائر الـ 69 وبلدياتها لتحديد موقعك المطلوب والوصول إلى الخيار الأنسب في لحظات.",
  },
  {
    title: "ركن الكراء الدائم (الشهري والسنوي)",
    body: "عرض مرتب لمختلف الأنماط العقارية من شقق، فيلات، منازل، أراضي، محلات تجارية ومكاتب مع إمكانية التصفية حسب النوع والميزانية.",
  },
  {
    title: "ركن الكراء المؤقت (24 ساعة فما فوق)",
    body: "خيارات إقامة مفروشة ومجهزة للعائلات والمسافرين والمهنيين، مصحوبة بتفاصيل الراحة والمرافق المتاحة وسهولة التنسيق.",
  },
  {
    title: "ركن البيع والشراء النهائي",
    body: "سوق متخصص لعمليات التمليك العقاري مع إبراز الوضعية القانونية للعقار كالعقد التوثيقي والدفتر العقاري لطمأنينة تامة.",
  },
  {
    title: "قسم طلبات الكراء والشراء",
    body: "انشر مواصفات العقار الذي تطمح إليه في ثوانٍ، ليتيسر على الملاك وأصحاب العروض المناسبة التواصل معك وفق احتياجك.",
  },
  {
    title: "خصوصية محمية وتجربة مريحة",
    body: "تحفظ المنصة سرية معلومات التواصل وتنظم تفاعل الأطراف بعيداً عن الإزعاج، مع تصميم سلس متجاوب مع مختلف الهواتف والحواسيب.",
  },
  {
    title: "توجيه سريع للبداية",
    body: "اختر الركن المناسب لاحتياجك من الصفحة الرئيسية، حدد الولاية والبلدية، وسجّل دخولك متى رغبت في نشر عرضك أو طلبك ومتابعته.",
  },
];

let memoryDismissed = false;

function readSeenFlag(): boolean {
  if (memoryDismissed) return true;
  try {
    return window.localStorage.getItem(WELCOME_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSeenFlag(): void {
  memoryDismissed = true;
  try {
    window.localStorage.setItem(WELCOME_STORAGE_KEY, "1");
  } catch {
    // Ignore storage errors in restricted webviews/private browsing
  }
}

export function openWelcomeModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("manzili:open-welcome"));
  }
}

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!readSeenFlag()) {
      setOpen(true);
    }

    const handleManualOpen = () => setOpen(true);
    window.addEventListener("manzili:open-welcome", handleManualOpen);
    return () => {
      window.removeEventListener("manzili:open-welcome", handleManualOpen);
    };
  }, []);

  const handleClose = useCallback(() => {
    writeSeenFlag();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-basmala-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gold/40 bg-card text-card-foreground shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Decorative Header Featuring Prominent Calligraphic Basmala */}
        <div className="relative shrink-0 overflow-hidden bg-deep px-5 pb-6 pt-7 text-center text-deep-foreground border-b border-gold/30">
          {/* Subtle Arabesque Geometric Lattice Background */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full text-gold/12"
            viewBox="0 0 400 180"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern id="arabesque-star" width="48" height="48" patternUnits="userSpaceOnUse">
                <path
                  d="M24 2 L29 19 L46 24 L29 29 L24 46 L19 29 L2 24 L19 19 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.7"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="400" height="180" fill="url(#arabesque-star)" />
          </svg>

          {/* Ornamental Outer & Inner Arch Frame */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-2 rounded-xl border border-gold/30"
          />
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-4 h-7 w-7 text-gold/75"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path d="M30 2H14C7.373 2 2 7.373 2 14V30" stroke="currentColor" strokeWidth="1.5" />
            <path d="M24 6H14C9.582 6 6 9.582 6 14V24" stroke="currentColor" strokeWidth="0.9" />
          </svg>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-4 h-7 w-7 -scale-x-100 text-gold/75"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path d="M30 2H14C7.373 2 2 7.373 2 14V30" stroke="currentColor" strokeWidth="1.5" />
            <path d="M24 6H14C9.582 6 6 9.582 6 14V24" stroke="currentColor" strokeWidth="0.9" />
          </svg>

          <button
            type="button"
            onClick={handleClose}
            aria-label="إغلاق النافذة الترحيبية"
            className="absolute left-3.5 top-3.5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-lg text-deep-foreground/75 transition hover:bg-white/10 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="relative mx-auto max-w-md pt-2">
            {/* Large Ornamental Basmala */}
            <div className="inline-flex flex-col items-center">
              <div className="mb-2 flex items-center gap-3 text-gold/80">
                <span className="h-px w-10 bg-gradient-to-l from-gold to-transparent" />
                <span aria-hidden="true" className="text-sm leading-none">
                  ۞
                </span>
                <span className="h-px w-10 bg-gradient-to-r from-gold to-transparent" />
              </div>

              <h2
                id="welcome-basmala-title"
                className="font-calligraphy text-3xl sm:text-4xl font-bold leading-snug text-gold drop-shadow-xs"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </h2>

              {/* Calligraphic Arabesque Flourish Under Basmala */}
              <svg
                aria-hidden="true"
                className="mt-2.5 h-4 w-56 text-gold/80"
                viewBox="0 0 240 20"
                fill="none"
              >
                <path
                  d="M8 10 H96 C106 10 112 3 120 3 C128 3 134 10 144 10 H232"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M28 10 H96 C106 10 112 17 120 17 C128 17 134 10 144 10 H212"
                  stroke="currentColor"
                  strokeWidth="0.9"
                />
                <circle cx="120" cy="10" r="2.5" fill="currentColor" />
              </svg>
            </div>

            <p className="mt-2 text-xs font-medium tracking-normal text-deep-foreground/85">
              مرحباً بكم في منصة <span className="font-bold text-gold">منزلي وأرضي</span> للعقارات
              في الجزائر
            </p>
          </div>
        </div>

        {/* Scrollable Body — Calm, Compact, Small Readable Typography */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-7 sm:py-5 space-y-4">
          <p className="font-calligraphy text-[13.5px] sm:text-sm leading-[1.9] text-foreground/95 pb-3 border-b border-border/70">
            الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين، سيدنا محمد وعلى آله
            وصحبه أجمعين. نقدم بين أيديكم هذا العمل، سائلين المولى عز وجل أن يوفقنا وإياكم لما فيه
            الخير والصلاح، وأن يجعل هذا العمل خالصاً لوجهه الكريم، نافعاً لكل من يطلع عليه...
          </p>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-primary">مواصفات المنصة وتوجيهاتها:</h3>
            <ul className="space-y-2 text-[12px] sm:text-[12.5px] leading-[1.75] text-muted-foreground">
              {PLATFORM_HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 shrink-0 text-[10px] leading-none text-gold"
                  >
                    ◆
                  </span>
                  <span>
                    <strong className="font-bold text-foreground">{item.title}: </strong>
                    {item.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Clean Single-CTA Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border bg-secondary/45 px-5 py-3.5 sm:px-7">
          <p className="text-[11px] text-muted-foreground">
            نسعد بخدمتكم ونتمنى لكم تجربة موفقة وميسّرة.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 whitespace-nowrap rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            ابدأ التصفح الآن
          </button>
        </div>
      </div>
    </div>
  );
}
