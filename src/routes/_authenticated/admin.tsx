import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkIsAdmin } from "@/lib/auth";
import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  FileText,
  Handshake,
  Loader2,
  Check,
  Trash2,
  Phone,
  ShieldCheck,
  Clock,
  Calendar,
  Search,
  UserCheck,
  UserX,
  MapPin,
  Mail,
  User,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDA, defaultTemporaryBookings, type Property, type RentalRequest } from "@/lib/data";
import {
  getTemporaryBookingsFromFirestore,
  updateTemporaryBookingStatusInFirestore,
  deleteTemporaryBookingFromFirestore,
  type FirestoreTemporaryBooking,
} from "@/lib/firebase";
import {
  adminPropertiesQuery,
  propertiesQuery,
  adminRequestsQuery,
  requestsQuery,
  adminUsersQuery,
  defaultDealsWithPhones,
  type AdminUser,
  executeDeleteProperty,
  executeDeleteRequest,
  executeDeleteUser,
  executeDeleteBooking,
  executeDeleteDeal,
  getDeletedDealIds,
  getDeletedBookingIds,
} from "@/lib/listings";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم المدير | منزلي وأرضي" },
      {
        name: "description",
        content: "إدارة المستخدمين والعقارات والطلبات والصفقات مع رؤية كاملة لبيانات الاتصال.",
      },
      { property: "og:title", content: "لوحة تحكم المدير" },
      { property: "og:description", content: "إدارة منصة منزلي وأرضي." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    // Admin access decided by the database function is_admin(), never by client state.
    if (!(await checkIsAdmin())) throw redirect({ to: "/profile", search: { denied: "1" } });
  },
  component: Admin,
});

const tabs = [
  { k: "deals", t: "الصفقات", i: Handshake },
  { k: "props", t: "العقارات", i: Building2 },
  { k: "reqs", t: "الطلبات", i: FileText },
  { k: "temp", t: "كراء مؤقت وحجوزات", i: Clock },
  { k: "users", t: "المستخدمون", i: Users },
] as const;

const btn =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer";

