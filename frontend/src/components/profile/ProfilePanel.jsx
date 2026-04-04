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
  <div className="fixed inset-0 bg-[#050505] z-50 flex flex-col animate-in fade-in slide-in-from-right duration-300">
    {/* Header */}
    <div className="relative bg-[#121212] border-b border-[#D4AF37]/30 text-white p-6 shadow-2xl">
      <div className="relative flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/40">
            <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Account <span className="text-[#D4AF37]">Settings</span></h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Personal Identity</p>
          </div>
        </div>
        
        <button onClick={onClose} className="hover:bg-[#D4AF37] hover:text-black p-2.5 rounded-full transition-all duration-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="flex flex-col items-center p-8 space-y-10 max-w-2xl mx-auto">
        {/* Avatar Section */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-[#D4AF37] rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity"></div>
          <label className="relative cursor-pointer block">
            <img
              src={preview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              className="w-44 h-44 rounded-full object-cover border-4 border-[#121212] ring-2 ring-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.15)] group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-2 right-2 bg-[#D4AF37] text-black p-3 rounded-full shadow-xl">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
               </svg>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        {/* Inputs */}
        <div className="w-full space-y-8 bg-[#121212] rounded-[2.5rem] p-10 border border-[#222]">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Display Name</label>
            <input
              type="text"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-2xl p-5 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 outline-none transition-all"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Biography</label>
            <textarea
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none transition-all h-32 resize-none"
              value={about} onChange={(e) => setAbout(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 w-full">
          <button onClick={handleSave} className="flex-1 py-5 bg-[#D4AF37] text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#F3CF58] transition-all active:scale-95 shadow-lg shadow-[#D4AF37]/10">
            Save Changes
          </button>
          <button onClick={onLogout} className="flex-1 py-5 bg-transparent border border-red-900/50 text-red-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-500/10 transition-all">
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
);
}

export default ProfilePanel;