import { useEffect, useState, useCallback } from "react";
import {
  fetchAllQueues,
  createQueue,
  removePlayer,
  fetchPlayers,
  startTimedQueue,
  getQueueStatus,
  processNext,
  confirmTurn,
  handleMissed,
  type Player,
  type SimulatorQueue,
} from "../services/api";
import "./Queue.css";

type QueueStatus = {
  isActive: boolean;
  currentPlayer?: { id: number; name: string };
  timeRemaining?: number;
};
type ActiveQueueItem = {
  id: number;
  player: { id: number; name: string };
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
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [timeMinutes, setTimeMinutes] = useState(5);
  const [amountPaid, setAmountPaid] = useState(0);
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

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadAllQueues(), loadPlayers()]);
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    let interval: NodeJS.Timeout;
    const startPolling = () => {
      interval = setInterval(() => {
        if (!document.hidden) {
          loadAllQueues();
        }
      }, 5000);
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadAllQueues, loadPlayers]);

  const handleAdd = async (simulatorId: number) => {
    if (selectedPlayerId === null) return;
    const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
    if (!selectedPlayer) return;

    try {
      const result = await createQueue(
        selectedPlayerId,
        simulatorId,
        timeMinutes,
        amountPaid
      );
      setSelectedPlayerId(null);
      setTimeMinutes(5);
      setAmountPaid(0);

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

  const handleStartTimed = async (simulatorId: number) => {
    try {
      await startTimedQueue(simulatorId);
      await loadAllQueues();
    } catch (err) {
      setError(
        "Funcionalidade de fila temporizada não disponível no servidor."
      );
      console.error("Error starting timed queue:", err);
    }
  };

  const handleProcessNext = async (simulatorId: number) => {
    try {
      await processNext(simulatorId);
      await loadAllQueues();
    } catch (err) {
      setError("Erro ao processar próximo jogador.");
      console.error("Error processing next:", err);
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

  const handleMissedTurn = async (queueId: number) => {
    try {
      await handleMissed(queueId);
      await loadAllQueues();
    } catch (err) {
      setError("Erro ao processar turno perdido.");
      console.error("Error handling missed turn:", err);
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
              Tempo (min)
            </label>
            <input
              type="number"
              min="1"
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(Number(e.target.value))}
              style={{
                padding: "0.5rem",
                border: "2px solid #333",
                borderRadius: "8px",
                background: "#000",
                color: "white",
                width: "80px",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "white",
              }}
            >
              Valor (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              style={{
                padding: "0.5rem",
                border: "2px solid #333",
                borderRadius: "8px",
                background: "#000",
                color: "white",
                width: "100px",
              }}
            />
          </div>
        </div>
      </div>

      <div className="queues-grid">
        {allQueues.map((sim) => {
          const status = queueStatuses[sim.simulatorId];
          return (
            <div key={sim.simulatorId} className="queue-card">
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
                {(sim.queue || [])
                  .slice()
                  .reverse()
                  .map((q) => (
                    <li key={q.id} className="queue-item">
                      <span>{q.player?.name ?? "Sem nome"}</span>
                      <div className="item-controls">
                        <button
                          onClick={() => handleRemove(q.id)}
                          className="remove-button"
                        >
                          Remover
                        </button>
                        {(() => {
                          const currentItem = activeItems[
                            sim.simulatorId
                          ]?.find(
                            (item) =>
                              (item.status === "ACTIVE" ||
                                item.status === "CONFIRMED") &&
                              item.player.name === q.player?.name
                          );
                          if (!currentItem) return null;

                          return (
                            <>
                              {currentItem.status === "ACTIVE" && (
                                <button
                                  onClick={() =>
                                    handleConfirmTurn(currentItem.id)
                                  }
                                  className="confirm-button"
                                >
                                  Confirmar
                                </button>
                              )}
                              <button
                                onClick={() => handleMissedTurn(currentItem.id)}
                                className="missed-button"
                              >
                                Perdeu Turno
                              </button>
                            </>
                          );
                        })()}
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
