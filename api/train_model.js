// api/train-model.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // serverless endpoint uses anon key for enqueue
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const name = (req.body?.name || `manual-${Date.now()}`).toString();

  try {
    const { data, error } = await supabase
      .from("model_jobs")
      .insert([
        {
          name,
          status: "queued",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .limit(1)
      .single();

    if (error) throw error;

    return res.status(202).json({
      message: "Job queued",
      job: data,
    });
  } catch (err) {
    console.error("enqueue error", err);
    return res.status(500).json({ error: "Failed to enqueue job" });
  }
}
