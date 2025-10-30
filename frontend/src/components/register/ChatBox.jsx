import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";

function ChatBox({ messages }) {
  return (
    <div className="flex flex-col space-y-2 overflow-y-auto h-80 border p-3 rounded-lg bg-gray-50">
      <AnimatePresence>
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <MessageBubble text={msg.text} sender={msg.sender} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ChatBox;
