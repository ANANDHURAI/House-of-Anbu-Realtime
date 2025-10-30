import React from "react";

function MainPanel({ user }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gray-50 p-6 text-center">
      <div className="mx-auto mb-6 w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-5xl">
        💬
      </div>
      <h2 className="text-2xl font-semibold mb-2 text-gray-700">
        Welcome, {user.name?.split(" ")[0]}!
      </h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Send and receive messages seamlessly across devices.
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Start a chat or view your contacts when ready.
      </p>
    </div>
  );
}

export default MainPanel;
