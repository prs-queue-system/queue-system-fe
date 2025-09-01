import { useEffect, useState, useCallback } from 'react';
import { fetchAllQueues, createQueue, removePlayer, fetchPlayers, startTimedQueue, getQueueStatus, processNext, confirmTurn, handleMissed, type Player, type SimulatorQueue } from '../services/api';
import './Queue.css';

type QueueStatus = { isActive: boolean; currentPlayer?: { id: number; name: string }; timeRemaining?: number };
type ActiveQueueItem = { id: number; player: { id: number; name: string }; status: string; timeLeft: number };

export default function Queue() {
  const [allQueues, setAllQueues] = useState<SimulatorQueue[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueStatuses, setQueueStatuses] = useState<Record<number, QueueStatus>>({});
  const [activeItems, setActiveItems] = useState<Record<number, ActiveQueueItem[]>>({});

  const loadAllQueues = useCallback(async () => {
    try {
      setError(null);
      const queues = await fetchAllQueues();
      setAllQueues(queues || []);
      
      const statuses: Record<number, QueueStatus> = {};
      const activeItemsMap: Record<number, ActiveQueueItem[]> = {};
      for (const queue of queues || []) {
        try {
          const status = await getQueueStatus(queue.simulatorId);
          if (Array.isArray(status.data)) {
            activeItemsMap[queue.simulatorId] = status.data;
            const activeItem = status.data.find((item: ActiveQueueItem) => item.status === 'ACTIVE');
            statuses[queue.simulatorId] = { 
              isActive: !!activeItem,
              currentPlayer: activeItem ? activeItem.player : undefined
            };
          } else {
            statuses[queue.simulatorId] = status.data;
          }
        } catch {
          statuses[queue.simulatorId] = { isActive: false };
          activeItemsMap[queue.simulatorId] = [];
        }
      }
      setQueueStatuses(statuses);
      setActiveItems(activeItemsMap);
    } catch (err) {
      setError('Erro ao carregar filas. Por favor, tente novamente.');
      console.error('Error loading queues:', err);
      setAllQueues([]);
    }
  }, []);

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
  }, [loadAllQueues, loadPlayers]);

  const handleAdd = async (simulatorId: number) => {
    if (selectedPlayerId === null) return;
    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) return;
    
    try {
      const result = await createQueue(selectedPlayerId, simulatorId);
      setSelectedPlayerId(null);
      
      setAllQueues(prev => prev.map(sim => 
        sim.simulatorId === simulatorId 
          ? { ...sim, queue: [...sim.queue, { id: result.id || Date.now(), player: selectedPlayer }] }
          : sim
      ));
    } catch (err) {
      setError('Erro ao adicionar jogador à fila. Por favor, tente novamente.');
      console.error('Error adding player to queue:', err);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removePlayer(id);
      
      setAllQueues(prev => prev.map(sim => ({
        ...sim,
        queue: sim.queue.filter(q => q.id !== id)
      })));
    } catch (err) {
      setError('Erro ao remover jogador da fila. Por favor, tente novamente.');
      console.error('Error removing player from queue:', err);
    }
  };

  const handleStartTimed = async (simulatorId: number) => {
    try {
      await startTimedQueue(simulatorId);
      await loadAllQueues();
    } catch (err) {
      setError('Funcionalidade de fila temporizada não disponível no servidor.');
      console.error('Error starting timed queue:', err);
    }
  };

  const handleProcessNext = async (simulatorId: number) => {
    try {
      await processNext(simulatorId);
      await loadAllQueues();
    } catch (err) {
      setError('Erro ao processar próximo jogador.');
      console.error('Error processing next:', err);
    }
  };

  const handleConfirmTurn = async (queueId: number) => {
    try {
      await confirmTurn(queueId);
      await loadAllQueues();
    } catch (err) {
      setError('Erro ao confirmar turno.');
      console.error('Error confirming turn:', err);
    }
  };

  const handleMissedTurn = async (queueId: number) => {
    try {
      await handleMissed(queueId);
      await loadAllQueues();
    } catch (err) {
      setError('Erro ao processar turno perdido.');
      console.error('Error handling missed turn:', err);
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
        {allQueues.map(sim => {
          const status = queueStatuses[sim.simulatorId];
          return (
            <div key={sim.simulatorId} className="queue-card">
              <h3>{sim.simulatorName}</h3>
              
              {status?.isActive && (
                <div className="timed-status">
                  <p>Jogador atual: {status.currentPlayer?.name}
                    {activeItems[sim.simulatorId]?.find(item => item.status === 'ACTIVE')?.timeLeft && 
                      ` - ${Math.floor(activeItems[sim.simulatorId].find(item => item.status === 'ACTIVE')!.timeLeft / 60000)}:${String(Math.floor((activeItems[sim.simulatorId].find(item => item.status === 'ACTIVE')!.timeLeft % 60000) / 1000)).padStart(2, '0')}`
                    }
                  </p>
                </div>
              )}
              
              <div className="queue-controls">
                <button
                  onClick={() => handleAdd(sim.simulatorId)}
                  disabled={selectedPlayerId === null}
                  className="add-button"
                >
                  Adicionar à Fila
                </button>
                
                <button
                  onClick={() => handleStartTimed(sim.simulatorId)}
                  disabled={status?.isActive}
                  className="timed-button"
                >
                  Iniciar Fila Temporizada
                </button>
                
                <button
                  onClick={() => handleProcessNext(sim.simulatorId)}
                  disabled={!status?.isActive}
                  className="next-button"
                >
                  Próximo Jogador
                </button>
              </div>
              
              <ul className="queue-list">
                {(sim.queue || []).slice().reverse().map(q => (
                  <li key={q.id} className="queue-item">
                    <span>{q.player?.name ?? "Sem nome"}</span>
                    <div className="item-controls">
                      <button
                        onClick={() => handleRemove(q.id)}
                        className="remove-button"
                      >
                        Remover
                      </button>
                      {status?.isActive && status.currentPlayer?.name === q.player?.name && (
                        <>
                          <button
                            onClick={() => handleConfirmTurn(q.id)}
                            className="confirm-button"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleMissedTurn(q.id)}
                            className="missed-button"
                          >
                            Perdeu Turno
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
                {(!sim.queue || sim.queue.length === 0) && (
                  <li className="empty-queue">Fila vazia</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}