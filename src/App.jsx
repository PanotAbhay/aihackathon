import { Routes, Route } from "react-router-dom";
import { ComposePage } from "./pages/Compose/ComposePage.jsx";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ComposePage />} />
    </Routes>
  );
}
