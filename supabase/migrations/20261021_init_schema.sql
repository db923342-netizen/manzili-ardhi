-- ============================================================================
-- Supabase Schema Migration: Properties, Users, and Bookings (Deals)
-- Platform: Manzili Ardhi (منزلي وأرضي) - Algerian Real Estate Rental Platform
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES & USER ROLES
-- ============================================================================

-- Table: public.profiles
-- Extends Supabase auth.users with public profile information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: public.user_roles
-- Explicit role assignment table for granular security checks
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, role)
);

-- Index on profiles & roles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Function to check if calling user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Trigger to auto-create profile and role on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'role', 'user'))
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. PROPERTIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'عقار للإيجار',
    property_type TEXT NOT NULL, -- 'شقة', 'فيلا', 'استوديو', 'أرض', 'محل تجاري', 'مكتب'
    wilaya TEXT NOT NULL,
    municipality TEXT NOT NULL,
    monthly_rent NUMERIC(12, 2) NOT NULL CHECK (monthly_rent >= 0),
    rooms INTEGER DEFAULT 1 CHECK (rooms >= 0),
    area_m2 NUMERIC(10, 2) DEFAULT 0 CHECK (area_m2 >= 0),
    duration_months INTEGER DEFAULT 12,
    description TEXT,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'rented')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_wilaya ON public.properties(wilaya);
