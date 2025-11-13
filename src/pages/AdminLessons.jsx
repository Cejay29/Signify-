import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ NEW
import { supabase } from "../lib/supabaseClient";

import AdminLayout from "../layouts/AdminLayout";

import LevelList from "../components/LevelList";
import LevelModal from "../components/LevelModal";
import LessonModal from "../components/LessonModal";
import ConfirmDelete from "../components/ConfirmDelete";

import { Plus } from "lucide-react";

export default function AdminLessons() {
  const navigate = useNavigate(); // ✅ NEW

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadLevels();
  }, []);

  async function loadLevels() {
    setLoading(true);
    const { data, error } = await supabase
      .from("levels")
      .select("*, lesson(*)")
      .order("order", { ascending: true });

    if (!error) setLevels(data);
    setLoading(false);
  }

  function openLevelModal(level = null) {
    setEditingLevel(level);
    setShowLevelModal(true);
  }

  function openLessonModal(levelId, lesson = null) {
    setCurrentLevelId(levelId);
    setEditingLesson(lesson);
    setShowLessonModal(true);
  }

  function openDelete(type, id) {
    setConfirmDelete({ type, id });
  }

  /** ✅ NEW: navigate to lesson-content screen */
  function handleManageContent(lessonId) {
    navigate(`/admin/lesson-content?lesson_id=${lessonId}`);
  }

  return (
    <AdminLayout title="Manage Levels">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Plus className="w-7 h-7 text-indigo-600" />
          Manage Levels
        </h2>

        <button
          onClick={() => openLevelModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          <Plus className="w-5 h-5" />
          Add Level
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <LevelList
          levels={levels}
          onEditLevel={openLevelModal}
          onAddLesson={openLessonModal}
          onEditLesson={openLessonModal}
          onDelete={openDelete}
          onManageContent={handleManageContent} // ✅ NEW
        />
      )}

      {/* Modals */}
      {showLevelModal && (
        <LevelModal
          level={editingLevel}
          onClose={() => setShowLevelModal(false)}
          onSaved={loadLevels}
        />
      )}

      {showLessonModal && (
        <LessonModal
          levelId={currentLevelId}
          lesson={editingLesson}
          onClose={() => setShowLessonModal(false)}
          onSaved={loadLevels}
        />
      )}

      {confirmDelete && (
        <ConfirmDelete
          data={confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onDeleted={loadLevels}
        />
      )}
    </AdminLayout>
  );
}
