CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','owner')), phone TEXT, address TEXT, avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role='admin'), is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_permissions (
  admin_id UUID PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '["dashboard","users","properties","bookings","payments","analytics","audit"]'
);
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, college_name TEXT, course TEXT, year TEXT, city TEXT, state TEXT, pincode TEXT,
  guardian_name TEXT, guardian_phone TEXT, guardian_relation TEXT, blood_group TEXT, medical_conditions TEXT, id_document_url TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT,
  address TEXT NOT NULL, city TEXT NOT NULL, state TEXT, pincode TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, gender_policy TEXT,
  amenities JSONB NOT NULL DEFAULT '[]', images JSONB NOT NULL DEFAULT '[]',
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE, room_number TEXT NOT NULL,
  room_type TEXT NOT NULL, monthly_rent NUMERIC(12,2) NOT NULL CHECK (monthly_rent >= 0), security_deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0), occupied INTEGER NOT NULL DEFAULT 0 CHECK (occupied >= 0 AND occupied <= capacity),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')), amenities JSONB NOT NULL DEFAULT '[]', UNIQUE(property_id, room_number)
);
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL, visit_at TIMESTAMPTZ, message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled','completed')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL, start_date DATE NOT NULL, end_date DATE, monthly_rent NUMERIC(12,2) NOT NULL,
  deposit NUMERIC(12,2) NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('draft','active','expired','terminated')),
  document_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), agreement_id UUID REFERENCES agreements(id) ON DELETE SET NULL, student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL, title TEXT NOT NULL, amount NUMERIC(12,2) NOT NULL CHECK(amount > 0), due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid','paid','overdue','cancelled')), paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  bill_id UUID REFERENCES bills(id) ON DELETE SET NULL, amount NUMERIC(12,2) NOT NULL CHECK (amount > 0), month DATE NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  provider TEXT, provider_payment_id TEXT, receipt_url TEXT, paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system', read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), comment TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(student_id, property_id)
);
CREATE TABLE IF NOT EXISTS food_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]', amount NUMERIC(12,2) NOT NULL CHECK(amount >= 0), status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed','confirmed','preparing','delivered','cancelled')),
  delivery_address TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT, action TEXT NOT NULL,
  entity_type TEXT NOT NULL, entity_id UUID, metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city); CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id); CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id); CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_bills_student ON bills(student_id); CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id); CREATE INDEX IF NOT EXISTS idx_food_orders_student ON food_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
