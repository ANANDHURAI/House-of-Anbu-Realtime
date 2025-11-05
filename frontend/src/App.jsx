// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/chatpages/HomePage";
import Login from "./pages/auth/LoginPage";
import VideoCallPage from "./pages/video/VideoCallPage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />  
        <Route path="/login" element={<Login />} />  
        <Route path="/register" element={<RegisterPage />} />  
        <Route path="/home" element={<HomePage />} />
        <Route path="/videocall/:room_name" element={<VideoCallPage />} />
      </Routes>
    </Router>
  );
}

export default App;