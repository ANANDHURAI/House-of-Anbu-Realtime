import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/chatpages/HomePage";
import Login from "./pages/auth/LoginPage";
import VideoCallPage from "./pages/video/VideoCallPage";
import CallHistoryPage from "./pages/video/CallHistoryPage";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={ <PublicRoute><Login /></PublicRoute> } />  
        <Route path="/login" element={ <PublicRoute><Login /></PublicRoute> } />  
        <Route path="/register" element={ <PublicRoute><RegisterPage /></PublicRoute> } />  

        
        <Route path="/home" element={ <ProtectedRoute><HomePage /></ProtectedRoute> } />
        <Route path="/videocall/:room_name" element={ <ProtectedRoute><VideoCallPage /></ProtectedRoute> } />
        <Route path="/call-history" element={ <ProtectedRoute><CallHistoryPage /></ProtectedRoute> } />
      </Routes>
    </Router>
  );
}

export default App;