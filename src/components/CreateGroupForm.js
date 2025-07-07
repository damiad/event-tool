import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";

function CreateGroupForm() {
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "groups"), {
        name: groupName,
        createdAt: serverTimestamp(),
      });
      alert("Group created successfully!");
      setGroupName("");
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-700 mb-6">
        Create a New Group
      </h2>
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="groupName"
          className="block text-sm font-medium text-slate-600 mb-2"
        >
          Group Name
        </label>
        <input
          id="groupName"
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g., Football-WAW"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-slate-400"
        >
          {submitting ? "Creating..." : "Create Group"}
        </button>
      </form>
    </div>
  );
}

export default CreateGroupForm;
