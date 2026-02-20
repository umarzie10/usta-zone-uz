
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('client', 'master', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  city TEXT DEFAULT 'Toshkent',
  region TEXT DEFAULT 'Toshkent viloyati',
  role app_role NOT NULL DEFAULT 'client',
  is_verified BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uz TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'wrench',
  color TEXT DEFAULT '#1a56db',
  order_num INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create master_profiles table
CREATE TABLE public.master_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bio TEXT,
  experience_years INT DEFAULT 0,
  category_ids UUID[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  portfolio_urls TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  jobs_completed INT DEFAULT 0,
  balance NUMERIC(12,2) DEFAULT 0,
  withdrawable_balance NUMERIC(12,2) DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.master_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master profiles are viewable by everyone" ON public.master_profiles FOR SELECT USING (true);
CREATE POLICY "Masters can update their own profile" ON public.master_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Masters can insert their own profile" ON public.master_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage master profiles" ON public.master_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  master_id UUID,
  category_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash', -- cash | online
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | in_progress | completed | disputed | cancelled
  amount NUMERIC(12,2) DEFAULT 0,
  commission_amount NUMERIC(12,2) DEFAULT 0,
  master_amount NUMERIC(12,2) DEFAULT 0,
  city TEXT,
  address TEXT,
  client_confirmed BOOLEAN DEFAULT FALSE,
  master_confirmed BOOLEAN DEFAULT FALSE,
  admin_approved BOOLEAN DEFAULT FALSE,
  is_dispute BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own orders" ON public.orders FOR SELECT USING (auth.uid() = client_id OR auth.uid() = master_id);
CREATE POLICY "Clients can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = master_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  client_id UUID NOT NULL,
  master_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  order_id UUID,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Create withdraw_requests table
CREATE TABLE public.withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  card_number TEXT,
  status TEXT DEFAULT 'pending', -- pending | approved | rejected
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Masters can see their own withdraw requests" ON public.withdraw_requests FOR SELECT USING (auth.uid() = master_id);
CREATE POLICY "Masters can create withdraw requests" ON public.withdraw_requests FOR INSERT WITH CHECK (auth.uid() = master_id);
CREATE POLICY "Admins can manage withdraw requests" ON public.withdraw_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create transactions table  
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID,
  type TEXT NOT NULL, -- credit | debit | commission | refund
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can see all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_master_profiles_updated_at BEFORE UPDATE ON public.master_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Insert demo categories
INSERT INTO public.categories (name_uz, name_ru, name_en, icon, color, order_num) VALUES
('Santexnika', 'Сантехника', 'Plumbing', 'droplets', '#3b82f6', 1),
('Elektrik', 'Электрика', 'Electrical', 'zap', '#f59e0b', 2),
('Tozalash', 'Уборка', 'Cleaning', 'sparkles', '#10b981', 3),
('Mebelchilik', 'Мебель', 'Furniture', 'sofa', '#8b5cf6', 4),
('Ta''mirlash', 'Ремонт', 'Repair', 'hammer', '#ef4444', 5),
('Bog''dorchilik', 'Озеленение', 'Gardening', 'leaf', '#22c55e', 6),
('Haydovchi', 'Водитель', 'Driver', 'car', '#06b6d4', 7),
('Muallim', 'Репетитор', 'Tutor', 'graduation-cap', '#ec4899', 8),
('Ovqatlanish', 'Приготовление', 'Cooking', 'utensils', '#f97316', 9),
('Bezatish', 'Дизайн', 'Design', 'palette', '#7c3aed', 10),
('Sog''liq', 'Медицина', 'Healthcare', 'heart-pulse', '#dc2626', 11),
('IT xizmatlari', 'IT услуги', 'IT Services', 'laptop', '#0ea5e9', 12);
