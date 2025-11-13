import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { email, password, full_name, admin_code } = req.body;

  // 1️⃣ Input validation
  if (!email || !password || !full_name || !admin_code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // 2️⃣ Admin secret code validation
  if (admin_code !== process.env.ADMIN_SIGNUP_SECRET) {
    return res.status(401).json({ error: "Unauthorized admin code" });
  }

  // 3️⃣ Initialize private Supabase client using SERVICE ROLE KEY
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 4️⃣ Create user in Supabase Auth (NO rate limit)
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm email
    });

  if (userError) {
    return res.status(400).json({ error: userError.message });
  }

  const userId = userData.user.id;

  // 5️⃣ Insert into admin_users table
  const { error: insertError } = await supabaseAdmin
    .from("admin_users")
    .insert({
      id: userId,
      email,
      full_name,
      role: "admin",
    });

  if (insertError) {
    return res.status(400).json({ error: insertError.message });
  }

  return res.status(200).json({ success: true });
}
