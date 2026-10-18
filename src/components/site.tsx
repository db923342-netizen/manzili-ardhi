import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Lock, Menu, X, MapPin, BedDouble, Ruler, Home } from "lucide-react";
import { formatDA, wilayas, propertyTypes, type Property, type RentalRequest } from "@/lib/data";

const nav = [
  { to: "/search", label: "العقارات" },
  { to: "/requests", label: "طلبات البحث" },
  { to: "/fees", label: "الرسوم" },
  { to: "/profile", label: "حسابي" },
  { to: "/admin", label: "لوحة المدير" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-deep text-deep-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold text-deep"><Home size={20} /></span>
          منزلي وأرضي
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm opacity-85 hover:text-gold" activeProps={{ className: "text-gold opacity-100" }}>{n.label}</Link>
          ))}
        </nav>
        <div className="hidden gap-2 md:flex">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm hover:text-gold">دخول</Link>
          <Link to="/publish" className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-deep">انشر عقارك</Link>
        </div>
        <button className="md:hidden" aria-label="القائمة" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="flex flex-col gap-1 border-t border-deep-foreground/10 px-4 pb-4 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2">{n.label}</Link>
          ))}
          <Link to="/login" onClick={() => setOpen(false)} className="py-2">تسجيل الدخول</Link>
          <Link to="/publish" onClick={() => setOpen(false)} className="mt-2 rounded-lg bg-gold py-2 text-center font-bold text-deep">انشر عقارك</Link>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-deep py-10 text-deep-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 text-sm md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold text-gold">منزلي وأرضي</p>
          <p className="mt-2 opacity-75">منصة الإيجار العقاري الموثوقة في الجزائر. أرقام الهواتف محمية حتى إتمام الصفقة.</p>
        </div>
        <div className="flex flex-col gap-2 opacity-85">
          <Link to="/search">تصفح العقارات</Link>
          <Link to="/requests">طلبات البحث</Link>
          <Link to="/request-new">انشر طلب بحث</Link>
        </div>
        <div className="flex flex-col gap-2 opacity-85">
          <Link to="/fees">الرسوم والأسعار</Link>
          <Link to="/register">إنشاء حساب</Link>
          <p className="opacity-60">© 2026 منزلي وأرضي</p>
        </div>
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

export const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btnPrimary = "rounded-lg bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:opacity-90";
export const btnGold = "rounded-lg bg-gold px-5 py-2.5 font-bold text-deep hover:opacity-90";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm font-medium">{label}</span>{children}</label>;
}

export function WilayaCommune({ wilaya, setWilaya }: { wilaya: string; setWilaya: (w: string) => void }) {
  return (
    <>
      <Field label="الولاية">
        <select className={inputCls} value={wilaya} onChange={(e) => setWilaya(e.target.value)}>
          <option value="">اختر الولاية</option>
          {Object.keys(wilayas).map((w) => <option key={w}>{w}</option>)}
        </select>
      </Field>
      <Field label="البلدية">
        <select className={inputCls} disabled={!wilaya}>
          <option value="">اختر البلدية</option>
          {(wilayas[wilaya] ?? []).map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
    </>
  );
}

export function TypeSelect() {
  return (
    <Field label="نوع العقار">
      <select className={inputCls}>{propertyTypes.map((t) => <option key={t}>{t}</option>)}</select>
    </Field>
  );
}

export function PropertyCard({ p }: { p: Property }) {
  return (
    <Link to="/property/$id" params={{ id: p.id }} className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        <span className="absolute right-3 top-3 rounded-full bg-deep px-3 py-1 text-xs text-deep-foreground">{p.type}</span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-bold">{p.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={14} />{p.commune}، {p.wilaya}</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BedDouble size={14} />{p.rooms} غرف</span>
          <span className="flex items-center gap-1"><Ruler size={14} />{p.area} م²</span>
        </div>
        <p className="font-display text-lg font-bold text-primary">{formatDA(p.price)} <span className="text-xs font-normal text-muted-foreground">/ شهر</span></p>
      </div>
    </Link>
  );
}

export function RequestCard({ r }: { r: RentalRequest }) {
  return (
    <Link to="/request/$id" params={{ id: r.id }} className="block rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-full bg-gold-soft px-3 py-1 font-medium">{r.type}</span>
        <span className="text-muted-foreground">{r.date}</span>
      </div>
      <h3 className="mt-3 font-bold">{r.title}</h3>
      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={14} />{r.commune}، {r.wilaya}</p>
      <p className="mt-3 text-sm">الميزانية: <b className="text-primary">{formatDA(r.budget)}</b></p>
    </Link>
  );
}

export function HiddenPhone() {
  return (
    <div className="rounded-xl border border-dashed border-gold bg-gold-soft p-4">
      <p className="flex items-center gap-2 font-bold"><Lock size={16} /> رقم الهاتف: 0X XX XX XX XX</p>
      <p className="mt-1 text-sm text-muted-foreground">رقم الهاتف مخفي لحمايتك. يظهر بعد إتمام الصفقة ودفع الرسوم وموافقة المدير.</p>
    </div>
  );
}
