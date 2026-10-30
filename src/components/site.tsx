import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, checkIsAdmin } from "@/lib/auth";
import { useState, useMemo, type ReactNode } from "react";
import { Lock, Menu, X, MapPin, BedDouble, Ruler, Home, Phone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDA,
  wilayas,
  wilayasList,
  getCommunesForWilaya,
  findWilaya,
  normalizeWilayaName,
  propertyTypes,
  type Property,
  type RentalRequest,
} from "@/lib/data";

const nav = [
  { to: "/search", label: "العقارات" },
  { to: "/temporary-rentals", label: "كراء شقق مؤقتة", badge: "24 سا" },
  { to: "/requests", label: "طلبات البحث" },
  { to: "/fees", label: "الرسوم" },
  { to: "/profile", label: "حسابي" },
  { to: "/admin", label: "لوحة المدير" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: isAdmin } = useQuery({
    queryKey: ["is_admin", user?.id],
    queryFn: checkIsAdmin,
    enabled: !!user,
  });
  const links = nav.filter((n) => n.to !== "/admin" || (user && isAdmin));
  async function signOut() {
    setOpen(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }
  const authLink = user ? (
    <button onClick={signOut} className="rounded-lg px-4 py-2 text-sm hover:text-gold">
      تسجيل الخروج
    </button>
  ) : (
    <Link
      to="/login"
      onClick={() => setOpen(false)}
      className="rounded-lg px-4 py-2 text-sm hover:text-gold"
    >
      دخول
    </Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-deep text-deep-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
          <img
            src="/assets/icon-circle.png"
            alt="شعار منزلي وأرضي"
            className="h-10 w-10 shrink-0 rounded-full border border-gold/40 shadow-sm object-cover"
          />
          <span>منزلي وأرضي</span>
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {links.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm opacity-85 hover:text-gold flex items-center gap-1.5 transition"
              activeProps={{ className: "text-gold opacity-100 font-bold" }}
            >
              <span>{n.label}</span>
              {"badge" in n && n.badge && (
                <span className="rounded-full bg-gold/20 border border-gold/40 px-1.5 py-0.2 text-[10px] font-black text-gold">
                  {n.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="hidden gap-2 md:flex">
          {authLink}
          <Link to="/publish" className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-deep">
            انشر عقارك
          </Link>
        </div>
        <button className="md:hidden" aria-label="القائمة" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-1 border-t border-deep-foreground/10 px-4 pb-4 md:hidden">
          {links.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="py-2 flex items-center justify-between"
            >
              <span>{n.label}</span>
              {"badge" in n && n.badge && (
                <span className="rounded-full bg-gold/20 border border-gold/40 px-1.5 py-0.5 text-[10px] font-black text-gold">
                  {n.badge}
                </span>
              )}
            </Link>
          ))}
          <div className="-mx-4">{authLink}</div>
          <Link
            to="/publish"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-lg bg-gold py-2 text-center font-bold text-deep"
          >
            انشر عقارك
          </Link>
        </div>
      )}
    </header>
  );
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function TelegramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-2.82 2.35z" />
    </svg>
  );
}

const devContacts = [
  {
    key: "phone",
    label: "اتصال هاتفي",
    value: "+213 698 832 884",
    href: "tel:+213698832884",
    badge: "bg-gold text-deep",
    Icon: Phone,
    external: false,
  },
  {
    key: "whatsapp",
    label: "واتساب",
    value: "+213 698 832 884",
    href: "https://wa.me/213698832884",
    badge: "bg-primary text-primary-foreground",
    Icon: WhatsAppIcon,
    external: true,
  },
  {
    key: "telegram",
    label: "تلغرام",
    value: "@abdelwahabe_s",
    href: "https://t.me/abdelwahabe_s",
    badge: "bg-telegram text-telegram-foreground",
    Icon: TelegramIcon,
    external: true,
  },
] as const;

