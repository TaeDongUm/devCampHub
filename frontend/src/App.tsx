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
import Notice from "./pages/Notice";
import Qna from "./pages/Qna";
import Resources from "./pages/Resources";
import Lounge from "./pages/Lounge";
import StudyQuestions from "./pages/StudyQuestions";
import LiveLecture from "./pages/LiveLecture";
import Mogakco from "./pages/Mogakco";
import MyAttendance from "./pages/MyAttendance";

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
        <Route path="/camp/:id" element={<CampDetail />} />
        <Route path="/dashboard/home" element={<DashBoardHome />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/camp/:campId/notice" element={<Notice />} />
        <Route path="/camp/:campId/qna" element={<Qna />} />
        <Route path="/camp/:campId/resources" element={<Resources />} />
        <Route path="/camp/:campId/lounge" element={<Lounge />} />
        <Route path="/camp/:campId/study-questions" element={<StudyQuestions />} />
        <Route path="/camp/:campId/live" element={<LiveLecture />} />
        <Route path="/camp/:campId/mogakco" element={<Mogakco />} />
        <Route path="/camp/:campId/attendance" element={<MyAttendance />} />
      </Routes>
    </BrowserRouter>
  );
}
