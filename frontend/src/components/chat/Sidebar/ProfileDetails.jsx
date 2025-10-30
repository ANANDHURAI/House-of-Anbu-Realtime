import React from "react";

function ProfileDetails({ user }) {
  return (
    <div className="p-4 overflow-y-auto flex-1">
      <h3 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">
        Profile Details
      </h3>
      <div className="space-y-3 text-sm text-gray-600">
        <p>
          <span className="font-semibold">Name:</span> {user.name}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {user.email}
        </p>
        {user.phone && (
          <p>
            <span className="font-semibold">Phone:</span> {user.phone}
          </p>
        )}
        {user.about_me && (
          <p>
            <span className="font-semibold">About:</span> {user.about_me}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProfileDetails;
