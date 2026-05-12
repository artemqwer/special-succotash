import { createClient } from './src/lib/supabase';

async function checkBuckets() {
  const supabase = createClient();
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
  } else {
    console.log('Available buckets:', data.map(b => b.name));
  }
}

checkBuckets();
