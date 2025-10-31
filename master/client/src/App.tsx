import React from "react";
import TerminalLogin from "./components/TerminalLogin";
import { BrowserRouter, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
    <TerminalLogin />
    <Routes>
      <Route path="/home" element={<Home />} />
    </Routes>
  </BrowserRouter>);
}