export function DeveloperSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
        <h2 className="font-display text-lg font-bold text-primary">تطوير وبرمجة المنصة</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          للتواصل المباشر مع فريق تطوير المنصة عبر الهاتف أو واتساب أو تلغرام.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {devContacts.map(({ key, label, value, href, badge, Icon, external }) => (
            <a
              key={key}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-3 transition hover:-translate-y-0.5 hover:border-gold"
            >
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", badge)}>
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{label}</span>
                <span dir="ltr" className="block truncate text-right text-xs text-muted-foreground">
                  {value}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-deep text-deep-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-10 text-sm md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/assets/icon-circle.png"
              alt="شعار منزلي وأرضي"
              className="h-11 w-11 shrink-0 rounded-full border border-gold/40 shadow-sm object-cover"
            />
            <div>
              <p className="font-display text-lg font-bold text-gold">منزلي وأرضي</p>
              <p className="text-xs opacity-60" dir="ltr">
                Manzili &amp; Ardhi
              </p>
            </div>
          </div>
          <p className="mt-3 opacity-75 leading-relaxed">
            منصة الإيجار العقاري الموثوقة لكراء العقارات والأراضي في الجزائر. أرقام الهواتف محمية
            حتى إتمام الصفقة.
          </p>
        </div>
        <div className="flex flex-col gap-2 opacity-85">
          <Link to="/search">تصفح العقارات</Link>
          <Link to="/requests">طلبات البحث</Link>
          <Link to="/request-new">انشر طلب بحث</Link>
        </div>
        <div className="flex flex-col gap-2 opacity-85">
          <Link to="/fees">الرسوم والأسعار</Link>
          <Link to="/register">إنشاء حساب</Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="border-t border-deep-foreground/10 pt-5 text-center text-xs opacity-70">
          © 2026 منزلي وأرضي — جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="bg-deep pb-10 pt-8 text-deep-foreground">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {sub && <p className="mt-2 opacity-75">{sub}</p>}
      </div>
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btnPrimary =
  "rounded-lg bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:opacity-90";
export const btnGold = "rounded-lg bg-gold px-5 py-2.5 font-bold text-deep hover:opacity-90";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function WilayaCommune({
  wilaya,
  setWilaya,
  commune,
  setCommune,
  allOption = false,
  required = false,
  disabled = false,
}: {
  wilaya: string;
  setWilaya: (w: string) => void;
  commune?: string;
  setCommune?: (c: string) => void;
  allOption?: boolean;
  required?: boolean;
  disabled?: boolean;
}) {
  const [customMode, setCustomMode] = useState(false);

  // Normalize wilaya: handles code "16", arabic "الجزائر", latin "Alger", composite "16 - الجزائر"
  const currentWilayaObj = useMemo(() => findWilaya(wilaya), [wilaya]);
  const activeWilayaName = currentWilayaObj ? currentWilayaObj.nameAr : normalizeWilayaName(wilaya);

  // Official communes for the selected wilaya
  const baseCommunes = useMemo(
    () => (activeWilayaName ? getCommunesForWilaya(activeWilayaName) : []),
    [activeWilayaName],
  );

  // Ensure any current commune value is always present in the options list so it never renders blank
  const displayCommunes = useMemo(() => {
    const list = [...baseCommunes];
    const trimmed = (commune ?? "").trim();
    if (trimmed && trimmed !== "__custom__" && !list.includes(trimmed)) {
      list.unshift(trimmed);
    }
    return list;
  }, [baseCommunes, commune]);

  const handleWilayaChange = (val: string) => {
    setWilaya(val);
    setCommune?.("");
    setCustomMode(false);
  };

  const isCustom = customMode || (!!commune && !baseCommunes.includes(commune) && commune !== "");

  return (
    <>
      <Field label="الولاية (69 ولاية)">
        <select
          className={inputCls}
          value={activeWilayaName}
          required={required}
          disabled={disabled}
          onChange={(e) => handleWilayaChange(e.target.value)}
        >
          <option value="">
            {allOption ? "كل الولايات (01 إلى 69)" : "اختر الولاية (01 إلى 69)"}
          </option>
          {wilayasList.map((w) => (
            <option key={w.code} value={w.nameAr}>
              {w.code} - {w.nameAr}
            </option>
          ))}
        </select>
      </Field>

      <Field label="البلدية">
        {isCustom ? (
          <div className="space-y-1">
            <div className="relative flex items-center">
              <input
                type="text"
                required={required && !allOption}
                className={`${inputCls} pl-16`}
                placeholder={
                  activeWilayaName
                    ? `اكتب اسم بلدية في ${activeWilayaName}...`
                    : "اكتب اسم البلدية أو الحي..."
                }
                value={commune ?? ""}
                onChange={(e) => setCommune?.(e.target.value)}
                disabled={disabled || (!activeWilayaName && !allOption)}
              />
              <button
                type="button"
                onClick={() => {
                  setCustomMode(false);
                  setCommune?.(baseCommunes[0] || "");
                }}
                className="absolute left-2.5 rounded bg-secondary px-2 py-1 text-xs font-bold text-primary hover:bg-gold hover:text-deep transition cursor-pointer"
                title="الرجوع إلى القائمة المنسدلة"
              >
                قائمة
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
              <span>كتابة بلدية أو حي يدوياً</span>
              <button
                type="button"
                onClick={() => {
                  setCustomMode(false);
                  setCommune?.("");
                }}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                العودة للقائمة المنسدلة ←
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <select
              className={inputCls}
              value={commune ?? ""}
              required={required && !allOption && !!activeWilayaName}
              disabled={disabled || (!activeWilayaName && !allOption)}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__custom__") {
                  setCustomMode(true);
                  setCommune?.("");
                } else {
                  setCommune?.(val);
                }
              }}
            >
              <option value="">
                {!activeWilayaName
                  ? allOption
                    ? "كل البلديات (اختر ولاية أولاً)"
                    : "اختر الولاية أولاً"
                  : allOption
                    ? `كل بلديات ${activeWilayaName}`
                    : `اختر بلدية من ${activeWilayaName}`}
              </option>
              {displayCommunes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {activeWilayaName && (
                <option value="__custom__">✏️ بلدية أو حي آخر (كتابة يدوية)...</option>
              )}
            </select>
            {activeWilayaName && (
              <p className="text-[11px] text-muted-foreground px-0.5 flex items-center justify-between">
                <span>
                  {displayCommunes.length > 0
                    ? `${displayCommunes.length} بلدية متوفرة`
                    : "قائمة البلديات"}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomMode(true)}
                  className="font-bold text-primary hover:underline hover:text-gold transition cursor-pointer"
                >
                  كتابة يدوية ✏️
                </button>
              </p>
            )}
          </div>
        )}
      </Field>
    </>
  );
}

