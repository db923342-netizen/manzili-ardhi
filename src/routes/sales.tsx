import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Clock,
  Building2,
  FileText,
  PlusCircle,
  Home,
  Check,
  Search,
  Tag,
  ShieldCheck,
  BadgeCheck,
  X,
  Send,
  SlidersHorizontal,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  salesPropertiesQuery,
  salesRequestsQuery,
  lastSalePropertiesError,
  lastPurchaseRequestsError,
  executeCreateProperty,
  executeCreateRequest,
} from "@/lib/listings";
import {
  normalizeWilayaName,
  formatDA,
  formatPublishTime,
  type Property,
  type RentalRequest,
} from "@/lib/data";
import {
  PageTitle,
  PropertyCard,
  RequestCard,
  Field,
  inputCls,
  WilayaCommune,
  CustomSelect,
  type SelectOption,
  btnGold,
  btnPrimary,
} from "@/components/site";
import { maskPhoneNumbers } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/sales")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    section?: "offers" | "requests" | undefined;
    w?: string | undefined;
    c?: string | undefined;
    t?: string | undefined;
    legal?: string | undefined;
  } => ({
    section:
      s["section"] === "requests" ? "requests" : s["section"] === "offers" ? "offers" : undefined,
    w: typeof s["w"] === "string" ? s["w"] : undefined,
    c: typeof s["c"] === "string" ? s["c"] : undefined,
    t: typeof s["t"] === "string" ? s["t"] : undefined,
    legal: typeof s["legal"] === "string" ? s["legal"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ركن البيع والشراء النهائي | عقارات وأراضي للبيع في الجزائر" },
      {
        name: "description",
        content:
          "ركن البيع والشراء النهائي في الجزائر: شقق، أراضي صالحة للبناء، محلات تجارية وفيلات للبيع، وطلبات شراء مباشرة من المشترين مع التحقق من العقود والدفاتر العقارية.",
      },
      { property: "og:title", content: "ركن البيع والشراء النهائي - منزلي وأرضي" },
      {
        property: "og:description",
        content:
          "بيع وشراء العقارات والأراضي بعقود موثقة ودفاتر عقارية مع طلبات شراء حقيقية عبر 69 ولاية.",
      },
    ],
  }),
  component: SalesPage,
});

const legalStatusOptions = [
  { key: "", label: "كافة الوضعيات القانونية" },
  { key: "عقد توثيقي + دفتر عقاري", label: "📜 عقد توثيقي + دفتر عقاري" },
  { key: "عقد مشهر", label: "🏛️ عقد ملكية مشهر" },
  { key: "عقد توثيقي", label: "✍️ عقد توثيقي" },
  { key: "دفتر عقاري", label: "📘 دفتر عقاري" },
  { key: "قرار استفادة + تنازل", label: "📄 قرار استفادة وتنازل" },
  { key: "عقد في الشيوع", label: "📑 عقد في الشيوع" },
];

const legalStatusFilterOptions: SelectOption[] = [
  { value: "", label: "كافة الوضعيات القانونية" },
  { value: "عقد توثيقي + دفتر عقاري", label: "📜 عقد توثيقي + دفتر عقاري فردي", badge: "سند فردي" },
  { value: "عقد مشهر", label: "🏛️ عقد ملكية مشهر", badge: "مشهر بالمحافظة" },
  { value: "عقد توثيقي", label: "✍️ عقد توثيقي فقط" },
  { value: "دفتر عقاري", label: "📘 دفتر عقاري مستقل" },
  { value: "قرار استفادة + تنازل", label: "📄 قرار استفادة وتنازل" },
  { value: "عقد في الشيوع", label: "📑 عقد ملكية في الشيوع" },
];

