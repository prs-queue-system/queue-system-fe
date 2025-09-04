/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from "react";
import {
  fetchSimulators,
  createSimulator,
  updateSimulator,
  deleteSimulator,
} from "../services/api";

type Simulator = {
  id: number;
  name: string;
  active: boolean;
  pcIp?: string;
};

export default function Simulators() {
  const [simulators, setSimulators] = useState<Simulator[]>([]);
  const [newName, setNewName] = useState("");
  const [newPcIp, setNewPcIp] = useState("");
  const [editingSimulator, setEditingSimulator] = useState<number | null>(null);
  const [editPcIp, setEditPcIp] = useState("");

  const loadSimulators = useCallback(async () => {
    try {
      const simulatorsList = await fetchSimulators();
      setSimulators(simulatorsList);
    } catch (error) {
      console.error(
        "Error loading simulators:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createSimulator(newName, newPcIp.trim() || undefined);
      setNewName("");
      setNewPcIp("");
      loadSimulators();
    } catch (error) {
      console.error(
        "Error creating simulator:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSimulator(id);
      loadSimulators();
    } catch (error) {
      console.error(
        "Error deleting simulator:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  useEffect(() => {
    loadSimulators();
    const interval = setInterval(loadSimulators, 10000);
    return () => clearInterval(interval);
    // amazonq-ignore-next-line
  }, []);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await updateSimulator(id, { active: !currentActive });
      setSimulators((prev) =>
        prev.map((sim) =>
          sim.id === id ? { ...sim, active: !currentActive } : sim
        )
      );
    } catch (error) {
      console.error("Error updating simulator status:", error);
    }
  };

  const handleEditPcIp = (simulatorId: number, currentPcIp: string) => {
    setEditingSimulator(simulatorId);
    setEditPcIp(currentPcIp || "");
  };

  const handleSavePcIp = async (simulatorId: number) => {
    try {
      await updateSimulator(simulatorId, { pcIp: editPcIp.trim() || undefined });
      setSimulators((prev) =>
        prev.map((sim) =>
          sim.id === simulatorId ? { ...sim, pcIp: editPcIp.trim() || undefined } : sim
        )
      );
      setEditingSimulator(null);
      setEditPcIp("");
    } catch (error) {
      console.error("Error updating PC IP:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingSimulator(null);
    setEditPcIp("");
  };

  return (
    <div>
      <h2 style={{ color: "white", marginBottom: "2rem" }}>Simuladores</h2>

      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Nome do simulador"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              padding: "0.5rem",
              border: "2px solid #333",
              borderRadius: "8px",
              background: "#000",
              color: "white",
              flex: 1,
            }}
          />
          <input
            type="text"
            placeholder="IP do PC (ex: 192.168.1.100)"
            value={newPcIp}
            onChange={(e) => setNewPcIp(e.target.value)}
            style={{
              padding: "0.5rem",
              border: "2px solid #333",
              borderRadius: "8px",
              background: "#000",
              color: "white",
              flex: 1,
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            style={{
              padding: "0.5rem 1rem",
              background: !newName.trim() ? "#666" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: !newName.trim() ? "not-allowed" : "pointer",
            }}
          >
            Criar
          </button>
        </div>
        <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
          💡 O IP do PC é usado para conectar ao AC Launcher na porta 8090. Deixe em branco se não usar AC Launcher.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {simulators.map((s) => (
          <div
            key={s.id}
            style={{
              background: "#1a1a1a",
              border: "2px solid #333",
              borderRadius: "12px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  fontSize: "2rem",
                  color: s.active ? "#dc2626" : "#666",
                }}
              >
                🏎️
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: "white", margin: 0, fontSize: "1.2rem" }}>
                  {s.name}
                </h3>
                <p style={{ color: "#666", margin: 0, fontSize: "0.9rem" }}>
                  ID: {s.id}
                </p>
                <div style={{ marginTop: "0.5rem" }}>
                  {editingSimulator === s.id ? (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="text"
                        value={editPcIp}
                        onChange={(e) => setEditPcIp(e.target.value)}
                        placeholder="IP do PC"
                        style={{
                          padding: "0.25rem 0.5rem",
                          border: "1px solid #333",
                          borderRadius: "4px",
                          background: "#000",
                          color: "white",
                          fontSize: "0.8rem",
                          flex: 1,
                        }}
                      />
                      <button
                        onClick={() => handleSavePcIp(s.id)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          background: "#4caf50",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: "0.25rem 0.5rem",
                          background: "#666",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                      }}
                      onClick={() => handleEditPcIp(s.id, s.pcIp || "")}
                    >
                      <span style={{ color: "#888", fontSize: "0.8rem" }}>🖥️</span>
                      <span style={{ color: s.pcIp ? "#4caf50" : "#666", fontSize: "0.8rem" }}>
                        {s.pcIp || "Sem AC Launcher"}
                      </span>
                      <span style={{ color: "#666", fontSize: "0.7rem" }}>✏️</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ color: "white", fontSize: "0.9rem" }}>
                  Ativo
                </span>
                <div
                  onClick={() => handleToggleActive(s.id, s.active)}
                  style={{
                    width: "50px",
                    height: "24px",
                    borderRadius: "12px",
                    background: s.active ? "#dc2626" : "#666",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "white",
                      position: "absolute",
                      top: "2px",
                      left: s.active ? "28px" : "2px",
                      transition: "left 0.3s ease",
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => handleDelete(s.id)}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
