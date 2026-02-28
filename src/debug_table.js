import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Try to find .env file
const envFile = fs.readFileSync('.env.local', 'utf8') || fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => {
    const [key, ...value] = line.split('=');
    return [key.trim(), value.join('=').trim().replace(/^"(.*)"$/, '$1')];
}));

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking site_settings table...');
    const { data, error } = await supabase.from('site_settings').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error fetching site_settings:', error.message);
        if (error.code === '42P01') {
            console.log('Table "site_settings" DOES NOT EXIST.');
        } else if (error.code === '42501') {
            console.log('Permission denied. Check RLS policies.');
        }
    } else {
        console.log('Table exists. Row count:', data);
    }
}

checkTable();
