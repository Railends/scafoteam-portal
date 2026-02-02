
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
    const lines = envFile.split('\n');
    for (const line of lines) {
        if (line.startsWith(key + '=')) {
            return line.split('=')[1].trim().replace(/^["']|["']$/g, '');
        }
    }
    return null;
};
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data } = await supabase.from('workers').select('*').limit(1);
    if (data && data.length > 0) {
        fs.writeFileSync('columns.json', JSON.stringify(Object.keys(data[0]), null, 2));
        console.log('Saved columns to columns.json');
    }
}
checkSchema();
