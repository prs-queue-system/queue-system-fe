import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from './pages/Admin';
import Register from './pages/Register';
import "./App.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/admin" element={
          <div className="app-container">
            <Admin />
          </div>
        } />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}
