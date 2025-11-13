// File: src/pages/AdminLessonContent.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { supabase } from "../lib/supabaseClient";
import { Hand, Plus, Trash2, Edit2, ArrowLeft } from "lucide-react";

export default function AdminLessonContent() {
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get("lesson_id");
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [signs, setSigns] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'sign' | 'question'
  const [editingItem, setEditingItem] = useState(null);

  // temporary form refs
  const glossRef = useRef("");
  const descRef = useRef("");
  const videoUrlRef = useRef("");
  const imageUrlRef = useRef("");
  const videoFileRef = useRef(null);
  const imageFileRef = useRef(null);

  // question fields
  const qTypeRef = useRef("gesture");
  const qQuestionRef = useRef("");
  const qAnswerRef = useRef("");
  const qChoicesRef = useRef("");

  useEffect(() => {
    if (!lessonId) return;
    loadLessonContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function loadLessonContent() {
    setLoading(true);
    try {
      const { data: l } = await supabase.from("lesson").select("*").eq("id", lessonId).single();
      setLesson(l || null);

      const { data: s } = await supabase
        .from("lesson_signs")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });
      setSigns(s || []);

      const { data: qs } = await supabase
        .from("lesson_questions")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });
      setQuestions(qs || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function openSignModal(sign = null) {
    setEditingItem(sign);
    // prefill refs
    glossRef.current = sign?.gloss || "";
    descRef.current = sign?.description || "";
    videoUrlRef.current = sign?.video_url || "";
    imageUrlRef.current = sign?.image_url || "";
    videoFileRef.current = null;
    imageFileRef.current = null;
    setModalType("sign");
    setModalOpen(true);
  }

  function openQuestionModal(q = null) {
    setEditingItem(q);
    qTypeRef.current = q?.type || "gesture";
    qQuestionRef.current = q?.question || "";
    qAnswerRef.current = q?.answer || "";
    qChoicesRef.current = q?.choices || "";
    setModalType("question");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
  }

  async function handleSignSave(e) {
    e.preventDefault();
    const gloss = glossRef.current.trim();
    const description = descRef.current.trim();

    if (!gloss) return alert("Gloss is required");

    let videoUrl = videoUrlRef.current?.trim() || "";
    let imageUrl = imageUrlRef.current?.trim() || "";

    // upload files if present
    if (videoFileRef.current) {
      const file = videoFileRef.current;
      const path = `videos/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from("lesson-media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) console.error("video upload error", error);
      else videoUrl = supabase.storage.from("lesson-media").getPublicUrl(data.path).data.publicUrl;
    }

    if (imageFileRef.current) {
      const file = imageFileRef.current;
      const path = `images/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from("lesson-media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) console.error("image upload error", error);
      else imageUrl = supabase.storage.from("lesson-media").getPublicUrl(data.path).data.publicUrl;
    }

    const payload = {
      gloss,
      description,
      video_url: videoUrl || null,
      image_url: imageUrl || null,
      lesson_id: lessonId,
    };

    try {
      if (editingItem?.id) {
        await supabase.from("lesson_signs").update(payload).eq("id", editingItem.id);
      } else {
        await supabase.from("lesson_signs").insert(payload);
      }
      closeModal();
      loadLessonContent();
    } catch (err) {
      console.error(err);
      alert("Failed to save sign.");
    }
  }

  async function handleQuestionSave(e) {
    e.preventDefault();
    const data = {
      type: qTypeRef.current,
      question: qQuestionRef.current.trim(),
      answer: qAnswerRef.current.trim() || null,
      choices: qChoicesRef.current.trim() || null,
      lesson_id: lessonId,
    };

    if (!data.question) return alert("Question is required");

    try {
      if (editingItem?.id) await supabase.from("lesson_questions").update(data).eq("id", editingItem.id);
      else await supabase.from("lesson_questions").insert(data);
      closeModal();
      loadLessonContent();
    } catch (err) {
      console.error(err);
      alert("Failed to save question.");
    }
  }

  async function deleteSign(id) {
    if (!confirm("Delete this sign?")) return;
    try {
      // attempt to remove files from storage (best effort)
      const { data: sign } = await supabase.from("lesson_signs").select("video_url, image_url").eq("id", id).single();
      if (sign?.video_url) {
        const path = sign.video_url.split("/lesson-media/")[1];
        if (path) await supabase.storage.from("lesson-media").remove([path]);
      }
      if (sign?.image_url) {
        const path = sign.image_url.split("/lesson-media/")[1];
        if (path) await supabase.storage.from("lesson-media").remove([path]);
      }
      await supabase.from("lesson_signs").delete().eq("id", id);
      loadLessonContent();
    } catch (err) {
      console.error(err);
      alert("Failed to delete sign.");
    }
  }

  async function deleteQuestion(id) {
    if (!confirm("Delete this question?")) return;
    try {
      await supabase.from("lesson_questions").delete().eq("id", id);
      loadLessonContent();
    } catch (err) {
      console.error(err);
      alert("Failed to delete question.");
    }
  }

  if (!lessonId) return (
    <div className="flex items-center justify-center min-h-screen">Please provide a <code>?lesson_id=&lt;id&gt;</code> in the URL.</div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar onLogout={() => supabase.auth.signOut().then(() => navigate('/login'))} />

      <main className="flex-1 p-8 ml-0 md:ml-20 xl:ml-[250px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded bg-gray-200">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Hand className="w-7 h-7 text-indigo-600" />
              {lesson?.title || 'Lesson Content'}
            </h1>
          </div>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="space-y-8">
            {/* SIGNS */}
            <section className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Lesson Signs</h2>
                <button onClick={() => openSignModal(null)} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded">
                  <Plus className="w-4 h-4" /> Add Sign
                </button>
              </div>

              {signs.length === 0 ? (
                <p className="text-gray-500">No signs yet.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3">Gloss</th>
                      <th className="py-2 px-3">Video</th>
                      <th className="py-2 px-3">Image</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signs.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2 px-3">{s.gloss}</td>
                        <td className="py-2 px-3">{s.video_url ? '🎥' : '—'}</td>
                        <td className="py-2 px-3">{s.image_url ? '🖼️' : '—'}</td>
                        <td className="py-2 px-3">{s.description}</td>
                        <td className="py-2 px-3 text-right">
                          <button onClick={() => openSignModal(s)} className="text-blue-600 mr-3"><Edit2 className="w-4 h-4 inline" /> Edit</button>
                          <button onClick={() => deleteSign(s.id)} className="text-red-600"><Trash2 className="w-4 h-4 inline" /> Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* QUESTIONS */}
            <section className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Lesson Questions</h2>
                <button onClick={() => openQuestionModal(null)} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <p className="text-gray-500">No questions yet.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Question</th>
                      <th className="py-2 px-3">Answer</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id} className="border-b">
                        <td className="py-2 px-3 capitalize">{q.type}</td>
                        <td className="py-2 px-3">{q.question}</td>
                        <td className="py-2 px-3">{q.answer}</td>
                        <td className="py-2 px-3 text-right">
                          <button onClick={() => openQuestionModal(q)} className="text-blue-600 mr-3"><Edit2 className="w-4 h-4 inline" /> Edit</button>
                          <button onClick={() => deleteQuestion(q.id)} className="text-red-600"><Trash2 className="w-4 h-4 inline" /> Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}

        {/* MODAL */}
        {modalOpen && modalType === "sign" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">{editingItem ? "Edit Sign" : "Add Sign"}</h3>
              <form onSubmit={handleSignSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Gloss</label>
                  <input defaultValue={editingItem?.gloss || ''} onChange={(e) => (glossRef.current = e.target.value)} className="w-full border rounded p-2" required />
                </div>

                <div>
                  <label className="text-sm font-medium mt-2">Video URL (optional)</label>
                  <input defaultValue={editingItem?.video_url || ''} onChange={(e) => (videoUrlRef.current = e.target.value)} className="w-full border rounded p-2" />
                  <label className="text-sm font-medium mt-2 block">Or upload video file</label>
                  <input type="file" accept="video/*" onChange={(e) => (videoFileRef.current = e.target.files[0])} className="w-full" />
                </div>

                <div>
                  <label className="text-sm font-medium mt-2">Image URL (optional)</label>
                  <input defaultValue={editingItem?.image_url || ''} onChange={(e) => (imageUrlRef.current = e.target.value)} className="w-full border rounded p-2" />
                  <label className="text-sm font-medium mt-2 block">Or upload image</label>
                  <input type="file" accept="image/*" onChange={(e) => (imageFileRef.current = e.target.files[0])} className="w-full" />
                </div>

                <div>
                  <label className="text-sm font-medium mt-2">Description</label>
                  <textarea defaultValue={editingItem?.description || ''} onChange={(e) => (descRef.current = e.target.value)} className="w-full border rounded p-2" rows={3} />
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalOpen && modalType === "question" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 w-full max-w-xl">
              <h3 className="text-lg font-semibold mb-4">{editingItem ? "Edit Question" : "Add Question"}</h3>
              <form onSubmit={handleQuestionSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select defaultValue={editingItem?.type || 'gesture'} onChange={(e) => (qTypeRef.current = e.target.value)} className="w-full border rounded p-2">
                    <option value="gesture">Gesture</option>
                    <option value="flashcard">Flashcard</option>
                    <option value="multiple-choice">Multiple Choice</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Question</label>
                  <input defaultValue={editingItem?.question || ''} onChange={(e) => (qQuestionRef.current = e.target.value)} className="w-full border rounded p-2" required />
                </div>

                <div>
                  <label className="text-sm font-medium">Answer</label>
                  <input defaultValue={editingItem?.answer || ''} onChange={(e) => (qAnswerRef.current = e.target.value)} className="w-full border rounded p-2" />
                </div>

                <div>
                  <label className="text-sm font-medium">Choices (comma-separated)</label>
                  <textarea defaultValue={editingItem?.choices || ''} onChange={(e) => (qChoicesRef.current = e.target.value)} className="w-full border rounded p-2" rows={2} />
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
