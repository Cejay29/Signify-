// api/models.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from("model_versions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ models: data });
  } catch (err) {
    console.error("models list error", err);
    res.status(500).json({ error: "Failed to fetch models" });
  }
}
