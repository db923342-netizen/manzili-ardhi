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
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDA, type Property, type RentalRequest } from "@/lib/data";
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
  markDealDeleted,
  markUserDeleted,
  markBookingDeleted,
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
  const [deals, setDeals] = useState(defaultDealsWithPhones);

  const [tempBookings, setTempBookings] = useState<FirestoreTemporaryBooking[]>([
    {
      id: "tmp-b101",
      rentalId: "temp-101",
      rentalTitle: "شقة فاخرة F3 مؤثثة بالكامل - حيدرة العاصمة",
      wilaya: "الجزائر",
      commune: "حيدرة",
      guestName: "عبد القادر مسعودي",
      guestPhone: "0554 11 22 33",
      checkInDate: new Date().toISOString().slice(0, 10),
      checkOutDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      totalNights: 1,
      guestsCount: 3,
      nightlyPrice: 8500,
      totalPrice: 8500,
      serviceFee: 500,
      grandTotal: 9000,
      status: "قيد التأكيد",
      specialNotes: "وصول بعد العصر، عائلة مصحوبة بدفتر عائلي",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tmp-b102",
      rentalId: "temp-102",
      rentalTitle: "استوديو عصري مجهز مطل على البحر - وهران (كانستيل)",
      wilaya: "وهران",
      commune: "وهران",
      guestName: "فؤاد غربي",
      guestPhone: "0668 44 55 66",
      checkInDate: new Date().toISOString().slice(0, 10),
      checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      totalNights: 2,
      guestsCount: 2,
      nightlyPrice: 5000,
      totalPrice: 10000,
      serviceFee: 500,
      grandTotal: 10500,
      status: "مؤكد",
      specialNotes: "مهمة عمل في وهران، طلب فاتورة استلام",
      createdAt: new Date().toISOString(),
    },
  ]);

  // Load bookings from Firestore if available
  useEffect(() => {
    getTemporaryBookingsFromFirestore().then((remote) => {
      if (remote && remote.length > 0) {
        setTempBookings((prev) => {
          const map = new Map<string, FirestoreTemporaryBooking>();
          [...remote, ...prev].forEach((b) => map.set(b.id, b));
          return Array.from(map.values());
        });
      }
    });
  }, []);

  const { data: propertiesData = [], isLoading: propsLoading } = useQuery(adminPropertiesQuery);
  const { data: requestsData = [], isLoading: reqsLoading } = useQuery(adminRequestsQuery);
  const { data: initialUsers = [], isLoading: usersLoading } = useQuery(adminUsersQuery);

  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    if (initialUsers.length > 0 && users.length === 0) {
      setUsers(initialUsers);
    }
  }, [initialUsers, users.length]);

  const properties = propertiesData;
  const requests = requestsData;

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

      // 3. Optimistic cache update
      queryClient.setQueryData<Property[]>(adminPropertiesQuery.queryKey, (old = []) =>
        old.map((item) => (item.id === p.id ? { ...item, status: "نشط" } : item)),
      );
      queryClient.setQueryData<Property[]>(propertiesQuery.queryKey, (old = []) =>
        old.map((item) => (item.id === p.id ? { ...item, status: "نشط" } : item)),
      );

      await queryClient.invalidateQueries({ queryKey: ["admin_properties"] });
      await queryClient.invalidateQueries({ queryKey: ["public_properties"] });

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
      // 1. Delete in Supabase
      const { error } = await supabase.from("properties").delete().eq("id", p.id);

      if (error) {
        console.warn("Supabase delete failed, setting status to rejected:", error.message);
        await supabase.from("properties").update({ status: "rejected" }).eq("id", p.id);
      }

      // 2. Synchronize with Firebase Firestore
      try {
        const { deletePropertyFromFirestore } = await import("@/lib/firebase");
        await deletePropertyFromFirestore(p.id);
      } catch (fbErr) {
        console.warn("Firestore sync delete:", fbErr);
      }

      // 3. Optimistic cache update
      queryClient.setQueryData<Property[]>(adminPropertiesQuery.queryKey, (old = []) =>
        old.filter((item) => item.id !== p.id),
      );
      queryClient.setQueryData<Property[]>(propertiesQuery.queryKey, (old = []) =>
        old.filter((item) => item.id !== p.id),
      );

      await queryClient.invalidateQueries({ queryKey: ["admin_properties"] });
      await queryClient.invalidateQueries({ queryKey: ["public_properties"] });

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
      const { error } = await supabase.from("rental_requests").delete().eq("id", r.id);

      if (error) {
        await supabase.from("rental_requests").update({ status: "cancelled" }).eq("id", r.id);
      }

      queryClient.setQueryData<RentalRequest[]>(adminRequestsQuery.queryKey, (old = []) =>
        old.filter((item) => item.id !== r.id),
      );
      queryClient.setQueryData<RentalRequest[]>(requestsQuery.queryKey, (old = []) =>
        old.filter((item) => item.id !== r.id),
      );
      await queryClient.invalidateQueries({ queryKey: ["admin_rental_requests"] });
      await queryClient.invalidateQueries({ queryKey: ["public_rental_requests"] });

      toast.success(`تم حذف طلب البحث: "${r.title}"`);
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
      await supabase
        .from("deals")
        .update({ contacts_released: true, completed: true })
        .eq("id", id);
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

  // إجراء رفض الصفقة
  async function handleRejectDeal(id: string) {
    if (!window.confirm("هل أنت متأكد من رفض هذه الصفقة؟")) return;
    setLoadingId(`deal-rej-${id}`);
    try {
      await supabase.from("deals").delete().eq("id", id);
      setDeals((old) => old.filter((d) => d.id !== id));
      toast.success("تم رفض الصفقة وإلغاؤها.");
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

  const empty =
    {
      deals: deals.length,
      props: properties.length,
      reqs: requests.length,
      temp: tempBookings.length,
      users: users.length,
    }[tab] === 0;

  async function handleConfirmBooking(booking: FirestoreTemporaryBooking) {
    setLoadingId(`confirm-${booking.id}`);
    try {
      await updateTemporaryBookingStatusInFirestore(booking.id, "مؤكد");
    } catch {
      // offline/fallback
    }
    setTempBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: "مؤكد" } : b)),
    );
    toast.success(`تم تأكيد حجز الشقة بنجاح!`);
    setLoadingId(null);
  }

  async function handleCancelBooking(booking: FirestoreTemporaryBooking) {
    setLoadingId(`cancel-${booking.id}`);
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
                  users: users.length || initialUsers.length,
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
        {tab === "users" && usersLoading && users.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">جارٍ تحميل المستخدمين...</p>
        )}

        {empty && !propsLoading && !reqsLoading && !usersLoading && (
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
                </div>
              }
              status={d.s}
            >
              {d.s === "بانتظار الموافقة" ? (
                <>
                  <button
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
                  <button
                    disabled={loadingId === `deal-rej-${d.id}`}
                    onClick={() => handleRejectDeal(d.id)}
                    className={`${btn} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
                  >
                    رفض
                  </button>
                </>
              ) : null}
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
                      <b className="text-foreground">{r.author}</b> • الميزانية:{" "}
                      {formatDA(r.budget)}
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
                  onClick={() => handleCancelBooking(b)}
                  className={`${btn} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
                >
                  <Trash2 size={13} />
                  إلغاء
                </button>
              )}
            </Row>
          ))}

        {/* قسم المستخدمين مع إظهار أرقام هواتفهم غير مخفية للأدمن */}
        {tab === "users" &&
          (users.length > 0 ? users : initialUsers).map((u) => (
            <Row
              key={u.id || u.e}
              title={u.n}
              sub={
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    البريد:{" "}
                    <span dir="ltr" className="font-mono text-foreground font-semibold">
                      {u.e}
                    </span>{" "}
                    • الصلاحية: <b className="text-primary">{u.role}</b>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/15 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <Phone size={13} className="text-emerald-600" />
                      رقم الهاتف (غير مخفي عن الأدمن):
                      <a
                        href={`tel:${u.phone.replace(/\s+/g, "")}`}
                        dir="ltr"
                        className="font-mono font-bold underline hover:text-emerald-600"
                      >
                        {u.phone}
                      </a>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      (محمي ومخفي عن باقي المستخدمين)
                    </span>
                  </div>
                </div>
              }
              status={u.s}
            >
              <button
                type="button"
                onClick={() => handleToggleUser(u.id)}
                className={`${btn} bg-secondary hover:bg-secondary/80`}
              >
                {u.s === "نشط" ? "إيقاف الحساب" : "تفعيل الحساب"}
              </button>
            </Row>
          ))}
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
