import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignupChoice from "./pages/SignupChoice";
import SignupAdmin from "./pages/SignupAdmin";
import SignupStudent from "./pages/SignupStudent";
import Verify from "./pages/VerifyEmail";
import AdminHome from "./pages/AdminHome";
import StudentHome from "./pages/StudentHome";
import CampDetail from "./pages/CampDetail";
import DashBoardHome from "./pages/DashBoardHome";
import Settings from "./pages/Settings";
import Attendance from "./pages/Attendance";
import MyPage from "./pages/MyPage";

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
        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/student/home" element={<StudentHome />} />
        <Route path="/camp/:campId" element={<CampDetail />} />
        <Route path="/dashboard/home" element={<DashBoardHome />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/camp/:campId/attendance" element={<Attendance />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
