/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Player from "../components/Player";
import Queue from "../components/Queue";
import Simulators from "../components/Simulators";
import UserManagement from "../components/UserManagement";
// import TimePatterns from "../components/TimePatterns";
import "../styles/pages/Admin.css";

export default function Admin() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      let parsedUser;
      try {
        parsedUser = JSON.parse(userData);
      } catch {
        window.location.replace("/login");
        return;
      }

      const ADMIN_ROLES = ["MASTER", "ADMIN"];
      if (!ADMIN_ROLES.includes(parsedUser.role)) {
        window.location.replace("/login");
        return;
      }
      setUser(parsedUser);
    } else {
      window.location.replace("/login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.replace("/login");
  };

  const ADMIN_ROLES = ["MASTER", "ADMIN"];

  if (!user) return <div>Carregando...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-logo"></div>
        <h1 className="app-title">Sistema de filas e simuladores</h1>
        <div className="user-info">
          <span>Olá, {user.name}</span>
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </div>

      {ADMIN_ROLES.includes(user.role) && (
        <>
          <div className="section">
            <UserManagement userRole={user.role} />
          </div>
          {/* <div className="section">
            <TimePatterns />
          </div> */}
        </>
      )}

      <div className="section">
        <Player />
      </div>
      <div className="section">
        <Queue />
      </div>
      <div className="section">
        <Simulators />
      </div>
    </div>
  );
}