export function TypeSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
} = {}) {
  return (
    <Field label="نوع العقار">
      <select className={inputCls} value={value} onChange={onChange}>
        {propertyTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function PropertyCard({ p }: { p: Property }) {
  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full bg-deep px-3 py-1 text-xs text-deep-foreground">
          {p.type}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-bold">{p.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin size={14} />
          {p.commune}، {p.wilaya}
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BedDouble size={14} />
            {p.rooms} غرف
          </span>
          <span className="flex items-center gap-1">
            <Ruler size={14} />
            {p.area} م²
          </span>
        </div>
        <p className="font-display text-lg font-bold text-primary">
          {formatDA(p.price)}{" "}
          <span className="text-xs font-normal text-muted-foreground">/ شهر</span>
        </p>
      </div>
    </Link>
  );
}

export function RequestCard({ r }: { r: RentalRequest }) {
  return (
    <Link
      to="/request/$id"
      params={{ id: r.id }}
      className="block rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-1"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-full bg-gold-soft px-3 py-1 font-medium">{r.type}</span>
        <span className="text-muted-foreground">{r.date}</span>
      </div>
      <h3 className="mt-3 font-bold">{r.title}</h3>
      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin size={14} />
        {r.commune}، {r.wilaya}
      </p>
      <p className="mt-3 text-sm">
        السعر: <b className="text-primary">{formatDA(r.budget)}</b>
      </p>
    </Link>
  );
}

export function HiddenPhone({
  label = "رقم هاتف صاحب العقار",
  phone,
  isAdmin = false,
}: {
  label?: string | undefined;
  phone?: string | undefined;
  isAdmin?: boolean | undefined;
}) {
  if (isAdmin && phone) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-card-foreground">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
            <Phone size={15} className="text-emerald-600 dark:text-emerald-400" />
            {label}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck size={13} /> غير مخفي عن الأدمن
          </span>
        </div>
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          className="mt-2 block font-mono text-xl font-bold tracking-wider text-emerald-700 hover:underline dark:text-emerald-300"
          dir="ltr"
          title="الاتصال المباشر بالرقم"
        >
          {phone}
        </a>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          هذا الرقم ظاهر لك بصفتك مسؤول المنصة. وهو مخفي تماماً ومشفر عن المستخدمين العاديين لحماية
          الخصوصية.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-gold bg-gold-soft p-4 text-card-foreground">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold text-deep">
          <Phone size={15} className="text-primary" />
          {label}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-deep/10 px-2 py-0.5 text-xs font-semibold text-deep">
          <Lock size={12} /> محمي ومشفر
        </span>
      </div>
      <p className="mt-2 font-mono text-lg font-bold tracking-widest text-primary" dir="ltr">
        0X •• •• •• ••
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        رقم الهاتف مخفي لحماية خصوصية المستخدمين فيما بينهم. يتم كشف الرقم للطرف الآخر فقط بعد إتمام
        الصفقة وموافقة الإدارة.
      </p>
    </div>
  );
}
