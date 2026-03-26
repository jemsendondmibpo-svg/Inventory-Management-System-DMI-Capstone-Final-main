import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://acmjobitmziriyjlircv.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJhucaf6615MrCgWuKJn0w_anaOQTCI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
