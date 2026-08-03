const SUPABASE_URL = "https://tkabyhvpmxpzetlwkysi.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYWJ5aHZwbXhwemV0bHdreXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTgyMDksImV4cCI6MjEwMDk5NDIwOX0.3_zMOn5phJco4IgPuVnTMwtQSB4VQHdHqGs5YyzQf9M";

window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);