-- Security Fix: Admin Role Verification
-- This migration adds a function to verify if a user is the admin based on email

-- Create function to check if user is admin by email
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only the specified email can have admin privileges
    RETURN user_email = 'luxessence504@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user's admin status
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get the email from the authenticated user
    SELECT auth.jwt()->>'email' INTO user_email;
    
    IF user_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the email matches the admin email
    RETURN user_email = 'luxessence504@gmail.com';
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a table to store admin configuration (single row)
CREATE TABLE IF NOT EXISTS public.admin_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT NOT NULL UNIQUE DEFAULT 'luxessence504@gmail.com',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default admin configuration if not exists
INSERT INTO public.admin_config (admin_email)
VALUES ('luxessence504@gmail.com')
ON CONFLICT (admin_email) DO NOTHING;

-- Enable RLS on admin_config
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only allow reading admin_config, not modifying from client
CREATE POLICY "Admin config is private" ON public.admin_config
    FOR ALL TO authenticated 
    USING (current_user_is_admin() = true)
    WITH CHECK (current_user_is_admin() = true);
