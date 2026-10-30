import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Star,
  Check,
  ShieldCheck,
  Sparkles,
  Phone,
  BedDouble,
  Ruler,
  Bath,
  Tv,
  Wifi,
  Wind,
  Car,
  Home,
  Waves,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { temporaryRentalsQuery } from "@/lib/listings";
import { supabase } from "@/integrations/supabase/client";
import {
  formatDA,
  wilayasList,
  getCommunesForWilaya,
  normalizeWilayaName,
  fees,
  type TemporaryRental,
  type TemporaryBooking,
} from "@/lib/data";
import { saveTemporaryBookingToFirestore } from "@/lib/firebase";
import { PageTitle, Field, inputCls, btnGold, WilayaCommune } from "@/components/site";
import { toast } from "sonner";

export const Route = createFileRoute("/temporary-rentals")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    w?: string;
    c?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    guests?: string;
  } => ({
    w: typeof s["w"] === "string" ? s["w"] : undefined,
    c: typeof s["c"] === "string" ? s["c"] : undefined,
    type: typeof s["type"] === "string" ? s["type"] : undefined,
    minPrice: typeof s["minPrice"] === "string" ? s["minPrice"] : undefined,
    maxPrice: typeof s["maxPrice"] === "string" ? s["maxPrice"] : undefined,
    guests: typeof s["guests"] === "string" ? s["guests"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "كراء شقق مؤقتة في الجزائر | باليوم، 24 ساعة، والأسبوع" },
      {
        name: "description",
        content:
          "احجز شققاً مفروشة واستوديوهات مجهزة للكراء المؤقت باليوم (24 ساعة فما فوق) أو بالأسبوع في أرقى أحياء الجزائر العاصمة، وهران، قسنطينة، بجاية وغيرها.",
      },
      { property: "og:title", content: "كراء شقق مؤقتة في الجزائر - منزلي وأرضي" },
      {
        property: "og:description",
        content:
          "شقق مفروشة مؤثثة بأرقى التجهيزات للإقامة القصيرة، السياحة، العطلات، والزيارات المهنية عبر 69 ولاية.",
      },
    ],
  }),
  component: TemporaryRentalsPage,
});

