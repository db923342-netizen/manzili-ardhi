import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, user: session?.user ?? null, ready };
}

/** Admin status comes only from the database function is_admin(). */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("is_admin");
    return !error && data === true;
  } catch {
    return false;
  }
}

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    checkIsAdmin()
      .then((res) => {
        if (mounted) {
          setIsAdmin(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { isAdmin, loading };
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeRedirect(path: unknown): string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    ? path
    : "/profile";
}

export function arabicAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (m.includes("email not confirmed"))
    return "يرجى تأكيد بريدك الإلكتروني أولًا عبر الرابط المرسل إليك.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "هذا البريد الإلكتروني مسجّل مسبقًا. سجّل الدخول بدلًا من ذلك.";
  if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("weak")))
    return "كلمة المرور ضعيفة: يجب أن تتكون من 6 أحرف على الأقل.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "محاولات كثيرة. يرجى الانتظار قليلًا ثم المحاولة مجددًا.";
  if (m.includes("invalid") && m.includes("email")) return "صيغة البريد الإلكتروني غير صحيحة.";
  if (m.includes("signup") && m.includes("disabled")) return "التسجيل غير متاح حاليًا.";
  return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
}

// التعبير المنظم (Regex) الصحيح للتحقق من الإيميل والسماح بالنقطة بعد @
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeEmail(rawEmail: string): string {
  return rawEmail.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, "").trim();
}

export function isValidEmail(email: string): boolean {
  return emailRegex.test(sanitizeEmail(email));
}
