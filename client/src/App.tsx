import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import AegisCommandCenter from "./components/SurveillanceDashboard";
import FeedInjector from "./components/FeedInjector"; // New Component

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<AegisCommandCenter />} />
      <Route path="/inject" element={<FeedInjector />} />
    </Routes>
  );
}