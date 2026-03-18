import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push"

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { title, body, url, target_role } = await req.json()

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        let query = supabase.from('push_subscriptions').select('subscription_json, user_id')

        // Si se especifica target_role === 'admin', filtramos por el email del admin (ej. info@luxessence.com)
        // O podrías tener una columna 'role' en una tabla de perfiles. 
        // Por ahora, usaremos la lógica de enviárselo a quien esté suscrito.
        // Si quieres restringir a admins, deberías filtrar por IDs de admins.
        
        const { data: subs, error: subsError } = await query

        if (subsError) throw subsError

        if (!subs || subs.length === 0) {
            return new Response(JSON.stringify({ message: 'No active subscriptions found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        webpush.setVapidDetails(
            'mailto:soporte@luxessence.com',
            VAPID_PUBLIC_KEY!,
            VAPID_PRIVATE_KEY!
        )

        const notifications = subs.map(async (sub) => {
            try {
                return await webpush.sendNotification(
                    sub.subscription_json,
                    JSON.stringify({ title, body, url })
                )
            } catch (err) {
                // If subscription is expired or invalid, we should ideally remove it
                if (err.statusCode === 404 || err.statusCode === 410) {
                    console.log('Subscription expired, removing...');
                    await supabase.from('push_subscriptions').delete().match({ subscription_json: sub.subscription_json })
                }
                return null
            }
        })

        await Promise.allSettled(notifications)

        return new Response(JSON.stringify({ success: true, count: subs.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
