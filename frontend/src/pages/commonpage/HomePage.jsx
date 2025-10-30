import React, { useState, useEffect } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";
import { useNavigate } from "react-router-dom";

import ProfileDetails from "../../components/chat/Sidebar/ProfileDetails";
import SidebarHeader from "../../components/chat/Sidebar/SidebarHeader";
import MainPanel from "../../components/chat/Sidebar/MainPanel";
import LoadingSpinner from "../../components/chat/layout/LoadingSpinner";

// import SearchUser from "../../components/chat/layout/SearchUser";


function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await AxiosInstance.get("/auth/profile/");
      setUser(res.data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) return <LoadingSpinner />;

  if (!user)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-600">
        <p>Unable to load user data. Please log in again.</p>
        <button
          onClick={handleLogout}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          Go to Login
        </button>
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar */}
      
      <aside className="w-full md:w-1/3 bg-white border-r shadow-sm flex flex-col">
        <SidebarHeader user={user} onLogout={handleLogout} />
        <ProfileDetails user={user} />
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col">
        <MainPanel user={user} />
      </main>
    </div>
  );
}

export default HomePage;
