import { useEffect, useState, useCallback } from 'react';
import { fetchAllQueues, createQueue, removePlayer, fetchPlayers } from '../services/api';
import './Queue.css';

type Player = { id: number; name: string };
type QueueItem = { id: number; Player: Player };
type SimulatorQueue = { simulatorId: number; simulatorName: string; queue: QueueItem[] };

export default function Queue() {
  const [allQueues, setAllQueues] = useState<SimulatorQueue[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega todas as filas da API
  const loadAllQueues = useCallback(async () => {
    try {
      setError(null);
      const queues = await fetchAllQueues();
      setAllQueues(queues || []);
    } catch (err) {
      setError('Erro ao carregar filas. Por favor, tente novamente.');
      console.error('Error loading queues:', err);
      setAllQueues([]);
    }
  }, []);

  // Carrega lista de jogadores
  const loadPlayers = useCallback(async () => {
    try {
      const playersList = await fetchPlayers();
      setPlayers(playersList || []);
    } catch (err) {
      console.error('Error loading players:', err);
      setError('Erro ao carregar lista de jogadores. Por favor, tente novamente.');
      setPlayers([]);
    }
  }, []);

  // Carrega dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadAllQueues(), loadPlayers()]);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
    const interval = setInterval(loadAllQueues, 3000);
    return () => clearInterval(interval);
  }, []);

  // Adiciona jogador na fila de um simulador específico
  const handleAdd = async (simulatorId: number) => {
    if (selectedPlayerId === null) return;
    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) return;
    
    try {
      const result = await createQueue(selectedPlayerId, simulatorId);
      setSelectedPlayerId(null);
      
      // Optimistic update
      setAllQueues(prev => prev.map(sim => 
        sim.simulatorId === simulatorId 
          ? { ...sim, queue: [...sim.queue, { id: result.id || Date.now(), Player: selectedPlayer }] }
          : sim
      ));
    } catch (err) {
      setError('Erro ao adicionar jogador à fila. Por favor, tente novamente.');
      console.error('Error adding player to queue:', err);
    }
  };

  // Remove jogador da fila
  const handleRemove = async (id: number) => {
    try {
      await removePlayer(id);
      
      // Optimistic update
      setAllQueues(prev => prev.map(sim => ({
        ...sim,
        queue: sim.queue.filter(q => q.id !== id)
      })));
    } catch (err) {
      setError('Erro ao remover jogador da fila. Por favor, tente novamente.');
      console.error('Error removing player from queue:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Carregando filas...</p>
      </div>
    );
  }

  return (
    <div className="queue-container">
      <h2>Filas de Simuladores</h2>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="player-selector">
        <select
          value={selectedPlayerId ?? ""}
          onChange={(e) => setSelectedPlayerId(Number(e.target.value) || null)}
        >
          <option value="">Selecione um jogador</option>
          {players.map(player => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </div>

      <div className="queues-grid">
        {allQueues.map(sim => (
          <div key={sim.simulatorId} className="queue-card">
            <h3>{sim.simulatorName}</h3>
            <button
              onClick={() => handleAdd(sim.simulatorId)}
              disabled={selectedPlayerId === null}
              className="add-button"
            >
              Adicionar à Fila
            </button>
            <ul className="queue-list">
              {(sim.queue || []).map(q => (
                <li key={q.id} className="queue-item">
                  <span>{q.Player?.name ?? "Sem nome"}</span>
                  <button
                    onClick={() => handleRemove(q.id)}
                    className="remove-button"
                  >
                    Remover
                  </button>
                </li>
              ))}
              {(!sim.queue || sim.queue.length === 0) && (
                <li className="empty-queue">Fila vazia</li>
              )}
            </ul>
          </div>
        ))}
        {allQueues.length === 0 && (
          <p className="no-simulators">Nenhum simulador disponível</p>
        )}
      </div>
    </div>
  );
}
