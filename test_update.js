import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}\\s*=\\s*(.*)`));
  return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
  // Let's first log in or just try to select
  console.log('Fetching profiles...');
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('Error selecting profiles:', error);
  } else {
    console.log('Profiles found:', data);
    if (data.length > 0) {
      const firstProfile = data[0];
      console.log('Attempting to update profile:', firstProfile.id);
      const { data: updatedData, error: updateError } = await supabase
        .from('profiles')
        .update({ name: firstProfile.name + ' Test' })
        .eq('id', firstProfile.id)
        .select();
      
      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        console.log('Update success:', updatedData);
      }
    }
  }
}

testUpdate();
