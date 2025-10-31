// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/chatpages/HomePage";
import Login from "./pages/auth/LoginPage";
import ChatRoomPage from "./pages/chatpages/ChatRoomPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />  
        <Route path="/login" element={<Login />} />  
        <Route path="/register" element={<RegisterPage />} />  
        <Route path="/home" element={<HomePage />} />
        <Route path="/chat/:chatId" element={<ChatRoomPage />} />
      </Routes>
    </Router>
  );
}

export default App;