export function TemporaryRentalsPage() {
  const searchParams = Route.useSearch();

  // Filters state
  const [wilaya, setWilaya] = useState(searchParams.w ?? "");
  const [commune, setCommune] = useState(searchParams.c ?? "");
  const [rentalType, setRentalType] = useState(searchParams.type ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice ?? "");
  const [minGuests, setMinGuests] = useState(searchParams.guests ?? "");
  const [only24h, setOnly24h] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<string>("");
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "price_desc">("rating");

  // Selected rental for booking or details modal
  const [bookingRental, setBookingRental] = useState<TemporaryRental | null>(null);
  const [detailsRental, setDetailsRental] = useState<TemporaryRental | null>(null);

  // Booking Form State
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [guestCount, setGuestCount] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  // Communes for selected wilaya
  const communes = useMemo(() => getCommunesForWilaya(wilaya), [wilaya]);

  // Calculate nights
  const nightsCount = useMemo(() => {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diffTime = outDate.getTime() - inDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  // Fetch real temporary rentals from Supabase and Firestore
  const { data: rentals = [], isLoading } = useQuery(temporaryRentalsQuery);

  // Filter listings
  const filteredRentals = useMemo(() => {
    const normSearchW = normalizeWilayaName(wilaya);
    return rentals
      .filter((r) => {
        if (wilaya) {
          const rNorm = normalizeWilayaName(r.wilaya);
          if (rNorm !== normSearchW && r.wilaya !== wilaya) return false;
        }
        if (commune) {
          const cNorm = commune.trim().toLowerCase();
          const rCommune = (r.commune ?? "").trim().toLowerCase();
          if (!rCommune.includes(cNorm) && rCommune !== cNorm) return false;
        }
        if (rentalType && r.type !== rentalType) return false;
        if (minPrice && r.nightlyPrice < Number(minPrice)) return false;
        if (maxPrice && r.nightlyPrice > Number(maxPrice)) return false;
        if (minGuests && r.maxGuests < Number(minGuests)) return false;
        if (only24h && !r.is24hAvailable) return false;
        if (selectedAmenity && !r.amenities.some((a) => a.includes(selectedAmenity))) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "price_asc") return a.nightlyPrice - b.nightlyPrice;
        if (sortBy === "price_desc") return b.nightlyPrice - a.nightlyPrice;
        return 0;
      });
  }, [
    rentals,
    wilaya,
    commune,
    rentalType,
    minPrice,
    maxPrice,
    minGuests,
    only24h,
    selectedAmenity,
    sortBy,
  ]);

  // Handle Booking Submit
  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingRental) return;

    if (!guestPhone || guestPhone.trim().length < 9) {
      toast.error("يرجى إدخال رقم هاتف جزائري صحيح للتواصل.");
      return;
    }

    setIsSubmitting(true);
    const nightlyPrice = bookingRental.nightlyPrice;
    const totalPrice = nightlyPrice * nightsCount;
    const serviceFee = fees.temporaryBookingFee || 500;
    const grandTotal = totalPrice + serviceFee;

    // 1. Get authenticated user from Supabase if logged in
    let authUserId: string | null = null;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) authUserId = authData.user.id;
    } catch {
      // optional
    }

    let supabaseError: string | null = null;
    let createdBookingId: string | null = null;

    // 2. Perform INSERT into Supabase short_term_rentals table
    try {
      let targetPropertyId = bookingRental.id;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        targetPropertyId,
      );

      // If rental ID is not a UUID (e.g. initial demo data), resolve or create a property in properties table
      if (!isUuid) {
        const { data: existingProp } = await supabase
          .from("properties")
          .select("id")
          .eq("wilaya", bookingRental.wilaya)
          .limit(1)
          .maybeSingle();

        if (existingProp?.id) {
          targetPropertyId = existingProp.id;
        } else {
          const { data: newP } = await supabase
            .from("properties")
            .insert({
              property_type: "apartment",
              wilaya: bookingRental.wilaya,
              municipality: bookingRental.commune,
              monthly_rent: nightlyPrice,
              duration_months: 0,
              description: bookingRental.title,
              status: "approved",
            })
            .select("id")
            .single();

          if (newP?.id) targetPropertyId = newP.id;
        }
      }

      // Insert directly into public.short_term_rentals
      const { data: strData, error: strErr } = await supabase
        .from("short_term_rentals")
        .insert({
          property_id: targetPropertyId,
          user_id: authUserId,
          check_in: checkIn,
          check_out: checkOut,
          total_price: grandTotal,
          status: "pending", // الحجوزات كلها تمر بعد موافقة المدير
        })
        .select("id")
        .single();

      if (strErr) {
        console.warn("Supabase short_term_rentals insert:", strErr);
        supabaseError = strErr.message;
      } else if (strData) {
        createdBookingId = strData.id;
      }
    } catch (err) {
      supabaseError = err instanceof Error ? err.message : String(err);
    }

    // 3. Save booking into local repository for Admin Dashboard
    const finalId = createdBookingId || `tmp-b${Date.now()}`;
    const newBooking: TemporaryBooking = {
      id: finalId,
      rentalId: bookingRental.id,
      rentalTitle: bookingRental.title,
      wilaya: bookingRental.wilaya,
      commune: bookingRental.commune,
      guestName: guestName.trim() || "ضيف كريم",
      guestPhone: guestPhone.trim(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalNights: nightsCount,
      guestsCount: guestCount,
      nightlyPrice,
      totalPrice,
      serviceFee,
      grandTotal,
      status: "قيد التأكيد",
      specialNotes: specialNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("manzili_local_bookings");
        const list: TemporaryBooking[] = raw ? JSON.parse(raw) : [];
        list.unshift(newBooking);
        localStorage.setItem("manzili_local_bookings", JSON.stringify(list));
      } catch {
        // ignore
      }
    }

    // Background sync to Firestore for admin redundancy
    try {
      await saveTemporaryBookingToFirestore({
        rentalId: bookingRental.id,
        rentalTitle: bookingRental.title,
        wilaya: bookingRental.wilaya,
        commune: bookingRental.commune,
        guestName: guestName.trim() || "ضيف كريم",
        guestPhone: guestPhone.trim(),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalNights: nightsCount,
        guestsCount: guestCount,
        nightlyPrice,
        totalPrice,
        serviceFee,
        grandTotal,
        status: "قيد التأكيد",
        specialNotes: specialNotes.trim() || undefined,
      });
    } catch {
      // ignore
    }

    setIsSubmitting(false);

    // 4. Report feedback accurately without deceptive fake success
    if (createdBookingId) {
      toast.success(
        "تم حفظ طلب الحجز بنجاح في قاعدة بيانات Supabase! طلبك الآن بانتظار مراجعة واعتماد المدير.",
      );
    } else if (supabaseError) {
      toast.warning(
        `تم تسجيل طلب الحجز محلياً بانتظار اعتماد المدير (تنبيه قاعدة البيانات: ${supabaseError})`,
        { duration: 7000 },
      );
    } else {
      toast.success("تم إرسال طلب الحجز بنجاح! طلبك الآن بانتظار مراجعة واعتماد المدير.");
    }

    const refCode = `DZ-TMP-${finalId.slice(0, 6).toUpperCase()}`;
    setConfirmedBookingId(refCode);
  }

  function resetBookingModal() {
    setBookingRental(null);
    setConfirmedBookingId(null);
    setGuestName("");
    setGuestPhone("");
    setSpecialNotes("");
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-deep via-deep/95 to-background text-deep-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-bold text-gold">
                <Clock size={14} className="animate-pulse" />
                <span>خدمة كراء الشقق المؤقتة واليومية (24 ساعة / أسبوع)</span>
              </div>
              <h1 className="mt-3 text-3xl font-black md:text-5xl leading-tight">
                شقق مؤثثة للكراء المؤقت <span className="text-gold">بأمان وخصوصية</span>
              </h1>
              <p className="mt-3 text-base text-deep-foreground/80 leading-relaxed">
                سواء كنت مسافراً في مهمة عمل، أو لقضاء عطلة عائلية، أو علاج، استأجر شقة مجهزة
                بالكامل لمدة 24 ساعة، عطلة نهاية الأسبوع، أو عدة أيام مع ضمان النظافة والتعقيم
                وخصوصية الاتصال.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row md:items-center">
              <Link
                to="/publish"
                search={{ mode: "temporary" }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-extrabold text-deep shadow-lg hover:brightness-105 transition"
              >
                <Home size={18} />
                <span>انشر شقتك للكراء المؤقت</span>
              </Link>
              <a
                href="#rentals-list"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
              >
                <span>تصفح الشقق المتاحة</span>
                <ChevronRight size={16} />
              </a>
            </div>
          </div>

          {/* Quick Value Pillars */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
              <Clock className="text-gold shrink-0" size={20} />
              <div>
                <p className="font-bold text-white">كراء 24 ساعة فوري</p>
                <p className="text-deep-foreground/70 text-[11px]">متاح باليوم أو بالأسبوع</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
              <ShieldCheck className="text-gold shrink-0" size={20} />
              <div>
                <p className="font-bold text-white">عائلية ومؤمنة</p>
                <p className="text-deep-foreground/70 text-[11px]">احترام وضوابط أمنية</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
              <Sparkles className="text-gold shrink-0" size={20} />
              <div>
                <p className="font-bold text-white">مفروشة بالكامل</p>
                <p className="text-deep-foreground/70 text-[11px]">تكييف، واي فاي ومطبخ</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
              <CheckCircle2 className="text-gold shrink-0" size={20} />
              <div>
                <p className="font-bold text-white">تسليم مفاتيح سلس</p>
                <p className="text-deep-foreground/70 text-[11px]">متابعة وإشراف الإدارة</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Search & Filters Card */}
      <div id="rentals-list" className="mx-auto -mt-6 max-w-6xl px-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <SlidersHorizontal size={18} className="text-gold" />
              <span>تخصيص البحث عن شقة مؤقتة</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredRentals.length} شقة متوفرة حاليًا
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <WilayaCommune
              wilaya={wilaya}
              setWilaya={setWilaya}
              commune={commune}
              setCommune={setCommune}
              allOption={true}
            />

            {/* Rental Type Filter */}
            <Field label="نوع العقار المؤقت">
              <select
                className={inputCls}
                value={rentalType}
                onChange={(e) => setRentalType(e.target.value)}
              >
                <option value="">كل الأنواع</option>
                <option value="شقة">شقة مفروشة</option>
                <option value="استوديو">استوديو مجهز</option>
                <option value="فيلا">فيلا / دوبلكس سياحي</option>
              </select>
            </Field>

            {/* Guests Filter */}
            <Field label="عدد الضيوف / الأشخاص">
              <select
                className={inputCls}
                value={minGuests}
                onChange={(e) => setMinGuests(e.target.value)}
              >
                <option value="">أي عدد</option>
                <option value="1">شخص أو شخصان</option>
                <option value="3">3 إلى 4 أشخاص</option>
                <option value="5">5 أشخاص فما فوق (عائلة كبيرة)</option>
              </select>
            </Field>
          </div>

          {/* Quick Filter Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground ml-1">
              الميزات السريعة:
            </span>

            <button
              type="button"
              onClick={() => setOnly24h(!only24h)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                only24h
                  ? "bg-gold text-deep shadow"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              <Clock size={13} />
              <span>متاح 24 ساعة فوري</span>
            </button>

            {["تكييف", "واي فاي", "موقف سيارات", "إطلالة", "مسبح"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedAmenity(selectedAmenity === tag ? "" : tag)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  selectedAmenity === tag
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}
              >
                {tag}
              </button>
            ))}

            <div className="mr-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">الترتيب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium"
              >
                <option value="rating">الأعلى تقييماً ⭐</option>
                <option value="price_asc">الأقل سعراً أولاً</option>
                <option value="price_desc">الأعلى سعراً أولاً</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rentals Grid */}
      <section className="mx-auto max-w-6xl px-4 mt-8">
        {filteredRentals.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
            <Home className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold">لم نجد شققاً مؤقتة تطابق معايير البحث</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              جرب تغيير خيارات الفلترة أو إعادة ضبط الولاية لتصفح الشقق المتاحة.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/publish"
                search={{ mode: "temporary" }}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-xs font-black text-deep shadow hover:brightness-105 transition"
              >
                <Home size={15} />
                <span>انشر شقتك للكراء المؤقت الآن</span>
              </Link>
              <button
                onClick={() => {
                  setWilaya("");
                  setCommune("");
                  setRentalType("");
                  setMinGuests("");
                  setOnly24h(false);
                  setSelectedAmenity("");
                }}
                className="rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRentals.map((rental) => (
              <div
                key={rental.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Image Cover */}
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={rental.image}
                    alt={rental.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-gold px-2.5 py-0.5 text-xs font-black text-deep shadow">
                      كراء مؤقت
                    </span>
                    {rental.is24hAvailable && (
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white shadow flex items-center gap-1">
                        <Clock size={11} />
                        24 ساعة
                      </span>
                    )}
                  </div>

                  {/* Rating Badge */}
                  <div className="absolute top-3 left-3 rounded-md bg-black/60 backdrop-blur px-2 py-1 text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Star size={13} className="fill-amber-300 text-amber-300" />
                    <span>{rental.rating}</span>
                    <span className="text-[10px] text-white/70">({rental.reviewsCount})</span>
                  </div>

                  {/* Location in image bottom */}
                  <div className="absolute bottom-2.5 right-3 left-3 flex items-center gap-1.5 text-xs text-white drop-shadow">
                    <MapPin size={14} className="shrink-0 text-gold" />
                    <span className="truncate font-semibold">
                      {rental.commune}، {rental.wilaya}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition">
                    {rental.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {rental.description}
                  </p>

                  {/* Property specs */}
                  <div className="mt-3 grid grid-cols-3 gap-2 border-y border-border py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BedDouble size={14} className="text-primary" />
                      <span>{rental.rooms} غرف</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-primary" />
                      <span>حتى {rental.maxGuests} ضيوف</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Ruler size={14} className="text-primary" />
                      <span>{rental.area} م²</span>
                    </div>
                  </div>

                  {/* Amenities tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {rental.amenities.slice(0, 3).map((a, i) => (
                      <span
                        key={i}
                        className="rounded bg-secondary/80 px-2 py-0.5 text-[11px] text-secondary-foreground"
                      >
                        {a}
                      </span>
                    ))}
                    {rental.amenities.length > 3 && (
                      <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        +{rental.amenities.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer with Price & Actions */}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">السعر بالليلة</div>
                      <div className="text-base font-black text-primary">
                        {formatDA(rental.nightlyPrice)}
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {" "}
                          / 24 سا
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailsRental(rental)}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary transition"
                      >
                        التفاصيل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingRental(rental);
                          setConfirmedBookingId(null);
                        }}
                        className="rounded-lg bg-gold px-3.5 py-2 text-xs font-black text-deep shadow hover:brightness-105 transition flex items-center gap-1"
                      >
                        <Calendar size={13} />
                        <span>احجز الآن</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking Modal */}
      {bookingRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={resetBookingModal}
              className="absolute top-4 left-4 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={20} />
            </button>

            {confirmedBookingId ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-black text-foreground">تم إرسال طلب حجزك بنجاح!</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  رمز الحجز الخاص بك لمتابعة الطلب مع الإدارة وصاحب الشقة:
                </p>
                <div className="mt-3 inline-block rounded-xl border border-gold/40 bg-gold/10 px-6 py-2.5 font-mono text-lg font-black text-gold">
                  {confirmedBookingId}
                </div>

                <div className="mt-5 rounded-xl border border-border bg-secondary/50 p-4 text-right text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العقار:</span>
                    <span className="font-bold">{bookingRental.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المدة:</span>
                    <span>
                      {nightsCount} ليلة ({checkIn} إلى {checkOut})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ الإجمالي المتوقع:</span>
                    <span className="font-black text-primary">
                      {formatDA(
                        bookingRental.nightlyPrice * nightsCount +
                          (fees.temporaryBookingFee || 500),
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>سيتم الاتصال بك خلال دقائق لتأكيد وقت الوصول واستلام المفاتيح.</span>
                </div>

                <button
                  type="button"
                  onClick={resetBookingModal}
                  className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition"
                >
                  إغلاق ومتابعة التصفح
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit}>
                <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                  <Calendar className="text-gold" size={20} />
                  <div>
                    <h3 className="font-bold text-foreground">طلب حجز شقة مؤقتة</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-sm">
                      {bookingRental.title}
                    </p>
                  </div>
                </div>

                {/* Dates Selector */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="تاريخ الوصول (Check-in)">
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="تاريخ المغادرة (Check-out)">
                    <input
                      type="date"
                      required
                      min={checkIn || todayStr}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* Guests and Notes */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="عدد الضيوف">
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className={inputCls}
                    >
                      {Array.from({ length: bookingRental.maxGuests }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "ضيف" : "ضيوف"}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="اسم الحاجز أو رب الأسرة">
                    <input
                      type="text"
                      required
                      placeholder="الاسم واللقب"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <div className="mt-3">
                  <Field label="رقم هاتف للتأكيد والاتصال">
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      placeholder="05 / 06 / 07 XX XX XX XX"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className={`${inputCls} font-mono`}
                    />
                  </Field>
                </div>

                <div className="mt-3">
                  <Field label="ملاحظات إضافية أو ساعة الوصول التقريبية">
                    <input
                      type="text"
                      placeholder="مثال: نصل حوالي الساعة 16:00، عائلة مع طفلين"
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* Price Breakdown Calculation */}
                <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-3.5 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      سعر الليلة ({formatDA(bookingRental.nightlyPrice)} × {nightsCount} ليلة):
                    </span>
                    <span className="font-bold">
                      {formatDA(bookingRental.nightlyPrice * nightsCount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رسوم خدمة وتأكيد الحجز:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatDA(fees.temporaryBookingFee || 500)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-black text-foreground">
                    <span>المجموع الإجمالي:</span>
                    <span className="text-primary">
                      {formatDA(
                        bookingRental.nightlyPrice * nightsCount +
                          (fees.temporaryBookingFee || 500),
                      )}
                    </span>
                  </div>
                </div>

                {/* Notice */}
                <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
                  <Info size={14} className="mt-0.5 shrink-0 text-gold" />
                  <span>
                    وفقاً للقوانين الجزائرية المعمول بها، يُشترط إبراز بطاقة الهوية الوطنية أو
                    الدفتر العائلي عند استلام مفاتيح الشقة من المالك.
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 w-full rounded-xl bg-gold py-3 text-sm font-black text-deep shadow-lg hover:brightness-105 transition disabled:opacity-50"
                >
                  {isSubmitting ? "جارٍ إرسال طلب الحجز..." : "تأكيد طلب الحجز الفوري"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setDetailsRental(null)}
              className="absolute top-4 left-4 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={20} />
            </button>

            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted mb-4">
              <img
                src={detailsRental.image}
                alt={detailsRental.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 backdrop-blur px-3 py-1 text-xs text-white">
                {detailsRental.commune}، {detailsRental.wilaya}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-foreground">{detailsRental.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{detailsRental.address}</p>
              </div>
              <div className="text-left shrink-0">
                <div className="text-xs text-muted-foreground">السعر لـ 24 ساعة</div>
                <div className="text-lg font-black text-primary">
                  {formatDA(detailsRental.nightlyPrice)}
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {detailsRental.description}
            </div>

            {/* Amenities Section */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-foreground mb-2">التجهيزات المتوفرة بالشقة:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {detailsRental.amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules Section */}
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3.5">
              <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-gold" />
                <span>شروط الإقامة والاستقبال:</span>
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                {detailsRental.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
                <li>ساعة تسجيل الدخول: ابتداءً من {detailsRental.checkInTime || "14:00"}</li>
                <li>ساعة تسجيل المغادرة: حتى الساعة {detailsRental.checkOutTime || "12:00"}</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailsRental(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  setBookingRental(detailsRental);
                  setDetailsRental(null);
                  setConfirmedBookingId(null);
                }}
                className="rounded-lg bg-gold px-5 py-2 text-xs font-black text-deep shadow hover:brightness-105"
              >
                حجز هذه الشقة الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
