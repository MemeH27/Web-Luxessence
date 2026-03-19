import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const ADMIN_EMAIL = 'luxessence504@gmail.com'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendPushNotifications(subs: any[], title: string, body: string, url: string, supabase: any) {
    webpush.setVapidDetails(
        'mailto:luxessence504@gmail.com',
        Deno.env.get('VAPID_PUBLIC_KEY')!,
        Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    const results = await Promise.allSettled(subs.map(async (sub) => {
        try {
            return await webpush.sendNotification(
                sub.subscription_json,
                JSON.stringify({ title, body, url })
            )
        } catch (err: any) {
            if (err.statusCode === 404 || err.statusCode === 410) {
                await supabase.from('push_subscriptions').delete().eq('subscription_json', sub.subscription_json)
            }
            throw err
        }
    }))

    return new Response(JSON.stringify({ 
        success: true, 
        sent: results.length,
        errors: results.filter((r: any) => r.status === 'rejected').length
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
        const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing environment variables.')
        }

        const payload = await req.json().catch(() => ({}))
        const { 
            title = 'Aviso de Luxessence', 
            body = 'Tienes una nueva actualización.', 
            url = '/', 
            target_role = 'admin', 
            user_id: target_user_id,
            email: target_email, // New: Target by email
            subscription: specific_sub 
        } = payload
        
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        if (specific_sub) {
            return await sendPushNotifications([{ subscription_json: specific_sub }], title, body, url, supabase)
        }

        let query = supabase.from('push_subscriptions').select('subscription_json, user_id')

        if (target_email) {
            // Target by email (lookup user_id first)
            console.log(`Targeting email: ${target_email}`)
            const { data: userId } = await supabase.rpc('get_user_id_by_email', { p_email: target_email })
            if (userId) {
                query = query.eq('user_id', userId)
            } else {
                // Return success 0 if user not found via email
                return new Response(JSON.stringify({ message: 'User not found by email', email: target_email }), { status: 200, headers: corsHeaders })
            }
        } else if (target_user_id) {
            // Target specific user ID
            console.log(`Targeting user_id: ${target_user_id}`)
            query = query.eq('user_id', target_user_id)
        } else if (target_role === 'admin') {
            // Target the main admin by email
            const { data: adminUser } = await supabase.rpc('get_user_id_by_email', { p_email: ADMIN_EMAIL })
            if (adminUser) {
                query = query.eq('user_id', adminUser)
            } else {
                const { data: { users } } = await supabase.auth.admin.listUsers()
                const admin = users?.find((u: any) => u.email === ADMIN_EMAIL)
                if (admin) query = query.eq('user_id', admin.id)
            }
        } else if (target_role === 'all') {
            // No filter, target all subscribers
            console.log("Targeting all subscribers")
        }

        const { data: subs, error: subsError } = await query
        if (subsError) throw subsError

        if (!subs || subs.length === 0) {
            return new Response(JSON.stringify({ message: 'No active subscriptions found', target_role, target_user_id }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        return await sendPushNotifications(subs, title, body, url, supabase)

    } catch (error: any) {
        console.error('Edge Function Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

