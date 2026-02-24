const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

// Load .env
if (fs.existsSync('.env')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Running migration...');
    // We can't run raw SQL via supabase-js easily unless we have an RPC or use a different library.
    // However, I can check if columns exist by trying to select them.
    const { data, error } = await supabase.from('sales').select('total_cost, total_profit').limit(1);

    if (error && error.message.includes('column "total_cost" does not exist')) {
        console.log('Columns do not exist. Please run the SQL manually in Supabase Dashboard:');
        console.log('ALTER TABLE sales ADD COLUMN total_cost DECIMAL(12,2) DEFAULT 0;');
        console.log('ALTER TABLE sales ADD COLUMN total_profit DECIMAL(12,2) DEFAULT 0;');
    } else {
        console.log('Columns already exist or another error occurred:', error?.message || 'Success');
    }
}

migrate();
