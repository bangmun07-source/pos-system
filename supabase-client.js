const SUPABASE_URL = "https://glbyqlibiapiorztgxee.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYnlxbGliaWFwaW9yenRneGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNDQ5NTIsImV4cCI6MjA5ODcyMDk1Mn0.4EMqkY3hbMJMwqtwwS3dv1MM1HDueuCrn9BI7uNsqss";


const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
