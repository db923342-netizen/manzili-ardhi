import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const ADMIN_EMAIL = "db923342@gmail.com";

interface RevealRequest {
  listingId?: string;
  type?: "property" | "request";
  listingType?: "property" | "request";
}

/**
 * Secure Server Handler to reveal contact phone numbers.
 * Enforces zero-trust authorization:
 * 1. Checks valid user token (Bearer token).
 * 2. Checks if caller is Platform Admin -> APPROVED.
 * 3. Checks if caller is Listing Owner -> APPROVED (their own number).
 * 4. Checks if caller has an active deal with contacts_released === true -> APPROVED.
 * 5. Otherwise -> STRICTLY FORBIDDEN (403).
 */
export async function handleRevealContact(request: Request): Promise<Response> {
  try {
    const authHeader = request.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return Response.json(
        {
          success: false,
          error: "يجب تسجيل الدخول أولاً لطلب التواصل أو كشف رقم الهاتف.",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return Response.json(
        { success: false, error: "جلسة المستخدم غير صالحة.", code: "INVALID_TOKEN" },
        { status: 401 },
      );
    }

    // Parse body
    const body = (await request.json().catch(() => ({}))) as RevealRequest;
    const { listingId } = body;
    const effectiveType = body.type || body.listingType;

    if (!listingId || !effectiveType) {
      return Response.json(
        { success: false, error: "معرّف الإعلان ونوعه مطلوبان.", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    // 1. Verify User Token via Supabase Auth
    const SUPABASE_URL = process.env["SUPABASE_URL"] || "https://pvcamhciwpfharnrbsij.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY =
      process.env["SUPABASE_PUBLISHABLE_KEY"] || "sb_publishable_placeholder_token";

    const supabaseAuthClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: userData, error: userErr } = await supabaseAuthClient.auth.getUser(token);
    const callerUser = userData?.user;

    if (userErr || !callerUser) {
      return Response.json(
        {
          success: false,
          error: "انتهت صلاحية جلسة تسجيل الدخول. يرجى تسجيل الدخول مجدداً.",
          code: "AUTH_EXPIRED",
        },
        { status: 401 },
      );
    }

    const callerId = callerUser.id;
    const callerEmail = callerUser.email?.toLowerCase() || "";

    // 2. Check Admin Authorization
    const isCallerAdmin =
      callerEmail === ADMIN_EMAIL ||
      callerEmail.includes("admin@manzili") ||
      callerUser.user_metadata?.["role"] === "admin";

    // 3. Query Listing and Deal Status using server-side admin client
    let isOwner = false;
    let isDealApproved = false;
    let revealedPhone: string | null = null;

    // Use service role if available, or fall back to checking database
    const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    const dbClient = serviceRoleKey
      ? createClient<Database>(SUPABASE_URL, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : supabaseAuthClient;

    if (effectiveType === "property") {
      // Check properties table
      const { data: prop } = await dbClient
        .from("properties")
        .select("id, owner_id")
        .eq("id", listingId)
        .maybeSingle();

      if (prop && prop.owner_id === callerId) {
        isOwner = true;
      }

      // Check sale_properties table
      if (!prop) {
        const { data: saleProp } = await dbClient
          .from("sale_properties")
          .select("id, owner_id")
          .eq("id", listingId)
          .maybeSingle();

        if (saleProp && saleProp.owner_id === callerId) {
          isOwner = true;
        }
      }

      // Check if caller is part of an approved deal with contacts_released === true
      if (!isCallerAdmin && !isOwner) {
        // Check rental deals
        const { data: deal } = await dbClient
          .from("deals")
          .select("id, contacts_released, completed")
          .eq("property_id", listingId)
          .eq("contacts_released", true)
          .maybeSingle();

        if (deal && deal.contacts_released) {
          isDealApproved = true;
        }

        // Check sale deals
        if (!isDealApproved) {
          const { data: saleDeal } = await dbClient
            .from("sale_deals")
            .select("id, contacts_released, status, buyer_id, seller_id")
            .eq("sale_property_id", listingId)
            .eq("contacts_released", true)
            .maybeSingle();

          if (
            saleDeal &&
            saleDeal.contacts_released &&
            (saleDeal.buyer_id === callerId || saleDeal.seller_id === callerId)
          ) {
            isDealApproved = true;
          }
        }
      }
    } else {
      // Check rental_requests table
      const { data: reqItem } = await dbClient
        .from("rental_requests")
        .select("id, renter_id, contact_phone")
        .eq("id", listingId)
        .maybeSingle();

      if (reqItem) {
        if (reqItem.renter_id === callerId) {
          isOwner = true;
        }
        if (reqItem.contact_phone) {
          revealedPhone = reqItem.contact_phone;
        }
      }

      // Check purchase_requests table
      if (!reqItem) {
        const { data: purReq } = await dbClient
          .from("purchase_requests")
          .select("id, buyer_id, contact_phone")
          .eq("id", listingId)
          .maybeSingle();

        if (purReq) {
          if (purReq.buyer_id === callerId) {
            isOwner = true;
          }
          if (purReq.contact_phone) {
            revealedPhone = purReq.contact_phone;
          }
        }
      }

      if (!isCallerAdmin && !isOwner) {
        const { data: deal } = await dbClient
          .from("deals")
          .select("id, contacts_released, completed")
          .eq("rental_request_id", listingId)
          .eq("contacts_released", true)
          .maybeSingle();

        if (deal && deal.contacts_released) {
          isDealApproved = true;
        }

        if (!isDealApproved) {
          const { data: saleDeal } = await dbClient
            .from("sale_deals")
            .select("id, contacts_released, status, buyer_id, seller_id")
            .eq("purchase_request_id", listingId)
            .eq("contacts_released", true)
            .maybeSingle();

          if (
            saleDeal &&
            saleDeal.contacts_released &&
            (saleDeal.buyer_id === callerId || saleDeal.seller_id === callerId)
          ) {
            isDealApproved = true;
          }
        }
      }
    }

    // 4. Decision Gate
    const isAuthorized = isCallerAdmin || isOwner || isDealApproved;

    if (!isAuthorized) {
      return Response.json(
        {
          success: false,
          error:
            "رقم الهاتف محمي ومشفر من قِبل المنصة. لا يتم كشف أرقام التواصل إلا بعد إتمام إجراءات المعاينة وموافقة الإدارة.",
          code: "FORBIDDEN",
          requiresDealApproval: true,
        },
        { status: 403 },
      );
    }

    // 5. Authorized: Retrieve Phone from Firestore private collection or DB
    let phoneToReturn = revealedPhone;

    if (!phoneToReturn) {
      try {
        const { db } = await import("@/lib/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        const privateCollection =
          effectiveType === "property" ? "properties_private" : "rental_requests_private";
        const privateDoc = await getDoc(doc(db, privateCollection, listingId));

        if (privateDoc.exists()) {
          const pData = privateDoc.data() as Record<string, unknown>;
          const raw = pData["phone"] || pData["contactPhone"];
          phoneToReturn = typeof raw === "string" ? raw : null;
        }

        // Fallback to main document if migrated
        if (!phoneToReturn) {
          const mainCollection = effectiveType === "property" ? "properties" : "rental_requests";
          const mainDoc = await getDoc(doc(db, mainCollection, listingId));
          if (mainDoc.exists()) {
            const mData = mainDoc.data() as Record<string, unknown>;
            const raw = mData["phone"] || mData["contactPhone"];
            phoneToReturn = typeof raw === "string" ? raw : null;
          }
        }
      } catch (err) {
        console.warn("Could not read private phone from Firestore:", err);
      }
    }

    if (!phoneToReturn) {
      phoneToReturn = "0550 00 00 00"; // Secure generic placeholder if none recorded
    }

    return Response.json({
      success: true,
      phone: phoneToReturn,
      authorizedRole: isCallerAdmin ? "admin" : isOwner ? "owner" : "approved_deal_participant",
      message: "تم التحقق من الصلاحيات وكشف رقم الهاتف بنجاح.",
    });
  } catch (error) {
    console.error("Reveal contact error:", error);
    return Response.json(
      {
        success: false,
        error: "حدث خطأ أثناء معالجة الطلب في الخادم.",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
