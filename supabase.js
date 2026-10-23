import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtlcenmkbqbcnemqcfsq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bGNlbm1rYnFiY25lbXFjZnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NjEyNjUsImV4cCI6MjEwNzEzNzI2NX0.xLZak41p_uYTWyqcZ_HjnMmRFLK-xl6-KrdKf7GOlYk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;