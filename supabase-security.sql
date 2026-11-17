-- ==============================================================================
-- تطبيق «منزلي وأرضي» — حزمة الأمان وسياسات RLS لحماية أرقام الهواتف وبيانات العقود
-- ملف للمراجعة فقط: لا يتم تنفيذه تلقائياً دون موافقة الإدارة
-- ==============================================================================

-- 1. التأكد من تفعيل RLS على كافة الجداول الحساسة
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. دالة مساعدة للتحقق من هوية مسؤول المنصة (Admin)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') = 'db923342@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ),
    false
  );
$$;

-- 3. سياسات جدول العقارات (properties)
DROP POLICY IF EXISTS "Public can view approved properties" ON public.properties;
CREATE POLICY "Public can view approved properties"
ON public.properties FOR SELECT
USING (status = 'approved' OR owner_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Authenticated users can create properties" ON public.properties;
CREATE POLICY "Authenticated users can create properties"
ON public.properties FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (owner_id = auth.uid() OR public.is_platform_admin())
);

DROP POLICY IF EXISTS "Owners and admins can update properties" ON public.properties;
CREATE POLICY "Owners and admins can update properties"
ON public.properties FOR UPDATE
USING (owner_id = auth.uid() OR public.is_platform_admin())
WITH CHECK (owner_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Owners and admins can delete properties" ON public.properties;
CREATE POLICY "Owners and admins can delete properties"
ON public.properties FOR DELETE
USING (owner_id = auth.uid() OR public.is_platform_admin());

-- 4. سياسات جدول الطلبات (rental_requests)
DROP POLICY IF EXISTS "Public can view approved rental requests" ON public.rental_requests;
CREATE POLICY "Public can view approved rental requests"
ON public.rental_requests FOR SELECT
USING (status = 'approved' OR renter_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Authenticated users can create rental requests" ON public.rental_requests;
CREATE POLICY "Authenticated users can create rental requests"
ON public.rental_requests FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (renter_id = auth.uid() OR public.is_platform_admin())
);

DROP POLICY IF EXISTS "Renters and admins can update rental requests" ON public.rental_requests;
CREATE POLICY "Renters and admins can update rental requests"
ON public.rental_requests FOR UPDATE
USING (renter_id = auth.uid() OR public.is_platform_admin())
WITH CHECK (renter_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Renters and admins can delete rental requests" ON public.rental_requests;
CREATE POLICY "Renters and admins can delete rental requests"
ON public.rental_requests FOR DELETE
USING (renter_id = auth.uid() OR public.is_platform_admin());

-- 5. سياسات جدول الصفقات (deals)
DROP POLICY IF EXISTS "Parties and admins can view deals" ON public.deals;
CREATE POLICY "Parties and admins can view deals"
ON public.deals FOR SELECT
USING (
  public.is_platform_admin()
  OR owner_id = auth.uid()
  OR renter_id = auth.uid()
);

-- لا يمكن لغير الإدارة تعديل حقل contacts_released
DROP POLICY IF EXISTS "Only admins can update deal approvals" ON public.deals;
CREATE POLICY "Only admins can update deal approvals"
ON public.deals FOR UPDATE
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- 6. الدالة الأمنية لكشف رقم الهاتف عبر الخادم حصراً (Secure Contact Reveal)
CREATE OR REPLACE FUNCTION public.reveal_listing_contact(
  p_listing_id UUID,
  p_listing_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_phone TEXT;
  v_owner_id UUID;
  v_deal_released BOOLEAN := false;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'يجب تسجيل الدخول للتحقق من الصلاحيات');
  END IF;

  v_is_admin := public.is_platform_admin();

  -- فحص نوع الإعلان
  IF p_listing_type = 'property' THEN
    SELECT owner_id INTO v_owner_id FROM public.properties WHERE id = p_listing_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'العقار غير موجود');
    END IF;

    -- إذا كان الطالب هو الأدمن أو صاحب العقار نفسه
    IF v_is_admin OR v_owner_id = v_caller_id THEN
      -- استخراج الرقم
      SELECT phone INTO v_phone FROM public.profiles WHERE id = v_owner_id;
      RETURN jsonb_build_object('success', true, 'phone', v_phone, 'reason', CASE WHEN v_is_admin THEN 'admin' ELSE 'owner' END);
    END IF;

    -- التحقق من وجود صفقة معتمدة وحقل contacts_released = true
    SELECT EXISTS (
      SELECT 1 FROM public.deals
      WHERE property_id = p_listing_id
        AND (renter_id = v_caller_id OR owner_id = v_caller_id)
        AND contacts_released = TRUE
        AND status IN ('approved', 'completed')
    ) INTO v_deal_released;

    IF v_deal_released THEN
      SELECT phone INTO v_phone FROM public.profiles WHERE id = v_owner_id;
      RETURN jsonb_build_object('success', true, 'phone', v_phone, 'reason', 'deal_approved');
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'غير مصرح. يتطلب كشف الرقم موافقة الإدارة وتوثيق صفقة رسمية');
    END IF;

  ELSIF p_listing_type = 'request' THEN
    SELECT renter_id, contact_phone INTO v_owner_id, v_phone FROM public.rental_requests WHERE id = p_listing_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'الطلب غير موجود');
    END IF;

    IF v_is_admin OR v_owner_id = v_caller_id THEN
      RETURN jsonb_build_object('success', true, 'phone', v_phone, 'reason', CASE WHEN v_is_admin THEN 'admin' ELSE 'owner' END);
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.deals
      WHERE request_id = p_listing_id
        AND (renter_id = v_caller_id OR owner_id = v_caller_id)
        AND contacts_released = TRUE
        AND status IN ('approved', 'completed')
    ) INTO v_deal_released;

    IF v_deal_released THEN
      RETURN jsonb_build_object('success', true, 'phone', v_phone, 'reason', 'deal_approved');
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'غير مصرح. يتطلب كشف الرقم موافقة الإدارة وتوثيق صفقة رسمية');
    END IF;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'نوع الإعلان غير صالح');
  END IF;
END;
$$;