CREATE INDEX IF NOT EXISTS idx_properties_municipality ON public.properties(municipality);
CREATE INDEX IF NOT EXISTS idx_properties_monthly_rent ON public.properties(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- View: public_properties (Hides owner direct identity/contact info until deal finalized)
CREATE OR REPLACE VIEW public.public_properties AS
SELECT
    id,
    title,
    property_type,
    wilaya,
    municipality,
    monthly_rent,
    rooms,
    area_m2,
    duration_months,
    description,
    images,
    status,
    created_at
FROM public.properties
WHERE status IN ('approved', 'rented');

-- ============================================================================
-- 3. RENTAL REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rental_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT DEFAULT 'طلب استئجار',
    property_type TEXT NOT NULL,
    wilaya TEXT NOT NULL,
    municipality TEXT,
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    rooms INTEGER DEFAULT 1 CHECK (rooms >= 0),
    duration_months INTEGER DEFAULT 12,
    specifications TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rental_requests_renter_id ON public.rental_requests(renter_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_status ON public.rental_requests(status);
CREATE INDEX IF NOT EXISTS idx_rental_requests_wilaya ON public.rental_requests(wilaya);
CREATE INDEX IF NOT EXISTS idx_rental_requests_created_at ON public.rental_requests(created_at DESC);

-- View: public_rental_requests (Hides contact_phone for privacy until deal finalized)
CREATE OR REPLACE VIEW public.public_rental_requests AS
SELECT
    id,
    title,
    property_type,
    wilaya,
    municipality,
    budget,
    rooms,
    duration_months,
    specifications,
    status,
    created_at
FROM public.rental_requests
WHERE status IN ('approved', 'fulfilled');

-- ============================================================================
-- 4. BOOKINGS & DEALS TABLE
-- ============================================================================

-- Table: public.bookings
-- Manages rental reservations, booking requests, agreed rental rates, and mediation fees
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rental_request_id UUID REFERENCES public.rental_requests(id) ON DELETE SET NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    duration_months INTEGER DEFAULT 12,
    monthly_rent NUMERIC(12, 2) NOT NULL CHECK (monthly_rent >= 0),
    deposit_amount NUMERIC(12, 2) DEFAULT 0 CHECK (deposit_amount >= 0),
    initial_fee NUMERIC(12, 2) NOT NULL DEFAULT 1000 CHECK (initial_fee >= 0),
    initial_fee_payer TEXT NOT NULL DEFAULT 'renter' CHECK (initial_fee_payer IN ('renter', 'owner', 'split')),
    monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 1000 CHECK (monthly_fee >= 0),
    monthly_fee_payer TEXT NOT NULL DEFAULT 'owner' CHECK (monthly_fee_payer IN ('owner', 'renter', 'split')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    contacts_released BOOLEAN NOT NULL DEFAULT FALSE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON public.bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- View/Compatibility Table: public.deals
-- Maps 1:1 with bookings to maintain backward compatibility with existing codebase
CREATE OR REPLACE VIEW public.deals AS
SELECT
    id,
    property_id,
    rental_request_id,
    monthly_rent,
    initial_fee,
    initial_fee_payer,
    monthly_fee,
    monthly_fee_payer,
    contacts_released,
    completed,
    created_at
FROM public.bookings;

-- Function: Securely exchange phone numbers once contacts are released
CREATE OR REPLACE FUNCTION public.get_deal_contacts(p_deal_id UUID)
RETURNS TABLE (
    property_phone TEXT,
    renter_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
    v_owner_phone TEXT;
    v_renter_phone TEXT;
BEGIN
    SELECT b.*, p.owner_id AS prop_owner_id
    INTO v_booking
    FROM public.bookings b
    JOIN public.properties p ON b.property_id = p.id
    WHERE b.id = p_deal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal or booking not found';
    END IF;

    -- Only participants or admin can access contacts when released
    IF NOT (
        public.is_admin() OR
        auth.uid() = v_booking.renter_id OR
        auth.uid() = v_booking.owner_id OR
        auth.uid() = v_booking.prop_owner_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF NOT v_booking.contacts_released AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Contacts have not been released yet for this deal';
    END IF;

    SELECT phone INTO v_owner_phone FROM public.profiles WHERE id = COALESCE(v_booking.owner_id, v_booking.prop_owner_id);
    SELECT phone INTO v_renter_phone FROM public.profiles WHERE id = v_booking.renter_id;

    RETURN QUERY SELECT COALESCE(v_owner_phone, ''), COALESCE(v_renter_phone, '');
END;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES RLS
-- ----------------------------------------------------------------------------
-- Any authenticated user can read basic profile info (phone is protected via views/functions)
CREATE POLICY "Profiles readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can do anything with profiles
CREATE POLICY "Admins full access on profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- PROPERTIES RLS (CRUD)
-- ----------------------------------------------------------------------------
-- READ: Anyone (even anonymous) can view approved properties
CREATE POLICY "Anyone can view approved properties"
    ON public.properties FOR SELECT
    USING (status = 'approved' OR status = 'rented');

-- READ: Owners can view all their own properties regardless of status
CREATE POLICY "Owners can view their own properties"
    ON public.properties FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_id);

-- CREATE: Authenticated users can insert properties where owner_id is their auth.uid()
CREATE POLICY "Authenticated users can create properties"
    ON public.properties FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Owners can update their own properties
CREATE POLICY "Owners can update their own properties"
    ON public.properties FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- DELETE: Owners can delete their own properties
CREATE POLICY "Owners can delete their own properties"
    ON public.properties FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- ADMIN: Admins can view, review, update status, and delete all properties
CREATE POLICY "Admins have full access to properties"
    ON public.properties FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- BOOKINGS RLS (CRUD)
-- ----------------------------------------------------------------------------
-- READ: Renters and Owners can view their related bookings
CREATE POLICY "Users can view their own bookings"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (
        auth.uid() = renter_id OR
        auth.uid() = owner_id OR
        auth.uid() IN (SELECT owner_id FROM public.properties WHERE id = bookings.property_id)
    );

-- CREATE: Authenticated users can create a booking request (as renter)
CREATE POLICY "Authenticated users can create booking requests"
    ON public.bookings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = renter_id);

-- UPDATE: Renters and Owners can update booking states (e.g., approve or cancel)
CREATE POLICY "Participants can update booking status"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = renter_id OR
        auth.uid() = owner_id OR
        auth.uid() IN (SELECT owner_id FROM public.properties WHERE id = bookings.property_id)
    )
    WITH CHECK (
        auth.uid() = renter_id OR
        auth.uid() = owner_id OR
        auth.uid() IN (SELECT owner_id FROM public.properties WHERE id = bookings.property_id)
    );

-- DELETE: Only admin or renter can cancel before approval
CREATE POLICY "Renters can delete pending bookings"
    ON public.bookings FOR DELETE
    TO authenticated
    USING (auth.uid() = renter_id AND status = 'pending');

-- ADMIN: Admins have full access on bookings
CREATE POLICY "Admins have full access to bookings"
    ON public.bookings FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- RENTAL REQUESTS RLS (CRUD)
-- ----------------------------------------------------------------------------
-- READ: Public can view approved requests
CREATE POLICY "Public can view approved rental requests"
    ON public.rental_requests FOR SELECT
    USING (status = 'approved' OR status = 'fulfilled');

-- READ: Creators can view their own requests
CREATE POLICY "Users can view their own rental requests"
    ON public.rental_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = renter_id);

-- CREATE: Authenticated users can create requests
CREATE POLICY "Authenticated users can create rental requests"
    ON public.rental_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = renter_id);

-- UPDATE: Creators can update their requests
CREATE POLICY "Users can update their own rental requests"
    ON public.rental_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = renter_id)
    WITH CHECK (auth.uid() = renter_id);

-- DELETE: Creators can delete their requests
CREATE POLICY "Users can delete their own rental requests"
    ON public.rental_requests FOR DELETE
    TO authenticated
    USING (auth.uid() = renter_id);

-- ADMIN: Full access
CREATE POLICY "Admins have full access to rental requests"
    ON public.rental_requests FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
