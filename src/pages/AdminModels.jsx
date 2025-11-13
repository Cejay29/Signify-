// src/pages/AdminModels.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Brain, Rocket } from "lucide-react";

export default function AdminModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enqueueing, setEnqueueing] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    setLoading(true);
    const { data, error } = await supabase
      .from("model_versions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setModels(data || []);
    setLoading(false);
  }

  async function startTraining() {
    setEnqueueing(true);
    const { data, error } = await supabase
      .from("training_jobs")
      .insert([{ status: "pending", params: { source: "admin_trigger" } }])
      .select()
      .single();

    if (error) {
      alert("Failed to enqueue training job: " + error.message);
    } else {
      alert("Training job enqueued. Start your local worker to run it.");
    }
    setEnqueueing(false);
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* If you use AdminSidebar separately, include it in your page layout; omitted here for brevity */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-600" />
            Model Management
          </h2>
          <button
            onClick={startTraining}
            disabled={enqueueing}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            <Rocket className="w-4 h-4" />
            {enqueueing ? "Enqueueing…" : "Train New Model"}
          </button>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h3 className="font-semibold mb-4">Available Models</h3>

          {loading ? (
            <p>Loading…</p>
          ) : models.length === 0 ? (
            <p className="text-gray-500">No models yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Version</th>
                  <th className="p-2">Accuracy</th>
                  <th className="p-2">Loss</th>
                  <th className="p-2">Uploaded</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-2">{m.version}</td>
                    <td className="p-2">{m.accuracy ?? "N/A"}%</td>
                    <td className="p-2">{m.loss ?? "N/A"}</td>
                    <td className="p-2">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="p-2">
                      <a
                        href={m.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        View model.json
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
