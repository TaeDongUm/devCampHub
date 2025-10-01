import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignupChoice from "./pages/SignupChoice";
import SignupAdmin from "./pages/SignupAdmin";
import SignupStudent from "./pages/SignupStudent";
import Verify from "./pages/VerifyEmail";

function RoutedHome() {
  const navigate = useNavigate();
  return <Home onStart={() => navigate("/login")} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoutedHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signupchoice" element={<SignupChoice />} />
        <Route path="/signup/admin" element={<SignupAdmin />} />
        <Route path="/signup/student" element={<SignupStudent />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  );
}
