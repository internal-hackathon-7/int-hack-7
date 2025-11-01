import React from "react";
import TerminalLogin from "./components/TerminalLogin";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RoomPage from "./pages/RoomPage";
import MemberActivityPage from "./pages/MemberActivityPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<TerminalLogin />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route
          path="/room/:roomId/member/:googleId"
          element={<MemberActivityPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}
