import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        
        // 1. Check Low Stock (Less than 6 units)
        const { data: lowStockProducts } = await supabase
            .from('products')
            .select('name, stock')
            .lte('stock', 5)
            .limit(10)
            
        if (lowStockProducts && lowStockProducts.length > 0) {
            for (const p of lowStockProducts) {
                await supabase.functions.invoke('notify-admins', {
                    body: {
                        title: '⚠️ Alerta de Stock',
                        body: `El producto ${p.name} tiene solo ${p.stock} unidades.`,
                        url: '/admin/inventory',
                        target_role: 'admin'
                    }
                })
            }
        }
        
        // 2. Check Expiring Invoices (Between 27 and 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const twentySevenDaysAgo = new Date()
        twentySevenDaysAgo.setDate(twentySevenDaysAgo.getDate() - 27)
        
        const { data: expiringInvoices } = await supabase
            .from('sales')
            .select(`
                id, 
                total, 
                customers(first_name, last_name)
            `)
            .eq('payment_method', 'Crédito')
            .eq('is_paid', false)
            .lte('created_at', twentySevenDaysAgo.toISOString())
            .gte('created_at', thirtyDaysAgo.toISOString())
            
        if (expiringInvoices && expiringInvoices.length > 0) {
            for (const inv of expiringInvoices) {
                await supabase.functions.invoke('notify-admins', {
                    body: {
                        title: 'Factura por Vencer ⏳',
                        body: `La factura de ${inv.customers?.first_name} por L. ${inv.total} está por cumplir 30 días.`,
                        url: `/admin/sales?id=${inv.id}`,
                        target_role: 'admin'
                    }
                })
            }
        }
        
        // 3. Auto-unmark New Arrivals (More than 7 days old)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        await supabase
            .from('products')
            .update({ is_new_arrival: false })
            .eq('is_new_arrival', true)
            .lt('created_at', sevenDaysAgo.toISOString())
            
        return new Response(JSON.stringify({ success: true, message: 'Tareas de mantenimiento completadas' }), { 
            headers: { 'Content-Type': 'application/json' },
            status: 200 
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
            headers: { 'Content-Type': 'application/json' },
            status: 500 
        })
    }
})
