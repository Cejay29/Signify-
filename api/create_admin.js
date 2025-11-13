import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create admin in Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user.id;

    // Insert into admin_users table
    const { error: insertError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        id: userId,
        full_name,
        email,
        role: "admin",
      });

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
