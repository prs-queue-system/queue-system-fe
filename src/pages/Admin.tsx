/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Player from "../components/Player";
import Queue from "../components/Queue";
import Simulators from "../components/Simulators";
import UserManagement from "../components/UserManagement";

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
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            width: "300px",
            height: "82px",
            backgroundImage:
              'url("https://loja.prsim.com.br/wp-content/uploads/2025/04/prs-preto-branco-vermelho-300x82.png")',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        ></div>
        <h1 className="app-title" style={{ margin: 0, flex: 1 }}>
          Sistema de Filas e Simuladores - {user.role}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "white" }}>Olá, {user.name}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: "0.5rem 1rem",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {ADMIN_ROLES.includes(user.role) && (
        <div className="section">
          <UserManagement userRole={user.role} />
        </div>
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
    </>
  );
}
