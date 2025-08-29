import { useEffect, useState, useCallback } from "react";
import { fetchSimulators, createSimulator } from "../services/api";

type Simulator = {
  id: number;
  name: string;
  active: boolean;
};

export default function Simulators() {
  const [simulators, setSimulators] = useState<Simulator[]>([]);
  const [newName, setNewName] = useState("");

  const loadSimulators = useCallback(async () => {
    try {
      const simulatorsList = await fetchSimulators();
      setSimulators(simulatorsList);
    } catch (error) {
      console.error('Error loading simulators:', error);
    }
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createSimulator(newName);
      setNewName("");
      loadSimulators();
    } catch (error) {
      console.error('Error creating simulator:', error);
    }
  };

  useEffect(() => {
    loadSimulators();
    const interval = setInterval(loadSimulators, 5000);
    return () => clearInterval(interval);
  // amazonq-ignore-next-line
  }, []);

  return (
    <div>
      <h2>Simuladores Ativos</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Nome do simulador"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={handleCreate}>Criar</button>
      </div>

      <ul>
        {simulators.map(s => (
          <li key={s.id}>
            {s.id} - {s.name} - {s.active ? "Ativo" : "Inativo"}
          </li>
        ))}
      </ul>
    </div>
  );
}
