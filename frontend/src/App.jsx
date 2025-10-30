import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Checking from "./Checking";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/commonpage/HomePage";
import Login from "./pages/auth/LoginPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<HomePage />} />             
        <Route path="/register" element={<RegisterPage />} />  
        <Route path="/login" element={<Login />} />  
        <Route path="/" element={<Login />} />  
                         
      </Routes>
    </Router>
  );
}

export default App;
