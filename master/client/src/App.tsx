import React from "react";
import TerminalLogin from "./components/TerminalLogin";
import { BrowserRouter, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/" element={<TerminalLogin />} />
    </Routes>
  </BrowserRouter>);
}
