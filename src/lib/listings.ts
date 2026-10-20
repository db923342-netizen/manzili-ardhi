import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero.jpg";
import type { Property, RentalRequest } from "@/lib/data";

type Row = { id?: unknown; property_type?: unknown; wilaya?: unknown; municipality?: unknown; monthly_rent?: unknown; rooms?: unknown; area_m2?: unknown; description?: unknown; status?: unknown; budget?: unknown; specifications?: unknown; created_at?: unknown };

// Real listings only — read from the public (phone-free) database views.
const typeLabels: Record<string, string> = {
  housing: "سكن", apartment: "شقة", villa: "فيلا", house: "منزل", land: "أرض",
  shop: "محل تجاري", office: "مكتب", studio: "استوديو",
};
const label = (t: unknown) => typeLabels[String(t ?? "")] ?? String(t ?? "عقار");
const statusLabel = (s: unknown): Property["status"] =>
  s === "rented" ? "مؤجر" : s === "pending" ? "قيد المراجعة" : "نشط";

function toProperty(row: Row): Property {
  const type = label(row.property_type);
  return {
    id: String(row.id), title: `${type} للإيجار`, type,
    wilaya: String(row.wilaya ?? ""), commune: String(row.municipality ?? ""),
    price: Number(row.monthly_rent ?? 0), rooms: Number(row.rooms ?? 0), area: Number(row.area_m2 ?? 0),
    description: String(row.description ?? ""), owner: "مخفي", status: statusLabel(row.status), image: hero,
  };
}

function toRequest(row: Row): RentalRequest {
  const type = label(row.property_type);
  return {
    id: String(row.id), title: `مطلوب ${type}`, type,
    wilaya: String(row.wilaya ?? ""), commune: String(row.municipality ?? ""),
    budget: Number(row.budget ?? 0), rooms: Number(row.rooms ?? 0),
    details: String(row.specifications ?? ""), author: "مخفي",
    date: String(row.created_at ?? "").slice(0, 10),
  };
}

export const propertiesQuery = queryOptions({
  queryKey: ["public_properties"],
  queryFn: async () => {
    const { data, error } = await supabase.from("public_properties").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("تعذر تحميل العقارات من قاعدة البيانات.");
    return (data ?? []).map((r) => toProperty(r as Row));
  },
});

export const requestsQuery = queryOptions({
  queryKey: ["public_rental_requests"],
  queryFn: async () => {
    const { data, error } = await supabase.from("public_rental_requests").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("تعذر تحميل الطلبات من قاعدة البيانات.");
    return (data ?? []).map((r) => toRequest(r as Row));
  },
});