const saleLegalModalOptions: SelectOption[] = [
  {
    value: "عقد توثيقي + دفتر عقاري",
    label: "📜 عقد توثيقي + دفتر عقاري فردي",
    badge: "الأكثر طلباً",
  },
  { value: "عقد مشهر", label: "🏛️ عقد ملكية مشهر" },
  { value: "عقد توثيقي", label: "✍️ عقد توثيقي فقط" },
  { value: "دفتر عقاري", label: "📘 دفتر عقاري" },
  { value: "قرار استفادة + تنازل", label: "📄 قرار استفادة وتنازل" },
  { value: "عقد في الشيوع", label: "📑 عقد ملكية في الشيوع" },
];

const buyLegalModalOptions: SelectOption[] = [
  { value: "عقد توثيقي + دفتر عقاري", label: "📜 عقد توثيقي + دفتر عقاري فردي (شرط أساسي)" },
  { value: "عقد مشهر", label: "🏛️ عقد ملكية مشهر" },
  { value: "عقد توثيقي", label: "✍️ عقد توثيقي" },
  { value: "دفتر عقاري", label: "📘 دفتر عقاري" },
  { value: "قرار استفادة وتنازل", label: "📄 قرار استفادة وتنازل" },
  { value: "عقد في الشيوع", label: "📑 عقد ملكية في الشيوع" },
  { value: "أي وثائق رسمية سليمة", label: "✅ أي وثائق قانونية ورسمية سليمة" },
];

const salePatternTabs = [
  { key: "", label: "كافة الأنماط" },
  { key: "شقة", label: "🏢 شقق للبيع" },
  { key: "أرض", label: "🏞️ أراضي للبيع" },
  { key: "محل تجاري", label: "🏬 محلات تجارية" },
  { key: "فيلا", label: "🏡 فيلات للبيع" },
  { key: "منزل", label: "🏠 منازل للبيع" },
];

const salePatternFilterOptions: SelectOption[] = [
  { value: "", label: "كافة الأنماط العقارية" },
  { value: "شقة", label: "🏢 شقق للبيع" },
  { value: "أرض", label: "🏞️ أراضي للبيع" },
  { value: "محل تجاري", label: "🏬 محلات تجارية" },
  { value: "فيلا", label: "🏡 فيلات للبيع" },
  { value: "منزل", label: "🏠 منازل للبيع" },
];

const salePropertyTypeOptions: SelectOption[] = [
  { value: "شقة", label: "🏢 شقة" },
  { value: "أرض", label: "🏞️ قطعة أرض" },
  { value: "محل تجاري", label: "🏬 محل تجاري" },
  { value: "فيلا", label: "🏡 فيلا" },
  { value: "منزل", label: "🏠 منزل" },
  { value: "مستودع", label: "🏭 مستودع / هنغار" },
];

