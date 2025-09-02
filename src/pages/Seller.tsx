import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchPlayers,
  fetchAllQueues,
  createQueue,
  removePlayer,
  startTimedQueue,
  getQueueStatus,
  processNext,
  confirmTurn,
  handleMissed,
  getSellerQRCode,
  type Player,
  type SimulatorQueue,
} from "../services/api";
import "./Seller.css";

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
type User = { id: number; name: string; role: string };
type QRCodeData = { qrCode: string; registerUrl: string };

const formatTime = (timeLeft: number): string => {
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function Seller() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [queues, setQueues] = useState<SimulatorQueue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [timeMinutes, setTimeMinutes] = useState(5);
  const [amountPaid, setAmountPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [queueStatuses, setQueueStatuses] = useState<
    Record<number, QueueStatus>
  >({});
  const [activeItems, setActiveItems] = useState<
    Record<number, ActiveQueueItem[]>
  >({});
  const [user, setUser] = useState<User | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);

  const loadQueues = useCallback(async () => {
    try {
      const queuesData = await fetchAllQueues();
      setQueues(queuesData || []);

      const statuses: Record<number, QueueStatus> = {};
      const activeItemsMap: Record<number, ActiveQueueItem[]> = {};
      const statusPromises = (queuesData || []).map(async (queue) => {
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
              const currentItem = status.data.find(
                (item: ActiveQueueItem) =>
                  item.status === "ACTIVE" || item.status === "CONFIRMED"
              );
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
    } catch (error) {
      console.error("Error loading queues:", error);
    }
  }, []);

  const loadPlayers = useCallback(async () => {
    try {
      const playersData = await fetchPlayers();
      setPlayers(playersData);
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== "SELLER") {
          window.location.href = "/login";
          return;
        }
        setUser(parsedUser);
      } catch {
        window.location.href = "/login";
        return;
      }
    } else {
      window.location.href = "/login";
      return;
    }

    const loadData = async () => {
      try {
        await Promise.all([loadPlayers(), loadQueues()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const queueInterval = setInterval(loadQueues, 3000);
    const playerInterval = setInterval(loadPlayers, 5000);
    return () => {
      clearInterval(queueInterval);
      clearInterval(playerInterval);
    };
  }, [loadQueues, loadPlayers]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return players.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);

  const handleAddToQueue = async (simulatorId: number) => {
    if (!selectedPlayer || timeMinutes <= 0 || amountPaid < 0) return;

    try {
      await createQueue(
        selectedPlayer.id,
        simulatorId,
        timeMinutes,
        amountPaid
      );
      setSelectedPlayer(null);
      setSearchTerm("");
      setTimeMinutes(5);
      setAmountPaid(0);
      await Promise.all([loadQueues(), loadPlayers()]);
    } catch (error) {
      console.error(
        "Error adding player to queue:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removePlayer(id);
      await loadQueues();
    } catch (error) {
      console.error("Error removing player:", error);
    }
  };

  const handleStartTimed = async (simulatorId: number) => {
    try {
      await startTimedQueue(simulatorId);
      await loadQueues();
    } catch (error) {
      console.error("Error starting timed queue:", error);
    }
  };

  const handleProcessNext = async (simulatorId: number) => {
    try {
      await processNext(simulatorId);
      await loadQueues();
    } catch (error) {
      console.error("Error processing next:", error);
    }
  };

  const handleConfirmTurn = async (queueId: number) => {
    try {
      await confirmTurn(queueId);
      await loadQueues();
    } catch (error) {
      console.error("Error confirming turn:", error);
    }
  };

  const handleMissedTurn = async (queueId: number) => {
    try {
      await handleMissed(queueId);
      await loadQueues();
    } catch (error) {
      console.error("Error handling missed turn:", error);
    }
  };

  const handleShowQRCode = async () => {
    if (!user) return;

    setLoadingQR(true);
    try {
      const qrData = await getSellerQRCode(user.id);
      setQRCodeData(qrData);
      setShowQRCode(true);
    } catch (error) {
      console.error("Error loading QR Code:", error);
    } finally {
      setLoadingQR(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="seller-container">
      <div className="seller-header">
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
        <h1 style={{ flex: 1 }}>Sistema de Vendas - Filas</h1>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ color: "white" }}>Olá, {user.name}</span>
            <button
              onClick={handleShowQRCode}
              disabled={loadingQR}
              style={{
                padding: "0.5rem",
                background: "#333",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
              title="Meu QR Code"
            >
              {loadingQR ? "..." : "📱"}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
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
        )}
      </div>

      <div className="search-section">
        <h2>Buscar Jogador</h2>
        <input
          type="text"
          placeholder="Digite o nome do jogador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {searchTerm && (
          <div className="players-grid">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <h3>{player.name}</h3>
                  <p>ID: {player.id}</p>
                </div>
                <button
                  onClick={() => setSelectedPlayer(player)}
                  className={`select-button ${
                    selectedPlayer?.id === player.id ? "selected" : ""
                  }`}
                >
                  {selectedPlayer?.id === player.id
                    ? "Selecionado"
                    : "Selecionar"}
                </button>
              </div>
            ))}
            {filteredPlayers.length === 0 && (
              <p className="no-results">Nenhum jogador encontrado</p>
            )}
          </div>
        )}
      </div>

      {selectedPlayer && (
        <div className="selected-player">
          <h3>Jogador Selecionado: {selectedPlayer.name}</h3>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1rem",
              alignItems: "end",
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
                Tempo (minutos)
              </label>
              <input
                type="number"
                min="1"
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(Number(e.target.value))}
                style={{
                  padding: "0.5rem",
                  border: "2px solid #333",
                  borderRadius: "6px",
                  background: "#000",
                  color: "white",
                  width: "100px",
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
                Valor Pago (R$)
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
                  borderRadius: "6px",
                  background: "#000",
                  color: "white",
                  width: "120px",
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="queues-section">
        <h2>Filas Disponíveis</h2>
        <div className="queues-grid">
          {queues.map((sim) => {
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
                  {activeItems[sim.simulatorId]?.find(
                    (item) =>
                      item.status === "ACTIVE" || item.status === "CONFIRMED"
                  )?.status === "CONFIRMED" ? (
                    <span style={{ color: "#4caf50", fontSize: "0.9rem" }}>
                      jogando
                    </span>
                  ) : activeItems[sim.simulatorId]?.find(
                      (item) =>
                        item.status === "ACTIVE" || item.status === "CONFIRMED"
                    )?.status === "ACTIVE" ? (
                    <span style={{ color: "#dc2626", fontSize: "0.9rem" }}>
                      aguardando
                    </span>
                  ) : null}
                </h3>

                {status?.isActive && (
                  <div className="timed-status">
                    {(() => {
                      const currentItem = activeItems[sim.simulatorId]?.find(
                        (item) =>
                          item.status === "ACTIVE" ||
                          item.status === "CONFIRMED"
                      );
                      if (!currentItem) return null;

                      if (currentItem.status === "ACTIVE") {
                        const timeDisplay = currentItem.timeLeft
                          ? ` - ${formatTime(currentItem.timeLeft)}`
                          : "";
                        return (
                          <p>
                            Aguardando pelo jogador:{" "}
                            {status.currentPlayer?.name}
                            {timeDisplay}
                          </p>
                        );
                      }

                      return (
                        <p>
                          Jogador atual: {status.currentPlayer?.name}
                          {currentItem.timeLeft
                            ? ` - ${formatTime(currentItem.timeLeft)}`
                            : ""}
                        </p>
                      );
                    })()}
                  </div>
                )}

                <div className="queue-controls">
                  <button
                    onClick={() => handleAddToQueue(sim.simulatorId)}
                    disabled={!selectedPlayer}
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
                                  onClick={() =>
                                    handleMissedTurn(currentItem.id)
                                  }
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

      {showQRCode && qrCodeData && (
        <div className="qr-popup-overlay" onClick={() => setShowQRCode(false)}>
          <div className="qr-popup" onClick={(e) => e.stopPropagation()}>
            <div className="qr-header">
              <h3>Meu QR Code</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="close-button"
              >
                ×
              </button>
            </div>
            <div className="qr-content">
              <p>
                Compartilhe este QR Code para que clientes se cadastrem como
                seus indicados:
              </p>
              <div className="qr-image">
                <img src={qrCodeData.qrCode} alt="QR Code" />
              </div>
              <div className="qr-url">
                <p>URL: {qrCodeData.registerUrl}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
