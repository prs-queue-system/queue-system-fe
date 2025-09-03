/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import {
  fetchAllQueues,
  createQueue,
  removePlayer,
  fetchPlayers,
  getQueueStatus,
  processNext,
  confirmTurn,
  fetchTimePatterns,
  movePlayer,
  type Player,
  type SimulatorQueue,
} from "../services/api";
import "../styles/components/Queue.css";
import F1Car from "./F1Car";

type QueueStatus = {
  isActive: boolean;
  currentPlayer?: Player;
  timeRemaining?: number;
};
type ActiveQueueItem = {
  id: number;
  player: Player;
  status: string;
  timeLeft: number;
};

const formatTimeRemaining = (timeLeft: number): string => {
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getCurrentActiveItem = (
  items: ActiveQueueItem[]
): ActiveQueueItem | undefined => {
  return items?.find(
    (item) => item.status === "ACTIVE" || item.status === "CONFIRMED"
  );
};

export default function Queue() {
  const [allQueues, setAllQueues] = useState<SimulatorQueue[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [timePatterns, setTimePatterns] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueStatuses, setQueueStatuses] = useState<
    Record<number, QueueStatus>
  >({});
  const [activeItems, setActiveItems] = useState<
    Record<number, ActiveQueueItem[]>
  >({});

  const loadAllQueues = useCallback(async () => {
    try {
      setError(null);
      const queues = await fetchAllQueues();
      setAllQueues(queues || []);

      const statuses: Record<number, QueueStatus> = {};
      const activeItemsMap: Record<number, ActiveQueueItem[]> = {};
      const statusPromises = (queues || []).map(async (queue) => {
        try {
          const status = await getQueueStatus(queue.simulatorId);
          return { queue, status };
        } catch {
          return { queue, status: null };
        }
      });

      const results = await Promise.allSettled(statusPromises);

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          const { queue, status } = result.value;
          if (status) {
            if (Array.isArray(status.data)) {
              activeItemsMap[queue.simulatorId] = status.data;
              const currentItem = getCurrentActiveItem(status.data);
              statuses[queue.simulatorId] = {
                isActive: !!currentItem,
                currentPlayer: currentItem ? currentItem.player : undefined,
              };
            } else {
              statuses[queue.simulatorId] = status.data;
            }
          } else {
            statuses[queue.simulatorId] = { isActive: false };
            activeItemsMap[queue.simulatorId] = [];
          }
        }
      });
      setQueueStatuses(statuses);
      setActiveItems(activeItemsMap);
    } catch (err) {
      setError("Erro ao carregar filas. Por favor, tente novamente.");
      console.error("Error loading queues:", err);
      setAllQueues([]);
    }
  }, []);

  const loadPlayers = useCallback(async () => {
    try {
      const playersList = await fetchPlayers();
      setPlayers(playersList || []);
    } catch (err) {
      console.error("Error loading players:", err);
      setError(
        "Erro ao carregar lista de jogadores. Por favor, tente novamente."
      );
      setPlayers([]);
    }
  }, []);

  const loadTimePatterns = useCallback(async () => {
    try {
      const patterns = await fetchTimePatterns();
      setTimePatterns(patterns || []);
    } catch (err) {
      console.error("Error loading time patterns:", err);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadAllQueues(), loadPlayers(), loadTimePatterns()]);
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // WebSocket connection with retry
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0;
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'QUEUE_UPDATE' || data.type === 'TIMED_QUEUE_UPDATE') {
              loadAllQueues();
            }
            if (data.type === 'PLAYER_UPDATE') {
              loadPlayers();
            }
          } catch (err) {
            console.error('WebSocket message error:', err);
          }
        };
        
        ws.onerror = () => {
          console.log('WebSocket error, falling back to polling');
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              if (!document.hidden) loadAllQueues();
            }, 3000);
          }
        };
        
        ws.onclose = () => {
          if (reconnectAttempts < 3) {
            setTimeout(() => {
              reconnectAttempts++;
              connectWebSocket();
            }, Math.pow(2, reconnectAttempts) * 1000);
          } else if (!pollInterval) {
            pollInterval = setInterval(() => {
              if (!document.hidden) loadAllQueues();
            }, 3000);
          }
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        if (!pollInterval) {
          pollInterval = setInterval(() => {
            if (!document.hidden) loadAllQueues();
          }, 3000);
        }
      }
    };
    
    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [loadAllQueues, loadPlayers, loadTimePatterns]);

  const handleAdd = async (simulatorId: number) => {
    if (selectedPlayerId === null) return;
    const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
    if (!selectedPlayer) return;

    try {
      const result = await createQueue(
        selectedPlayerId,
        simulatorId,
        selectedPattern?.timeMinutes || 5,
        selectedPattern?.price || 0
      );
      setSelectedPlayerId(null);
      setSelectedPattern(null);

      setAllQueues((prev) =>
        prev.map((sim) =>
          sim.simulatorId === simulatorId
            ? {
                ...sim,
                queue: [
                  ...sim.queue,
                  { id: result.id || Date.now(), player: selectedPlayer },
                ],
              }
            : sim
        )
      );
    } catch (err) {
      setError("Erro ao adicionar jogador à fila. Por favor, tente novamente.");
      console.error("Error adding player to queue:", err);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removePlayer(id);

      setAllQueues((prev) =>
        prev.map((sim) => ({
          ...sim,
          queue: sim.queue.filter((q) => q.id !== id),
        }))
      );
    } catch (err) {
      setError("Erro ao remover jogador da fila. Por favor, tente novamente.");
      console.error("Error removing player from queue:", err);
    }
  };



  const handleConfirmTurn = async (queueId: number) => {
    try {
      await confirmTurn(queueId);
      await loadAllQueues();
    } catch (err) {
      setError("Erro ao confirmar turno.");
      console.error("Error confirming turn:", err);
    }
  };

  const handleMissedTurn = async (simulatorId: number) => {
    try {
      await processNext(simulatorId);
      await loadAllQueues();
    } catch (err) {
      setError("Erro ao processar turno perdido.");
      console.error("Error handling missed turn:", err);
    }
  };

  const handleMovePlayer = async (queueId: number, direction: 'up' | 'down') => {
    const simulator = allQueues.find(q => q.queue.some(item => item.id === queueId));
    if (!simulator) return;
    
    const currentIndex = simulator.queue.findIndex(q => q.id === queueId);
    if (currentIndex === -1) return;
    
    const newPosition = direction === 'up' ? currentIndex : currentIndex + 2;
    
    if (newPosition < 1 || newPosition > simulator.queue.length) return;
    
    try {
      await movePlayer(queueId, newPosition);
      await loadAllQueues();
    } catch (err) {
      setError("Erro ao mover jogador.");
      console.error("Error moving player:", err);
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
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "end",
            marginBottom: "2rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "white",
              }}
            >
              Jogador
            </label>
            <select
              value={selectedPlayerId ?? ""}
              onChange={(e) =>
                setSelectedPlayerId(Number(e.target.value) || null)
              }
              style={{
                padding: "0.5rem",
                border: "2px solid #333",
                borderRadius: "8px",
                background: "#000",
                color: "white",
                minWidth: "200px",
              }}
            >
              <option value="">Selecione um jogador</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "white",
              }}
            >
              Padrão de Tempo
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {timePatterns.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => setSelectedPattern(pattern)}
                  style={{
                    padding: "0.75rem 1rem",
                    border: `2px solid ${selectedPattern?.id === pattern.id ? "#dc2626" : "#333"}`,
                    borderRadius: "8px",
                    background: selectedPattern?.id === pattern.id ? "#dc2626" : "#000",
                    color: "white",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {pattern.name}<br/>
                  <small>{pattern.timeMinutes}min - R$ {pattern.price.toFixed(2)}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="queues-grid">
        {allQueues.map((sim) => {
          const status = queueStatuses[sim.simulatorId];
          return (
            <div key={sim.simulatorId} className="queue-card" style={{ position: "relative" }}>
              {(() => {
                const currentItem = getCurrentActiveItem(activeItems[sim.simulatorId]);
                return currentItem && currentItem.status === "CONFIRMED" ? <F1Car isActive={true} /> : null;
              })()}
              <h3
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {sim.simulatorName}
                {(() => {
                  const currentItem = getCurrentActiveItem(
                    activeItems[sim.simulatorId]
                  );
                  if (!currentItem) return null;

                  if (currentItem.status === "CONFIRMED") {
                    return (
                      <span style={{ color: "#4caf50", fontSize: "0.9rem" }}>
                        jogando
                      </span>
                    );
                  }

                  if (currentItem.status === "ACTIVE") {
                    return (
                      <span style={{ color: "#dc2626", fontSize: "0.9rem" }}>
                        aguardando
                      </span>
                    );
                  }

                  return null;
                })()}
              </h3>

              {status?.isActive && (
                <div className="timed-status">
                  {(() => {
                    const currentItem = getCurrentActiveItem(
                      activeItems[sim.simulatorId]
                    );
                    if (!currentItem) return null;

                    if (currentItem.status === "ACTIVE") {
                      const timeDisplay = currentItem.timeLeft
                        ? ` - ${formatTimeRemaining(currentItem.timeLeft)}`
                        : "";
                      return (
                        <p>
                          Aguardando pelo jogador: {status.currentPlayer?.name}
                          {timeDisplay}
                        </p>
                      );
                    }

                    return (
                      <p>
                        Jogador atual: {status.currentPlayer?.name}
                        {currentItem.timeLeft
                          ? ` - ${formatTimeRemaining(currentItem.timeLeft)}`
                          : ""}
                      </p>
                    );
                  })()}
                </div>
              )}

              <div className="queue-controls">
                <button
                  onClick={() => handleAdd(sim.simulatorId)}
                  disabled={selectedPlayerId === null || selectedPattern === null}
                  style={{
                    width: "100%",
                    padding: "1rem 2rem",
                    background: selectedPlayerId === null || selectedPattern === null ? "#666" : "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    cursor: selectedPlayerId === null || selectedPattern === null ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  Adicionar à Fila
                </button>
              </div>

              <div className="queue-list">
                {(() => {
                  const currentItem = getCurrentActiveItem(activeItems[sim.simulatorId]);
                  const queueItems = (sim.queue || []).slice();
                  const currentPlayerInQueue = currentItem ? queueItems.find(q => q.player?.id === currentItem.player.id) : null;
                  const nextPlayers = queueItems.filter(q => q.player?.id !== currentItem?.player.id);

                  return (
                    <>
                      {currentPlayerInQueue && (
                        <>
                          <div style={{ color: "white", fontSize: "0.9rem", marginBottom: "0.5rem", fontWeight: "bold" }}>Jogando</div>
                          <div style={{
                            background: "rgba(220, 38, 38, 0.3)",
                            border: "1px solid #dc2626",
                            borderRadius: "6px",
                            padding: "0.75rem",
                            marginBottom: "1rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}>
                            <span style={{ color: "white" }}>{currentPlayerInQueue.player?.name ?? "Sem nome"}</span>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button onClick={() => handleRemove(currentPlayerInQueue.id)} className="remove-button">Remover</button>
                              {currentItem?.status === "ACTIVE" && (
                                <button onClick={() => handleConfirmTurn(currentItem!.id)} className="confirm-button">Confirmar</button>
                              )}
                              <button onClick={() => handleMissedTurn(sim.simulatorId)} className="missed-button">Próximo jogador</button>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {nextPlayers.length > 0 && (
                        <>
                          <div style={{ color: "white", fontSize: "0.9rem", marginBottom: "0.5rem", fontWeight: "bold" }}>Próximo</div>
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {nextPlayers.map((q, index) => (
                              <li key={q.id} style={{
                                background: "#1a1a1a",
                                border: "1px solid #333",
                                borderRadius: "6px",
                                padding: "0.75rem",
                                marginBottom: "0.5rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}>
                                <span style={{ color: "white" }}>{index + 1}. {q.player?.name ?? "Sem nome"}</span>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                  {nextPlayers.length >= 2 && (
                                    <>
                                      <button 
                                        onClick={() => handleMovePlayer(q.id, 'up')}
                                        disabled={index === 0}
                                        style={{
                                          padding: "0.25rem 0.5rem",
                                          background: index === 0 ? "#666" : "#333",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          cursor: index === 0 ? "not-allowed" : "pointer",
                                          fontSize: "0.8rem"
                                        }}
                                        title="Subir posição"
                                      >
                                        ↑
                                      </button>
                                      <button 
                                        onClick={() => handleMovePlayer(q.id, 'down')}
                                        disabled={index === nextPlayers.length - 1}
                                        style={{
                                          padding: "0.25rem 0.5rem",
                                          background: index === nextPlayers.length - 1 ? "#666" : "#333",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          cursor: index === nextPlayers.length - 1 ? "not-allowed" : "pointer",
                                          fontSize: "0.8rem"
                                        }}
                                        title="Descer posição"
                                      >
                                        ↓
                                      </button>
                                    </>
                                  )}
                                  <button onClick={() => handleRemove(q.id)} className="remove-button">Remover</button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      
                      {(!sim.queue || sim.queue.length === 0) && (
                        <div style={{ color: "#666", textAlign: "center", padding: "2rem" }}>Fila vazia</div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
