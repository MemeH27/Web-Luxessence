-- Create payments table for credit sales
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add useful indexes
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON public.payments(sale_id);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Simple policy for admin access (assuming you have a similar setup for sales)
CREATE POLICY "Enable all for authenticated users" ON public.payments
    FOR ALL USING (auth.role() = 'authenticated');
