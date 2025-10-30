import React from "react";

function MessageBubble({ text, sender }) {
  return (
    <div
      className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
        sender === "bot"
          ? "bg-indigo-100 text-gray-800 self-start"
          : "bg-indigo-600 text-white self-end"
      }`}
    >
      {text instanceof File ? text.name : text}
    </div>
  );
}

export default MessageBubble;
