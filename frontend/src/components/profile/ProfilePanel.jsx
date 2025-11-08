import React, { useState } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";

function ProfilePanel({ user, onClose, onLogout, onProfileUpdated }) {
  const [name, setName] = useState(user.name);
  const [about, setAbout] = useState(user.about_me || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(user.profile_image);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("about_me", about);
      if (image) {
        formData.append("profile_image", image);
      }

      const response = await AxiosInstance.put("/auth/profile/update/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      alert("Profile updated successfully");

      const profileResponse = await AxiosInstance.get("/auth/profile/");
      
      if (onProfileUpdated) {
        onProfileUpdated(profileResponse.data);
      }
      onClose();
    } catch (error) {
      console.error("Profile update failed", error);
      alert("Failed to update profile");
    }
  };


  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between bg-green-600 text-white p-4 shadow-md">
        <h2 className="text-lg font-semibold">Profile</h2>
        <button onClick={onClose} className="hover:bg-green-700 p-2 rounded-full">
          ✕
        </button>
      </div>

      <div className="flex flex-col items-center p-6 space-y-6">
        <label className="relative cursor-pointer">
          <img
            src={preview || "/default-avatar.png"}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-green-500"
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <span className="absolute bottom-2 right-3 bg-green-500 text-white p-1 rounded-full text-xs">
            Edit
          </span>
        </label>

        <div className="w-full max-w-md space-y-4">
          <div>
            <label className="text-gray-700 font-medium">Name</label>
            <input
              type="text"
              className="w-full border rounded-md p-2 mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-gray-700 font-medium">About</label>
            <textarea
              className="w-full border rounded-md p-2 mt-1"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Save
        </button>

        <button
          onClick={onLogout}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default ProfilePanel;
