import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Seller from './pages/Seller';
import Login from './pages/Login';
import "./App.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <div className="app-container">
            <Admin />
          </div>
        } />
        <Route path="/register" element={<Register />} />
        <Route path="/seller" element={<Seller />} />
      </Routes>
    </Router>
  );
}
