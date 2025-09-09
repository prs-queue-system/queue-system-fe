import { useEffect, useState } from "react";
import { fetchTracks, fetchSimulatorTracks, type TrackConfiguration } from "../services/api";

type TrackSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (track: TrackConfiguration) => void;
  pcIp?: string | null;
};

export default function TrackSelectionModal({
  isOpen,
  onClose,
  onSelect,
  pcIp,
}: TrackSelectionModalProps) {
  const [tracks, setTracks] = useState<TrackConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadTracks();
    }
  }, [isOpen, pcIp]);

  const loadTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      let tracksList: TrackConfiguration[];
      if (pcIp) {
        tracksList = await fetchSimulatorTracks(pcIp);
      } else {
        tracksList = await fetchTracks();
      }
      setTracks(tracksList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pistas");
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(
    (track) =>
      track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.layout.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (track: TrackConfiguration) => {
    onSelect(track);
    onClose();
  };

  const formatLength = (length: number) => {
    if (length >= 1000) {
      return `${(length / 1000).toFixed(1)}km`;
    }
    return `${length}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Selecionar Pista</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por nome, país ou layout..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loading && (
            <div className="loading-container">
              <p>Carregando pistas...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <p>Erro: {error}</p>
              <button onClick={loadTracks} className="retry-button">
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="tracks-grid">
              {filteredTracks.length === 0 ? (
                <p className="no-results">Nenhuma pista encontrada</p>
              ) : (
                filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    className="track-item"
                    onClick={() => handleSelect(track)}
                  >
                    <div className="track-icon">🏁</div>
                    <div className="track-info">
                      <h4>{track.name}</h4>
                      <p className="track-country">{track.country}</p>
                      <p className="track-details">
                        {track.layout} • {formatLength(track.length)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}