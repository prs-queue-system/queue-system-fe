import { useEffect, useState } from "react";
import { fetchCars, fetchSimulatorCars, type CarConfiguration } from "../services/api";

type CarSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (car: CarConfiguration) => void;
  pcIp?: string | null;
};

export default function CarSelectionModal({
  isOpen,
  onClose,
  onSelect,
  pcIp,
}: CarSelectionModalProps) {
  const [cars, setCars] = useState<CarConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadCars();
    }
  }, [isOpen, pcIp]);

  const loadCars = async () => {
    setLoading(true);
    setError(null);
    try {
      let carsList: CarConfiguration[];
      if (pcIp) {
        carsList = await fetchSimulatorCars(pcIp);
      } else {
        carsList = await fetchCars();
      }
      setCars(carsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar carros");
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = cars.filter(
    (car) =>
      car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (car: CarConfiguration) => {
    onSelect(car);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Selecionar Carro</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por nome, marca ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loading && (
            <div className="loading-container">
              <p>Carregando carros...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <p>Erro: {error}</p>
              <button onClick={loadCars} className="retry-button">
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="cars-grid">
              {filteredCars.length === 0 ? (
                <p className="no-results">Nenhum carro encontrado</p>
              ) : (
                filteredCars.map((car) => (
                  <div
                    key={car.id}
                    className="car-item"
                    onClick={() => handleSelect(car)}
                  >
                    <div className="car-icon">🏎️</div>
                    <div className="car-info">
                      <h4>{car.name}</h4>
                      <p className="car-brand">{car.brand}</p>
                      <p className="car-category">{car.category}</p>
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