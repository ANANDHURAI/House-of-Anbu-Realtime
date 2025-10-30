import React from "react";

function SidebarHeader({ user, onLogout }) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
      <div className="flex items-center space-x-3">
        {user.profile_image ? (
          <img
            src={user.profile_image}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="font-semibold text-gray-800">{user.name}</h2>
          <p className="text-sm text-green-500">Online</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="text-sm text-red-500 hover:text-red-600"
      >
        Logout
      </button>
    </div>
  );
}

export default SidebarHeader;
