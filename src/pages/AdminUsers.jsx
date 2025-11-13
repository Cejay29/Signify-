import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import AdminSidebar from "../components/AdminSidebar";

import { Users, Edit, Trash2, UserPlus, X } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    xp: 0,
    gems: 0,
    hearts: 0,
    streak: 0,
  });

  /* -------------------------------------------------------------
      LOAD USERS
  ------------------------------------------------------------- */
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, xp, gems, hearts, streak");

    if (!error) setUsers(data);
    setLoading(false);
  }

  /* -------------------------------------------------------------
      OPEN ADD MODAL
  ------------------------------------------------------------- */
  function openAddModal() {
    setEditingUser(null);
    setFormData({
      username: "",
      email: "",
      xp: 0,
      gems: 0,
      hearts: 0,
      streak: 0,
    });
    setShowModal(true);
  }

  /* -------------------------------------------------------------
      OPEN EDIT MODAL
  ------------------------------------------------------------- */
  function openEditModal(user) {
    setEditingUser(user.id);
    setFormData({
      username: user.username,
      email: user.email,
      xp: user.xp,
      gems: user.gems,
      hearts: user.hearts,
      streak: user.streak,
    });
    setShowModal(true);
  }

  /* -------------------------------------------------------------
      HANDLE SAVE (ADD/EDIT)
  ------------------------------------------------------------- */
  async function handleSave(e) {
    e.preventDefault();

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      xp: Number(formData.xp),
      gems: Number(formData.gems),
      hearts: Number(formData.hearts),
      streak: Number(formData.streak),
    };

    if (editingUser) {
      // Update
      await supabase.from("users").update(payload).eq("id", editingUser);
    } else {
      // Insert
      await supabase.from("users").insert([payload]);
    }

    setShowModal(false);
    loadUsers();
  }

  /* -------------------------------------------------------------
      DELETE USER
  ------------------------------------------------------------- */
  async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;

    await supabase.from("users").delete().eq("id", id);
    loadUsers();
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      {/* MAIN */}
      <main className="flex-1 p-8 ml-0 md:ml-20 xl:ml-[250px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            User Management
          </h2>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-indigo-50 text-indigo-700">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Username</th>
                <th className="p-3">Email</th>
                <th className="p-3">XP</th>
                <th className="p-3">Gems</th>
                <th className="p-3">Hearts</th>
                <th className="p-3">Streak</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-semibold">{user.username}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.xp}</td>
                    <td className="p-3">{user.gems}</td>
                    <td className="p-3">{user.hearts}</td>
                    <td className="p-3">{user.streak}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>

                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingUser ? "Edit User" : "Add User"}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleSave}>
              <div>
                <label className="text-sm">Username</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border rounded p-2"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["xp", "gems", "hearts", "streak"].map((field) => (
                  <div key={field}>
                    <label className="text-sm capitalize">{field}</label>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={formData[field]}
                      onChange={(e) =>
                        setFormData({ ...formData, [field]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
