import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1️⃣ Connect to Supabase
const supabaseUrl = 'https://pikwjrgfrqxrklvswvzg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpa3dqcmdmcnF4cmtsdnN3dnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDU3NDksImV4cCI6MjA3NTQyMTc0OX0.CLhGcngTqMYb74DujW_U4VnDAH50HeVd6Fq8kQwyHq4';
const supabase = createClient(supabaseUrl, supabaseKey);

// 2️⃣ Path to your JSON files
const DATA_DIR = path.join(process.cwd(), 'json_files');

// 3️⃣ Read all JSON files and prepare data
function readJsonFiles(dir) {
  const files = fs.readdirSync(dir);
  let allData = [];
  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const json = JSON.parse(content);
      const season = file.replace('.json','');
      const items = (json.items || []).map(p => ({
        season,
        rank: p.rank,
        name: p.name,
        tag: p.tag,
        clan_name: p.clan?.name || null,
        clan_tag: p.clan?.tag || null
      }));
      allData.push(...items);
    }
  }
  return allData;
}

// 4️⃣ Upload data in chunks
async function uploadToSupabase() {
  const data = readJsonFiles(DATA_DIR);
  console.log(`Uploading ${data.length} rows...`);

  const chunkSize = 500;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const { error } = await supabase.from('players').insert(chunk);
    if (error) console.error('Insert error:', error);
    else console.log(`Inserted ${chunk.length} rows`);
  }

  console.log('Upload complete!');
}

uploadToSupabase();