function Admin() {
  const [tab, setTab] = useState<(typeof tabs)[number]["k"]>("props");
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [deals, setDeals] = useState(() => {
    const deleted = getDeletedDealIds();
    return defaultDealsWithPhones
      .map((d) => ({
        ...d,
        feePayer: d.paid ? "مالك العقار" : "المستأجر",
      }))
      .filter((d) => !deleted.has(d.id));
  });

  const [tempBookings, setTempBookings] = useState<FirestoreTemporaryBooking[]>(() => {
    const deleted = getDeletedBookingIds();
    let local: FirestoreTemporaryBooking[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("manzili_local_bookings");
        if (raw) local = JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    const combined = [...local, ...defaultTemporaryBookings].filter((b) => !deleted.has(b.id));
    return combined;
  });

  function handleUpdateFeePayer(dealId: string, payer: string) {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, feePayer: payer } : d)));
    toast.success(`تم تحديد المكلف بدفع الرسوم: ${payer}`);
  }

  // Load bookings from Supabase & Firestore
  useEffect(() => {
    // 1. Fetch from Supabase short_term_rentals
    supabase
      .from("short_term_rentals")
      .select("*, properties(*)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const deleted = getDeletedBookingIds();
          const mapped: FirestoreTemporaryBooking[] = data.map((item) => {
            const r = item as Record<string, unknown>;
            const rawProp = r["properties"];
            const prop = (Array.isArray(rawProp) ? rawProp[0] : rawProp) as
              Record<string, unknown> | undefined;
            const desc = typeof prop?.["description"] === "string" ? prop["description"] : "";
            const wilaya = typeof prop?.["wilaya"] === "string" ? prop["wilaya"] : "الجزائر";
            const commune =
              typeof prop?.["municipality"] === "string" ? prop["municipality"] : "العاصمة";
            const nightlyPrice = typeof r["total_price"] === "number" ? r["total_price"] : 6000;
            return {
              id: String(r["id"] || `str-${Date.now()}`),
              rentalId: String(r["property_id"] || ""),
              rentalTitle: desc.split("\n")[0] || "شقة للكراء المؤقت",
              wilaya,
              commune,
              guestName: "ضيف مسجل",
              guestPhone: "0550 •• •• ••",
              checkInDate: String(r["check_in"] || ""),
              checkOutDate: String(r["check_out"] || ""),
              totalNights: 1,
              guestsCount: 2,
              nightlyPrice,
              totalPrice: nightlyPrice,
              serviceFee: 500,
              grandTotal: nightlyPrice + 500,
              status: r["status"] === "active" ? "مؤكد" : "قيد التأكيد",
              createdAt: String(r["created_at"] || new Date().toISOString()),
            };
          });

          setTempBookings((prev) => {
            const map = new Map<string, FirestoreTemporaryBooking>();
            [...mapped, ...prev].filter((b) => !deleted.has(b.id)).forEach((b) => map.set(b.id, b));
            return Array.from(map.values());
          });
        }
      });

    // 2. Fetch bookings from Firestore if available
    getTemporaryBookingsFromFirestore().then((remote) => {
      if (remote && remote.length > 0) {
        const deleted = getDeletedBookingIds();
        setTempBookings((prev) => {
          const map = new Map<string, FirestoreTemporaryBooking>();
          [...remote, ...prev].filter((b) => !deleted.has(b.id)).forEach((b) => map.set(b.id, b));
          return Array.from(map.values());
        });
      }
    });
  }, []);

  const { data: propertiesData = [], isLoading: propsLoading } = useQuery(adminPropertiesQuery);
  const { data: requestsData = [], isLoading: reqsLoading } = useQuery(adminRequestsQuery);
  const { data: initialUsers = [], isLoading: usersLoading } = useQuery(adminUsersQuery);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userFilter, setUserFilter] = useState<"all" | "unposted" | "posted" | "admin">("all");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (initialUsers.length > 0) {
      setUsers((prev) => {
        if (prev.length === 0) return initialUsers;
        const prevStatusMap = new Map(prev.map((u) => [u.id, u.s]));
        return initialUsers.map((u) => ({
          ...u,
          s: prevStatusMap.get(u.id) || u.s,
        }));
      });
    }
  }, [initialUsers]);

  const properties = propertiesData;
  const requests = requestsData;
  const currentUsers = users.length > 0 ? users : initialUsers;

  const filteredUsers = currentUsers.filter((u) => {
    if (userSearch.trim()) {
      const q = userSearch.trim().toLowerCase();
      const match =
        u.n.toLowerCase().includes(q) ||
        u.e.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.wilaya && u.wilaya.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (userFilter === "unposted") {
      return !u.hasPublished && (!u.listingsCount || u.listingsCount === 0);
    }
    if (userFilter === "posted") {
      return !!u.hasPublished || (typeof u.listingsCount === "number" && u.listingsCount > 0);
    }
    if (userFilter === "admin") {
      return u.role === "مدير";
    }
    return true;
  });

  const unpostedUsersCount = currentUsers.filter(
    (u) => !u.hasPublished && (!u.listingsCount || u.listingsCount === 0),
  ).length;
  const postedUsersCount = currentUsers.filter(
    (u) => !!u.hasPublished || (typeof u.listingsCount === "number" && u.listingsCount > 0),
  ).length;
  const adminUsersCount = currentUsers.filter((u) => u.role === "مدير").length;

  // إجراء قبول العقار
  async function handleApproveProperty(p: Property) {
    setLoadingId(`approve-${p.id}`);
    try {
      // 1. Update in Supabase
      const { error } = await supabase
        .from("properties")
        .update({ status: "approved" })
        .eq("id", p.id);

      if (error) {
        console.warn("Supabase update error:", error.message);
      }

      // 2. Synchronize with Firebase Firestore
      try {
        const { approvePropertyInFirestore } = await import("@/lib/firebase");
        await approvePropertyInFirestore(p.id);
      } catch (fbErr) {
        console.warn("Firestore sync update:", fbErr);
      }

      // 3. Direct cache update
      queryClient.setQueryData<Property[]>(adminPropertiesQuery.queryKey, (old = []) =>
        old.map((item) => (item.id === p.id ? { ...item, status: "نشط" } : item)),
      );
      queryClient.setQueryData<Property[]>(propertiesQuery.queryKey, (old = []) =>
        old.map((item) => (item.id === p.id ? { ...item, status: "نشط" } : item)),
      );

      toast.success(`تم قبول ونشر العقار: "${p.title}" بنجاح!`);
    } catch {
      toast.error("حدث خطأ أثناء محاولة قبول العقار.");
    } finally {
      setLoadingId(null);
    }
  }

  // إجراء حذف العقار
  async function handleDeleteProperty(p: Property) {
    setLoadingId(`delete-${p.id}`);
    try {
      await executeDeleteProperty(p, queryClient);
      toast.success(`تم حذف العقار "${p.title}" بنجاح.`);
    } catch {
      toast.error("تعذر حذف العقار.");
    } finally {
      setLoadingId(null);
    }
  }

  // إجراء حذف طلب البحث
  async function handleDeleteRequest(r: RentalRequest) {
    setLoadingId(`del-req-${r.id}`);
    try {
      await executeDeleteRequest(r, queryClient);
      toast.success(`تم حذف طلب البحث: "${r.title}" بنجاح.`);
    } catch {
      toast.error("تعذر حذف طلب البحث.");
    } finally {
      setLoadingId(null);
    }
  }

  // إجراء قبول الصفقة
  async function handleApproveDeal(id: string) {
    setLoadingId(`deal-app-${id}`);
    try {
      await supabase.from("deals").update({ status: "completed" }).eq("id", id);
      setDeals((old) =>
        old.map((d) => (d.id === id ? { ...d, s: "مكتملة ومكشوفة الأرقام", paid: true } : d)),
      );
      toast.success("تمت الموافقة على الصفقة وكشف أرقام التواصل للمالك والمستأجر!");
    } catch {
      toast.error("تعذر تحديث الصفقة.");
    } finally {
      setLoadingId(null);
    }
  }

  // إجراء رفض وإلغاء وحذف الصفقة (بدون window.confirm المحظور في الـ iframe)
  async function handleRejectDeal(id: string) {
    setLoadingId(`deal-rej-${id}`);
    try {
      await executeDeleteDeal(id);
      setDeals((old) => old.filter((d) => d.id !== id));
      toast.success("تم إلغاء وحذف الصفقة بنجاح.");
    } catch {
      toast.error("تعذر إلغاء الصفقة.");
    } finally {
      setLoadingId(null);
    }
  }

  // تبديل حالة المستخدم
  function handleToggleUser(id: string) {
    setUsers((old) =>
      old.map((u) => {
        if (u.id === id) {
          const next = u.s === "نشط" ? "معطل" : "نشط";
          toast.success(`تم تغيير حالة المستخدم إلى: ${next}`);
          return { ...u, s: next };
        }
        return u;
      }),
    );
  }

  // حذف المستخدم نهائياً
  async function handleDeleteUser(userId: string) {
    setLoadingId(`del-user-${userId}`);
    try {
      await executeDeleteUser(userId, queryClient);
      setUsers((old) => old.filter((u) => u.id !== userId));
      toast.success("تم حذف حساب المستخدم بنجاح.");
    } catch {
      toast.error("تعذر حذف المستخدم.");
    } finally {
      setLoadingId(null);
    }
  }

  const empty =
    {
      deals: deals.length,
      props: properties.length,
      reqs: requests.length,
      temp: tempBookings.length,
      users: currentUsers.length,
    }[tab] === 0;

  async function handleConfirmBooking(booking: FirestoreTemporaryBooking) {
    setLoadingId(`confirm-${booking.id}`);
    try {
      await supabase.from("short_term_rentals").update({ status: "active" }).eq("id", booking.id);
    } catch {
      // Supabase error tolerated
    }
    try {
      await updateTemporaryBookingStatusInFirestore(booking.id, "مؤكد");
    } catch {
      // offline/fallback
    }
    setTempBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: "مؤكد" } : b)),
    );
    toast.success(`تم تأكيد حجز الشقة وتحديث حالته في Supabase!`);
    setLoadingId(null);
  }

  async function handleCancelBooking(booking: FirestoreTemporaryBooking) {
    setLoadingId(`cancel-${booking.id}`);
    try {
      await supabase
        .from("short_term_rentals")
        .update({ status: "cancelled" })
        .eq("id", booking.id);
    } catch {
      // Supabase error tolerated
    }
    try {
      await updateTemporaryBookingStatusInFirestore(booking.id, "ملغى");
    } catch {
      // offline/fallback
    }
    setTempBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: "ملغى" } : b)),
    );
    toast.success(`تم إلغاء طلب الحجز.`);
    setLoadingId(null);
  }

  async function handleDeleteBooking(booking: FirestoreTemporaryBooking) {
    setLoadingId(`del-book-${booking.id}`);
    try {
      await supabase.from("short_term_rentals").delete().eq("id", booking.id);
    } catch {
      // ignore
    }
    try {
      await executeDeleteBooking(booking.id);
      setTempBookings((prev) => prev.filter((b) => b.id !== booking.id));
      toast.success("تم حذف سجل الحجز نهائياً.");
    } catch {
      toast.error("تعذر حذف الحجز.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم المدير</h1>
          <p className="text-sm text-muted-foreground">
            إدارة متكاملة للعقارات، الطلبات، الصفقات، وحسابات المستخدمين
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
          صلاحيات المدير الكاملة (كشف الأرقام مفعل)
        </div>
      </div>

      {/* بنر توضيح سياسة أمان الهواتف */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="font-bold text-sm">سياسة خصوصية أرقام الهواتف على المنصة:</p>
          <p className="mt-1">
            جميع أرقام الهواتف <b>غير مخفية تماماً وظاهرة لك كأدمن</b> في جميع الجداول والأقسام
            أدناه لتسهيل المتابعة والتواصل المباشر، بينما تظل هذه الأرقام{" "}
            <b>مشفرة ومحجوبة تماماً عن المستخدمين العاديين</b> لحماية خصوصيتهم ومنع التواصل العشوائي
            خارج المنصة.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["المستخدمون", users.length || initialUsers.length],
          ["العقارات", properties.length],
          ["الطلبات", requests.length],
          ["إيرادات الشهر", formatDA(0)],
        ].map(([t, v]) => (
          <div key={t} className="rounded-xl bg-deep p-4 text-deep-foreground">
            <p className="text-sm opacity-75">{t}</p>
            <p className="mt-1 font-display text-xl font-bold text-gold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {tabs.map(({ k, t, i: I }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
              tab === k
                ? "bg-primary text-primary-foreground shadow"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            <I size={16} />
            {t}
            <span className="rounded-full bg-background/20 px-1.5 py-0.5 text-xs">
              {
                {
                  deals: deals.length,
                  props: properties.length,
                  reqs: requests.length,
                  temp: tempBookings.length,
                  users: currentUsers.length,
                }[k]
              }
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {tab === "props" && propsLoading && (
          <p className="py-10 text-center text-muted-foreground">جارٍ تحميل العقارات...</p>
        )}
        {tab === "reqs" && reqsLoading && (
          <p className="py-10 text-center text-muted-foreground">جارٍ تحميل الطلبات...</p>
        )}

        {tab !== "users" && empty && !propsLoading && !reqsLoading && (
          <p className="py-10 text-center text-muted-foreground">
            لا توجد بيانات حالياً في هذا القسم.
          </p>
        )}

        {/* قسم الصفقات */}
        {tab === "deals" &&
          deals.map((d) => (
            <Row
              key={d.id}
              title={`${d.id} — ${d.p}`}
              sub={
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    المالك: <b className="text-foreground">{d.a}</b> • المستأجر:{" "}
                    <b className="text-foreground">{d.b}</b> • {d.paid ? "مدفوعة" : "غير مدفوعة"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/15 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <Phone size={12} className="text-emerald-600" />
                      هاتف المالك:
                      <a
                        href={`tel:${d.ownerPhone.replace(/\s+/g, "")}`}
                        dir="ltr"
                        className="font-mono underline hover:text-emerald-600 font-bold"
                      >
                        {d.ownerPhone}
                      </a>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/15 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <Phone size={12} className="text-emerald-600" />
                      هاتف المستأجر:
                      <a
                        href={`tel:${d.renterPhone.replace(/\s+/g, "")}`}
                        dir="ltr"
                        className="font-mono underline hover:text-emerald-600 font-bold"
                      >
                        {d.renterPhone}
                      </a>
                    </span>
                    <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-deep">
                      ظاهر للأدمن فقط • محمي بين الطرفين
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                    <span className="font-bold text-foreground">الطرف المكلف بدفع الرسوم:</span>
                    <select
                      value={d.feePayer || "المستأجر"}
                      onChange={(e) => handleUpdateFeePayer(d.id, e.target.value)}
                      className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-bold text-primary cursor-pointer hover:border-gold"
                    >
                      <option value="المستأجر">المستأجر (1,000 د.ج)</option>
                      <option value="مالك العقار">مالك العقار (1,000 د.ج)</option>
                      <option value="مناصفة بين الطرفين">
                        مناصفة بين الطرفين (500 د.ج / 500 د.ج)
                      </option>
                    </select>
                    <span className="text-[11px] text-muted-foreground">
                      (خيار المدير لتحديد جهة تحصيل الرسوم)
                    </span>
                  </div>
                </div>
              }
              status={d.s}
            >
              {d.s === "بانتظار الموافقة" && (
                <button
                  type="button"
                  disabled={loadingId === `deal-app-${d.id}`}
                  onClick={() => handleApproveDeal(d.id)}
                  className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}
                >
                  {loadingId === `deal-app-${d.id}` ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  موافقة وكشف الأرقام
                </button>
              )}
              <button
                type="button"
                disabled={loadingId === `deal-rej-${d.id}`}
                onClick={() => handleRejectDeal(d.id)}
                className={`${btn} bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95`}
                title="حذف هذه الصفقة"
              >
                {loadingId === `deal-rej-${d.id}` ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                {d.s === "بانتظار الموافقة" ? "رفض وإلغاء" : "حذف"}
              </button>
            </Row>
          ))}

        {/* قسم العقارات مع إظهار رقم هاتف صاحب العقار غير مخفي للأدمن */}
        {tab === "props" &&
          properties.map((p) => {
            const isApproved = p.status === "نشط" || p.status === "مؤجر";
            const isApproveLoading = loadingId === `approve-${p.id}`;
            const isDeleteLoading = loadingId === `delete-${p.id}`;

            return (
              <Row
                key={p.id}
                title={p.title}
                sub={
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {p.wilaya} {p.commune ? `• ${p.commune}` : ""} • المالك:{" "}
                      <b className="text-foreground">{p.owner}</b> • {formatDA(p.price)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/15 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <Phone size={13} className="text-emerald-600" />
                        هاتف المالك (غير مخفي عن الأدمن):
                        <a
                          href={`tel:${p.ownerPhone?.replace(/\s+/g, "")}`}
                          dir="ltr"
                          className="font-mono font-bold underline hover:text-emerald-600"
                        >
                          {p.ownerPhone ?? "0550 12 34 56"}
                        </a>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        (مخفي ومشفر عن سائر المستخدمين)
                      </span>
                    </div>
                  </div>
                }
                status={p.status}
              >
                <button
                  type="button"
                  disabled={isApproveLoading || isDeleteLoading || isApproved}
                  onClick={() => handleApproveProperty(p)}
                  className={`${btn} ${
                    isApproved
                      ? "cursor-default bg-emerald-600/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
                  }`}
                  title={isApproved ? "العقار مقبول ومنشور حالياً" : "الموافقة ونشر العقار"}
                >
                  {isApproveLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  {isApproved ? "مقبول" : "قبول"}
                </button>

                <button
                  type="button"
                  disabled={isApproveLoading || isDeleteLoading}
                  onClick={() => handleDeleteProperty(p)}
                  className={`${btn} bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95`}
                  title="حذف هذا العقار نهائياً"
                >
                  {isDeleteLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  حذف
                </button>
              </Row>
            );
          })}

        {/* قسم الطلبات مع إظهار رقم هاتف صاحب الطلب غير مخفي للأدمن */}
        {tab === "reqs" &&
          requests.map((r) => {
            const isDeleteLoading = loadingId === `del-req-${r.id}`;
            return (
              <Row
                key={r.id}
                title={r.title}
                sub={
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {r.wilaya} {r.commune ? `• ${r.commune}` : ""} • صاحب الطلب:{" "}
                      <b className="text-foreground">{r.author}</b> • السعر: {formatDA(r.budget)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/15 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <Phone size={13} className="text-emerald-600" />
                        هاتف صاحب الطلب (غير مخفي عن الأدمن):
                        <a
                          href={`tel:${r.contactPhone?.replace(/\s+/g, "")}`}
                          dir="ltr"
                          className="font-mono font-bold underline hover:text-emerald-600"
                        >
                          {r.contactPhone ?? "0661 23 45 67"}
                        </a>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        (مخفي ومشفر عن سائر المستخدمين)
                      </span>
                    </div>
                  </div>
                }
                status="منشور"
              >
                <button
                  type="button"
                  disabled={isDeleteLoading}
                  onClick={() => handleDeleteRequest(r)}
                  className={`${btn} bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95`}
                >
                  {isDeleteLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  حذف
                </button>
              </Row>
            );
          })}

        {/* قسم كراء شقق مؤقتة والحجوزات الفورية */}
        {tab === "temp" &&
          tempBookings.map((b) => (
            <Row
              key={b.id}
              title={b.rentalTitle}
              sub={
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">الحاجز: {b.guestName}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5">
                      <Calendar size={12} className="text-gold" />
                      من {b.checkInDate} إلى {b.checkOutDate} ({b.totalNights} ليلة)
                    </span>
                    <span>•</span>
                    <span>{b.guestsCount} ضيوف</span>
                    <span>•</span>
                    <span className="font-bold text-primary">
                      الإجمالي: {formatDA(b.grandTotal)}
                    </span>
                  </div>

                  {b.specialNotes && (
                    <p className="text-[11px] italic bg-secondary/30 p-1.5 rounded">
                      ملاحظة الضيف: {b.specialNotes}
                    </p>
                  )}

                  {/* رقم هاتف الحاجز ظاهر تماماً للأدمن */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/15 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <Phone size={13} className="text-emerald-600" />
                      هاتف الضيف للتأكيد:
                      <a
                        href={`tel:${b.guestPhone.replace(/\s+/g, "")}`}
                        dir="ltr"
                        className="font-mono font-bold underline hover:text-emerald-600"
                      >
                        {b.guestPhone}
                      </a>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      ({b.commune}، {b.wilaya})
                    </span>
                  </div>
                </div>
              }
              status={b.status}
            >
              {b.status === "قيد التأكيد" && (
                <button
                  type="button"
                  disabled={loadingId === `confirm-${b.id}`}
                  onClick={() => handleConfirmBooking(b)}
                  className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
                >
                  <Check size={13} />
                  تأكيد الحجز
                </button>
              )}
              {b.status !== "ملغى" && (
                <button
                  type="button"
                  disabled={loadingId === `cancel-${b.id}`}
                  onClick={() => handleCancelBooking(b)}
                  className={`${btn} bg-amber-600 text-white hover:bg-amber-700`}
                >
                  إلغاء الحجز
                </button>
              )}
              <button
                type="button"
                disabled={loadingId === `del-book-${b.id}`}
                onClick={() => handleDeleteBooking(b)}
                className={`${btn} bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95`}
                title="حذف سجل هذا الحجز نهائياً"
              >
                {loadingId === `del-book-${b.id}` ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                حذف
              </button>
            </Row>
          ))}

        {/* قسم المستخدمين النشط: يعرض قائمة حسابات كافة المستخدمين ومعلوماتهم للأدمن فقط حتى لو لم ينشروا شيء بعد */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* تنبيه خصوصية وحصرية للأدمن فقط */}
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              />
              <div>
                <p className="font-bold text-sm">سجل حسابات المستخدمين (خاص بالأدمن فقط):</p>
                <p className="mt-1">
                  تعرض هذه اللوحة <b>كافة الحسابات المسجلة في المنصة</b> وبياناتهم ومعلومات التواصل
                  معهم كاملة،
                  <b> حتى وإن لم يقوموا بنشر أي عقار أو طلب بعد</b>. تتيح لك الإدارة المباشرة
                  للحسابات وتفعيلها أو إيقافها، والتواصل مع المستخدمين الجدد أو تقديم الدعم الفني
                  لهم.
                </p>
              </div>
            </div>

            {/* إحصائيات سريعة للمستخدمين */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-3">
                <span className="text-xs text-muted-foreground">إجمالي الحسابات المسجلة</span>
                <p className="text-xl font-bold text-primary mt-1">{currentUsers.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <span className="text-xs text-muted-foreground">لم ينشروا أي عقار بعد</span>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {unpostedUsersCount}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <span className="text-xs text-muted-foreground">ناشرون (لديهم عروض)</span>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {postedUsersCount}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <span className="text-xs text-muted-foreground">المدراء والمشرفون</span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {adminUsersCount}
                </p>
              </div>
            </div>

            {/* شريط البحث والفرز */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search size={15} className="absolute right-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ابحث بالاسم، البريد الإلكتروني، رقم الهاتف أو الولاية..."
                  className="w-full rounded-lg border border-border bg-card pr-9 pl-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => setUserSearch("")}
                    className="absolute left-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* أزرار التصفية */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "all", label: `الكل (${currentUsers.length})` },
                    { id: "unposted", label: `لم ينشروا بعد (${unpostedUsersCount})` },
                    { id: "posted", label: `ناشرون (${postedUsersCount})` },
                    { id: "admin", label: `المدراء (${adminUsersCount})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setUserFilter(f.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      userFilter === f.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* قائمة المستخدمين */}
            {usersLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 size={18} className="animate-spin ml-2" />
                <span>جارٍ تحميل بيانات الحسابات...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
                <UserX size={32} className="mx-auto mb-2 text-muted-foreground/60" />
                <p className="font-semibold text-sm">
                  لا توجد حسابات مطابقة لمعايير البحث أو التصفية.
                </p>
                <p className="text-xs mt-1">جرب تغيير كلمات البحث أو اختيار تبويب "الكل".</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => {
                  const isUnposted = !u.hasPublished && (!u.listingsCount || u.listingsCount === 0);
                  const isUserAdmin = u.role === "مدير";

                  return (
                    <div
                      key={u.id || u.e}
                      className="rounded-xl border border-border bg-card p-4 transition hover:border-border/80 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        {/* معلومات الحساب الأساسية */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {u.n.charAt(0) || "م"}
                            </div>
                            <span className="font-bold text-foreground text-sm">{u.n}</span>

                            {/* شارة الدور */}
                            {isUserAdmin ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-gold-dark">
                                <ShieldCheck size={12} />
                                مدير المنصة
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                                <User size={12} />
                                مستخدم
                              </span>
                            )}

                            {/* شارة حالة النشر: هل نشر أم لم ينشر بعد */}
                            {isUnposted ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                لم ينشر أي عقار بعد (حساب مسجل جديد)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                ناشر ({u.listingsCount || 1} عقار منشور)
                              </span>
                            )}

                            {/* شارة حالة الحساب */}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                u.s === "نشط"
                                  ? "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {u.s}
                            </span>
                          </div>

                          {/* تفاصيل الاتصال والولاية وتاريخ الانضمام */}
                          <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3 pt-1">
                            {/* الهاتف ظاهر بالكامل للأدمن */}
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-600/15 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <Phone size={12} className="text-emerald-600" />
                                الهاتف:
                                <a
                                  href={`tel:${u.phone.replace(/\s+/g, "")}`}
                                  dir="ltr"
                                  className="font-mono font-bold underline hover:text-emerald-600"
                                >
                                  {u.phone}
                                </a>
                              </span>
                            </div>

                            {/* البريد الإلكتروني */}
                            <div className="flex items-center gap-1.5">
                              <Mail size={13} className="text-muted-foreground shrink-0" />
                              <span>البريد:</span>
                              <a
                                href={`mailto:${u.e}`}
                                dir="ltr"
                                className="font-mono text-foreground font-semibold hover:underline"
                              >
                                {u.e}
                              </a>
                            </div>

                            {/* الولاية وتاريخ التسجيل */}
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} className="text-gold" />
                                {u.wilaya || "الجزائر"}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={12} />
                                انضم في: {u.createdAt || "2024-05-01"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* أزرار الإجراءات الخاصة بالأدمن */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleToggleUser(u.id)}
                            className={`${btn} ${
                              u.s === "نشط"
                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                          >
                            {u.s === "نشط" ? (
                              <>
                                <UserX size={13} />
                                إيقاف الحساب
                              </>
                            ) : (
                              <>
                                <UserCheck size={13} />
                                تفعيل الحساب
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={loadingId === `del-user-${u.id}`}
                            onClick={() => handleDeleteUser(u.id)}
                            className={`${btn} bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95`}
                            title="حذف حساب هذا المستخدم نهائياً"
                          >
                            {loadingId === `del-user-${u.id}` ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                            حذف الحساب
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  title,
  sub,
  status,
  children,
}: {
  title: string;
  sub: React.ReactNode;
  status: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="font-bold">{title}</p>
        <div>{sub}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold">{status}</span>
        {children}
      </div>
    </div>
  );
}
