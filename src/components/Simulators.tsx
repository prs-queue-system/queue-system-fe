/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from "react";
import { fetchSimulators, createSimulator, deleteSimulator } from "../services/api";

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

  const handleDelete = async (id: number) => {
    try {
      await deleteSimulator(id);
      loadSimulators();
    } catch (error) {
      console.error('Error deleting simulator:', error);
    }
  };

  useEffect(() => {
    loadSimulators();
    const interval = setInterval(loadSimulators, 5000);
    return () => clearInterval(interval);
  // amazonq-ignore-next-line
  }, []);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    // TODO: Add API call to update simulator active status
    console.log(`Toggle simulator ${id} to ${!currentActive}`);
    // For now, just update local state
    setSimulators(prev => prev.map(sim => 
      sim.id === id ? { ...sim, active: !currentActive } : sim
    ));
  };

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '2rem' }}>Simuladores</h2>

      <div style={{ marginBottom: "2rem", display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Nome do simulador"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '2px solid #333',
            borderRadius: '8px',
            background: '#000',
            color: 'white',
            flex: 1
          }}
        />
        <button 
          onClick={handleCreate}
          disabled={!newName.trim()}
          style={{
            padding: '0.5rem 1rem',
            background: !newName.trim() ? '#666' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !newName.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          Criar
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {simulators.map(s => (
          <div key={s.id} style={{
            background: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                fontSize: '2rem',
                color: s.active ? '#dc2626' : '#666'
              }}>
                🏎️
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>{s.name}</h3>
                <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>ID: {s.id}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'white', fontSize: '0.9rem' }}>Ativo</span>
                <div 
                  onClick={() => handleToggleActive(s.id, s.active)}
                  style={{
                    width: '50px',
                    height: '24px',
                    borderRadius: '12px',
                    background: s.active ? '#dc2626' : '#666',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: s.active ? '28px' : '2px',
                    transition: 'left 0.3s ease'
                  }} />
                </div>
              </div>
              
              <button 
                onClick={() => handleDelete(s.id)}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
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
