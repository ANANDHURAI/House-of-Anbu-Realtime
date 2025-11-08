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
  <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 z-50 flex flex-col animate-in fade-in slide-in-from-right duration-300">
    <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-5 shadow-2xl overflow-hidden">
  
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-32 translate-y-32 animate-pulse delay-700"></div>
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Edit Profile</h2>
        </div>
        
        <button 
          onClick={onClose} 
          className="hover:bg-white/20 p-2.5 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-90 group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400 scrollbar-track-transparent">
      <div className="flex flex-col items-center p-6 md:p-8 space-y-8 max-w-2xl mx-auto">
      
        <div className="relative animate-in zoom-in-50 fade-in duration-500">
          <div className="absolute -inset-6 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full opacity-20 blur-2xl animate-pulse"></div>
          
          <label className="relative cursor-pointer group block">
            <div className="relative">
           
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-0 group-hover:opacity-75 blur-lg transition-all duration-500"></div>
            
              <img
                src={preview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="Profile"
                className="relative w-40 h-40 rounded-full object-cover ring-4 ring-white shadow-2xl group-hover:scale-105 transition-all duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                }}
              />
             
              <div className="absolute bottom-2 right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
          
          <p className="text-center text-slate-400 text-sm mt-4 animate-in fade-in slide-in-from-bottom duration-700">
            Click to change profile picture
          </p>
        </div>

        <div className="w-full space-y-6 bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
       
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-500">
            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span>Display Name</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                className="w-full border-2 border-slate-200 rounded-xl p-4 pl-12 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300 shadow-sm hover:shadow-md bg-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="animate-in slide-in-from-bottom-3 fade-in duration-600">
            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Email</span>
            </label>
            <div className="relative">
              <div className="w-full border-2 border-slate-200 rounded-xl p-4 pl-12 bg-slate-50 text-slate-600 shadow-sm">
                {user.email}
              </div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-medium">Read only</span>
              </div>
            </div>
          </div>

          <div className="animate-in slide-in-from-bottom-4 fade-in duration-700">
            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>About Me</span>
            </label>
            <div className="relative group">
              <textarea
                className="w-full border-2 border-slate-200 rounded-xl p-4 pl-12 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300 resize-none shadow-sm hover:shadow-md bg-white h-32"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell us about yourself..."
              />
              <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

       
        <div className="flex flex-col sm:flex-row gap-4 w-full animate-in slide-in-from-bottom-5 fade-in duration-800">
          <button
            onClick={handleSave}
            className="relative flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-2xl hover:scale-105 transform overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Changes</span>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="relative flex-1 px-8 py-4 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-2xl hover:scale-105 transform overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log Out</span>
            </div>
          </button>
        </div>

        <div className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">Profile Tips</h4>
              <p className="text-sm text-blue-700">Your profile information is visible to other users. Make it meaningful!</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
      }
      
      .scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #6ee7b7;
        border-radius: 3px;
      }
      
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #34d399;
      }
    `}</style>
  </div>
);
}

export default ProfilePanel;