function SalesPage() {
  const queryClient = useQueryClient();
  const searchParams = Route.useSearch();
  const [activeSection, setActiveSection] = useState<"offers" | "requests">(
    searchParams.section ?? "offers",
  );
  const [w, setW] = useState(searchParams.w ?? "");
  const [c, setC] = useState(searchParams.c ?? "");
  const [t, setT] = useState(searchParams.t ?? "");
  const [legal, setLegal] = useState(searchParams.legal ?? "");

  // Modals
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showNewBuyModal, setShowNewBuyModal] = useState(false);

  // New Sale Form States
  const [saleTitle, setSaleTitle] = useState("");
  const [saleType, setSaleType] = useState("شقة");
  const [saleWilaya, setSaleWilaya] = useState("");
  const [saleCommune, setSaleCommune] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleArea, setSaleArea] = useState("");
  const [saleRooms, setSaleRooms] = useState("3");
  const [saleLegal, setSaleLegal] = useState("عقد توثيقي + دفتر عقاري");
  const [salePhone, setSalePhone] = useState("");
  const [saleDesc, setSaleDesc] = useState("");
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // New Buy Request Form States
  const [buyTitle, setBuyTitle] = useState("");
  const [buyType, setBuyType] = useState("شقة");
  const [buyWilaya, setBuyWilaya] = useState("");
  const [buyCommune, setBuyCommune] = useState("");
  const [buyBudget, setBuyBudget] = useState("");
  const [buyRooms, setBuyRooms] = useState("3");
  const [buyLegal, setBuyLegal] = useState("عقد توثيقي + دفتر عقاري");
  const [buyPhone, setBuyPhone] = useState("");
  const [buyDetails, setBuyDetails] = useState("");
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);

  const { data: salesData, isLoading: loadingSales } = useQuery(salesPropertiesQuery);
  const { data: requestsData, isLoading: loadingRequests } = useQuery(salesRequestsQuery);

  const salesList = salesData ?? [];
  const requestsList = requestsData ?? [];

  const normSearchW = normalizeWilayaName(w);

  // Filter sales
  const filteredSales = salesList.filter((p) => {
    if (w) {
      const pNorm = normalizeWilayaName(p.wilaya);
      if (pNorm !== normSearchW && p.wilaya !== w) return false;
    }
    if (c) {
      const pCommune = (p.commune ?? "").toLowerCase().trim();
      const searchCommune = c.toLowerCase().trim();
      if (!pCommune.includes(searchCommune) && pCommune !== searchCommune) return false;
    }
    if (t) {
      if (t === "محل تجاري") {
        if (!p.type.includes("محل")) return false;
      } else if (!p.type.includes(t)) {
        return false;
      }
    }
    if (legal) {
      const pLegal = (p.legalStatus ?? "").toLowerCase();
      if (!pLegal.includes(legal.toLowerCase())) return false;
    }
    return true;
  });

  // Filter buy requests
  const filteredRequests = requestsList.filter((r) => {
    if (w) {
      const rNorm = normalizeWilayaName(r.wilaya);
      if (rNorm !== normSearchW && r.wilaya !== w) return false;
    }
    if (c) {
      const rCommune = (r.commune ?? "").toLowerCase().trim();
      const searchCommune = c.toLowerCase().trim();
      if (!rCommune.includes(searchCommune) && rCommune !== searchCommune) return false;
    }
    if (t) {
      if (t === "محل تجاري") {
        if (!r.type.includes("محل")) return false;
      } else if (!r.type.includes(t)) {
        return false;
      }
    }
    if (legal) {
      const details = (r.details ?? "").toLowerCase();
      const title = (r.title ?? "").toLowerCase();
      if (!details.includes(legal.toLowerCase()) && !title.includes(legal.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  async function handleCreateSale(e: React.FormEvent) {
    e.preventDefault();
    if (!saleWilaya || !saleCommune) {
      toast.error("يرجى اختيار الولاية والبلدية أولاً.");
      return;
    }
    if (!salePhone || salePhone.trim().length < 9) {
      toast.error("يرجى إدخال رقم هاتف جزائري صحيح.");
      return;
    }
    setIsSubmittingSale(true);
    const cleanSaleTitle =
      maskPhoneNumbers(saleTitle.trim()) || `${saleType} للبيع في ${saleWilaya}`;
    const cleanSaleDesc =
      maskPhoneNumbers(saleDesc.trim()) || "عقار معروض للبيع النهائي بوثائق قانونية سليمة.";

    const res = await executeCreateProperty(
      {
        title: cleanSaleTitle,
        propertyType: saleType,
        purpose: "بيع",
        legalStatus: saleLegal,
        wilaya: saleWilaya,
        commune: saleCommune,
        price: Number(salePrice) || 10000000,
        area: Number(saleArea) || 100,
        rooms: Number(saleRooms) || 0,
        description: cleanSaleDesc,
        phone: salePhone.trim(),
      },
      queryClient,
    );
    setIsSubmittingSale(false);
    if (res.success) {
      toast.success("تم نشر عقار البيع بنجاح ومزامنته في المنصة.");
      setShowNewSaleModal(false);
      setSaleTitle("");
      setSalePrice("");
      setSaleDesc("");
    } else {
      toast.error(res.error || "تعذر نشر العقار، حاول ثانية.");
    }
  }

  async function handleCreateBuy(e: React.FormEvent) {
    e.preventDefault();
    if (!buyWilaya || !buyCommune) {
      toast.error("يرجى اختيار الولاية والبلدية أولاً.");
      return;
    }
    if (!buyPhone || buyPhone.trim().length < 9) {
      toast.error("يرجى إدخال رقم هاتف جزائري صحيح.");
      return;
    }
    setIsSubmittingBuy(true);
    const cleanBuyTitle =
      maskPhoneNumbers(buyTitle.trim()) || `مطلوب شراء ${buyType} في ${buyWilaya}`;
    const baseBuyDetails = buyDetails.trim()
      ? maskPhoneNumbers(buyDetails.trim())
      : "مشتري جاد يبحث عن عقار للشراء الفوري كاش.";
    const cleanBuyDetails = `${baseBuyDetails} (الوثائق والوضعية المشروطة: ${buyLegal})`;

    const res = await executeCreateRequest(
      {
        title: cleanBuyTitle,
        propertyType: buyType,
        purpose: "شراء",
        wilaya: buyWilaya,
        commune: buyCommune,
        budget: Number(buyBudget) || 10000000,
        rooms: Number(buyRooms) || 0,
        duration: "شراء نهائي",
        details: cleanBuyDetails,
        phone: buyPhone.trim(),
      },
      queryClient,
    );
    setIsSubmittingBuy(false);
    if (res.success) {
      toast.success("تم نشر طلب الشراء بنجاح ومزامنته في المنصة.");
      setShowNewBuyModal(false);
      setBuyTitle("");
      setBuyBudget("");
      setBuyDetails("");
    } else {
      toast.error(res.error || "تعذر نشر طلب الشراء، حاول ثانية.");
    }
  }

  return (
    <>
      <PageTitle
        title="ركن البيع والشراء النهائي"
        sub="عقارات وأراضي للبيع النهائي مع الوثائق الرسمية وطلبات المشترين الجادين عبر 69 ولاية جزائرية"
      />

      <div className="mx-auto -mt-6 max-w-6xl px-4">
        {/* Quick Nav to other 2 Pillars */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">الأركان الثلاثة:</span>
            <Link
              to="/search"
              search={{ section: "offers" }}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-emerald-600/40 bg-emerald-500/10 px-3 py-1 font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition"
            >
              <Building2 size={13} />
              <span>1. ركن الكراء الدائم</span>
            </Link>
            <Link
              to="/temporary-rentals"
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-amber-500/40 bg-amber-500/10 px-3 py-1 font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-500 hover:text-slate-950 transition"
            >
              <Clock size={13} />
              <span>2. ركن الكراء المؤقت (24 سا)</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-blue-600 bg-blue-600 text-white px-3 py-1 font-black shadow-sm">
              <Tag size={13} />
              <span>3. ركن البيع والشراء النهائي (الحالي)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeSection === "offers" ? (
              <button
                onClick={() => setShowNewSaleModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>نشر عقار للبيع</span>
              </button>
            ) : (
              <button
                onClick={() => setShowNewBuyModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>نشر طلب شراء عقار</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Section Switcher: عروض البيع vs طلبات الشراء */}
        <div className="rounded-3xl border-2 border-blue-600/30 bg-gradient-to-br from-blue-600/10 via-card to-indigo-950/10 p-4 sm:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/20 pb-4">
            <div className="inline-flex rounded-xl bg-secondary/80 p-1 border border-blue-500/20">
              <button
                type="button"
                onClick={() => setActiveSection("offers")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs md:text-sm font-bold transition cursor-pointer ${
                  activeSection === "offers"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Tag size={16} />
                <span>قسم العقارات المعروضة للبيع</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    activeSection === "offers"
                      ? "bg-white/20 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {salesList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("requests")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs md:text-sm font-bold transition cursor-pointer ${
                  activeSection === "requests"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText size={16} />
                <span>قسم طلبات الشراء</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    activeSection === "requests"
                      ? "bg-white/20 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {requestsList.length}
                </span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {activeSection === "offers"
                ? "عقارات وأراضي وفيلات ومحلات معروضة للبيع الفوري بعقود رسمية"
                : "طلبات من مشترين جاهزين للدفع النقدي الفوري وفق ميزانيات معلنة"}
            </p>
          </div>

          {/* Search Inputs */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 md:items-end">
            <WilayaCommune
              wilaya={w}
              setWilaya={setW}
              commune={c}
              setCommune={setC}
              allOption={true}
            />

            <CustomSelect
              label="الوضعية القانونية للعقار"
              value={legal}
              onChange={setLegal}
              options={legalStatusFilterOptions}
              placeholder="كافة الوضعيات القانونية"
            />

            <CustomSelect
              label="النمط العقاري"
              value={t}
              onChange={setT}
              options={salePatternFilterOptions}
              placeholder="كافة الأنماط العقارية"
            />

            <div>
              <button
                type="button"
                onClick={() => {
                  setW("");
                  setC("");
                  setT("");
                  setLegal("");
                }}
                className="w-full rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          </div>

          {/* Pattern Tabs Bar */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground font-semibold">
              <SlidersHorizontal size={13} />
              <span>تصفح حسب النمط العقاري:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {salePatternTabs.map((tab) => {
                const isActive = t === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setT(tab.key)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary/70 text-foreground hover:bg-secondary border border-border/60"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && <Check size={13} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mt-8">
          {(lastSalePropertiesError || lastPurchaseRequestsError) && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              <p className="font-bold flex items-center gap-1.5 text-sm mb-1">
                <AlertTriangle size={16} className="text-amber-600" />
                حالة اتصال جداول البيع والشراء في Supabase
              </p>
              <p>
                تم ربط هذا القسم مباشرة بجدولي <code>sale_properties</code> و{" "}
                <code>purchase_requests</code> في Supabase. استجابة قاعدة البيانات:{" "}
                <span className="font-mono font-bold text-destructive">
                  {lastSalePropertiesError || lastPurchaseRequestsError}
                </span>
                . (في حال ظهور "permission denied"، يُرجى تنفيذ أمر منح الأذونات في Supabase SQL
                Editor للجداول الجديدة).
              </p>
            </div>
          )}

          {activeSection === "offers" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Tag className="text-primary" size={18} />
                  <span>عقارات معروضة للبيع</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({filteredSales.length} عقار متوفر) {t && `(نمط: ${t})`}
                  </span>
                </h3>
              </div>

              {loadingSales ? (
                <div className="py-12 text-center text-muted-foreground">
                  جارٍ تحميل عروض البيع...
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                  <Tag className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="font-bold text-base text-foreground">
                    لا توجد عقارات معروضة للبيع تطابق هذا النمط حالياً
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    يمكنك نشر أول عقار للبيع في هذه الفئة ليراه آلاف المشترين في الجزائر
                  </p>
                  <button
                    onClick={() => setShowNewSaleModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-black text-deep shadow hover:brightness-105"
                  >
                    <PlusCircle size={15} />
                    <span>نشر عقار للبيع الآن</span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSales.map((p) => (
                    <div
                      key={p.id}
                      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-card-hover flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-3 right-3 flex flex-wrap gap-1">
                            <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                              للبيع النهائي
                            </span>
                            {p.legalStatus && (
                              <span className="rounded-lg bg-black/80 backdrop-blur px-2 py-1 text-[11px] font-bold text-amber-300 shadow flex items-center gap-1 border border-amber-400/30">
                                <BadgeCheck size={12} className="text-amber-400" />
                                <span>{p.legalStatus}</span>
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white flex items-center gap-1 shadow">
                            <MapPin size={12} className="text-amber-400" />
                            <span>
                              {p.commune ? `${p.commune}، ` : ""}ولاية {p.wilaya}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="rounded bg-secondary px-2 py-0.5 font-bold text-foreground">
                              {p.type}
                            </span>
                            <span>{formatPublishTime(p.createdAt || p.publishedAt)}</span>
                          </div>

                          <h3 className="font-bold text-base text-foreground line-clamp-1">
                            {maskPhoneNumbers(p.title)}
                          </h3>

                          {/* بيان صريح للولاية والبلدية والوضعية القانونية في جسم البطاقة */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-secondary/80 px-2.5 py-1 rounded-md">
                              <MapPin size={13} className="text-primary" />
                              <span>
                                {p.commune ? `${p.commune}، ` : ""}ولاية {p.wilaya}
                              </span>
                            </span>
                            {p.legalStatus && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                <ShieldCheck
                                  size={12}
                                  className="text-emerald-600 dark:text-emerald-400"
                                />
                                <span>الوضعية: {p.legalStatus}</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {maskPhoneNumbers(p.description)}
                          </p>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60 text-muted-foreground">
                            <span>
                              المساحة: <b>{p.area} م²</b>
                            </span>
                            {p.rooms > 0 && (
                              <span>
                                الغرف: <b>{p.rooms}</b>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                          <div>
                            <span className="block text-[10px] text-muted-foreground">
                              السعر المطلوب:
                            </span>
                            <span className="text-base font-extrabold text-blue-700 dark:text-blue-400">
                              {formatDA(p.price)}
                            </span>
                          </div>

                          <Link
                            to="/property/$id"
                            params={{ id: p.id }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm shadow-blue-600/20 transition cursor-pointer"
                          >
                            <span>تفاصيل ومعاينة</span>
                            <span>←</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <FileText className="text-primary" size={18} />
                  <span>طلبات شراء العقارات والأراضي</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({filteredRequests.length} طلب شراء) {t && `(نمط: ${t})`}
                  </span>
                </h3>
              </div>

              {loadingRequests ? (
                <div className="py-12 text-center text-muted-foreground">
                  جارٍ تحميل طلبات الشراء...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="font-bold text-base text-foreground">
                    لا توجد طلبات شراء تطابق هذا النمط حالياً
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    هل تبحث عن شراء شقة أو قطعة أرض أو فيلا؟ انشر طلبك الآن مجاناً ليراك الملاك
                  </p>
                  <button
                    onClick={() => setShowNewBuyModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
                  >
                    <PlusCircle size={15} />
                    <span>نشر طلب شراء جديد</span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRequests.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-card-hover flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                            طلب شراء • {r.type}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatPublishTime(r.createdAt || r.date)}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-foreground line-clamp-2">
                          {maskPhoneNumbers(r.title)}
                        </h3>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {maskPhoneNumbers(r.details)}
                        </p>

                        <div className="rounded-xl bg-secondary/60 p-2.5 text-xs flex justify-between items-center">
                          <span className="text-muted-foreground">الموقع المطلوب:</span>
                          <span className="font-bold text-foreground">
                            {r.commune}، ولاية {r.wilaya}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] text-muted-foreground">
                            ميزانية الشراء:
                          </span>
                          <span className="text-sm font-black text-primary">
                            {formatDA(r.budget)}
                          </span>
                        </div>

                        <Link
                          to="/request/$id"
                          params={{ id: r.id }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm shadow-blue-600/20 transition cursor-pointer"
                        >
                          <span>عرض تفاصيل الطلب</span>
                          <span>←</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Sale Property */}
      {showNewSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 pb-28 shadow-2xl">
            <button
              onClick={() => setShowNewSaleModal(false)}
              className="absolute top-4 left-4 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleCreateSale} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 mb-2">
                <Tag className="text-gold" size={22} />
                <div>
                  <h3 className="font-bold text-foreground text-base">نشر عقار للبيع النهائي</h3>
                  <p className="text-xs text-muted-foreground">
                    سيظهر إعلانك في قسم العقارات المعروضة للبيع مع تفاصيل الملكية والوثائق
                  </p>
                </div>
              </div>

              <Field label="عنوان الإعلان">
                <input
                  type="text"
                  required
                  placeholder="مثال: شقة F4 للبيع بعقد ملكية ودفتر عقاري"
                  value={saleTitle}
                  onChange={(e) => setSaleTitle(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <CustomSelect
                  label="النوع العقاري"
                  value={saleType}
                  onChange={setSaleType}
                  options={salePropertyTypeOptions}
                />

                <Field label="السعر المطلوب (د.ج)">
                  <input
                    type="number"
                    required
                    min={100000}
                    step={100000}
                    placeholder="مثلاً: 25000000"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <CustomSelect
                label="الوضعية القانونية والوثائق"
                value={saleLegal}
                onChange={setSaleLegal}
                options={saleLegalModalOptions}
              />

              <WilayaCommune
                wilaya={saleWilaya}
                setWilaya={setSaleWilaya}
                commune={saleCommune}
                setCommune={setSaleCommune}
                allOption={false}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="المساحة (م²)">
                  <input
                    type="number"
                    required
                    min={10}
                    placeholder="مثلاً: 120"
                    value={saleArea}
                    onChange={(e) => setSaleArea(e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <Field label="عدد الغرف">
                  <input
                    type="number"
                    min={0}
                    placeholder="0 للأراضي"
                    value={saleRooms}
                    onChange={(e) => setSaleRooms(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="رقم الهاتف للتواصل">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="05 / 06 / 07 XX XX XX"
                  value={salePhone}
                  onChange={(e) => setSalePhone(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="وصف العقار والمميزات">
                <textarea
                  rows={3}
                  placeholder="موقع العقار، المرافق القريبة، التجهيزات، طريقة الدفع..."
                  value={saleDesc}
                  onChange={(e) => setSaleDesc(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewSaleModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSale}
                  className="rounded-lg bg-gold px-5 py-2 text-xs font-black text-deep shadow hover:brightness-105 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingSale ? "جارٍ النشر والمزامنة..." : "نشر العقار للبيع الآن"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Purchase Request */}
      {showNewBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 pb-28 shadow-2xl">
            <button
              onClick={() => setShowNewBuyModal(false)}
              className="absolute top-4 left-4 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleCreateBuy} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 mb-2">
                <FileText className="text-primary" size={22} />
                <div>
                  <h3 className="font-bold text-foreground text-base">نشر طلب شراء عقار</h3>
                  <p className="text-xs text-muted-foreground">
                    سيظهر طلبك للملاك وأصحاب العقارات المعروضة للبيع ليتواصلوا معك مباشرة
                  </p>
                </div>
              </div>

              <Field label="عنوان طلب الشراء">
                <input
                  type="text"
                  required
                  placeholder="مثال: مطلوب شراء شقة F3 أو F4 في درارية"
                  value={buyTitle}
                  onChange={(e) => setBuyTitle(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <CustomSelect
                  label="النوع المطلوب"
                  value={buyType}
                  onChange={setBuyType}
                  options={salePropertyTypeOptions}
                />

                <Field label="الميزانية المتوفرة (د.ج)">
                  <input
                    type="number"
                    required
                    min={100000}
                    step={100000}
                    placeholder="مثلاً: 18000000"
                    value={buyBudget}
                    onChange={(e) => setBuyBudget(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <CustomSelect
                label="الوضعية القانونية والوثائق المشروطة للشراء"
                value={buyLegal}
                onChange={setBuyLegal}
                options={buyLegalModalOptions}
              />

              <WilayaCommune
                wilaya={buyWilaya}
                setWilaya={setBuyWilaya}
                commune={buyCommune}
                setCommune={setBuyCommune}
                allOption={false}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="عدد الغرف المطلوب">
                  <input
                    type="number"
                    min={0}
                    placeholder="0 للأراضي"
                    value={buyRooms}
                    onChange={(e) => setBuyRooms(e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <Field label="رقم الهاتف للتواصل">
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="05 / 06 / 07 XX XX XX"
                    value={buyPhone}
                    onChange={(e) => setBuyPhone(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="مواصفات وشروط إضافية">
                <textarea
                  rows={3}
                  placeholder="نوع الوثائق المشروطة (دفتر عقاري، عقد توثيقي...)، طريقة الدفع، طابق محدد..."
                  value={buyDetails}
                  onChange={(e) => setBuyDetails(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewBuyModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBuy}
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingBuy ? "جارٍ النشر والمزامنة..." : "نشر طلب الشراء الآن"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
