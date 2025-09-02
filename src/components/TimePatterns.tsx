import { useState, useEffect, useCallback } from "react";
import { 
  fetchTimePatterns, 
  createTimePattern, 
  updateTimePattern, 
  deleteTimePattern 
} from "../services/api";

export default function TimePatterns() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    timeMinutes: 5,
    price: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPatterns = useCallback(async () => {
    try {
      const data = await fetchTimePatterns();
      setPatterns(data || []);
    } catch (err) {
      console.error("Error loading patterns:", err);
    }
  }, []);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.timeMinutes <= 0 || formData.price < 0) return;

    setLoading(true);
    setError("");
    try {
      if (editingId) {
        await updateTimePattern(editingId, formData.name, formData.timeMinutes, formData.price);
      } else {
        await createTimePattern(formData.name, formData.timeMinutes, formData.price);
      }
      setFormData({ name: "", timeMinutes: 5, price: 0 });
      setEditingId(null);
      await loadPatterns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar padrão");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pattern: any) => {
    setFormData({
      name: pattern.name,
      timeMinutes: pattern.timeMinutes,
      price: pattern.price
    });
    setEditingId(pattern.id);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTimePattern(id);
      await loadPatterns();
    } catch (err) {
      setError("Erro ao deletar padrão");
    }
  };

  return (
    <div>
      <h2 style={{ color: "white", marginBottom: "2rem" }}>Padrões de Tempo</h2>

      {error && (
        <div style={{
          background: "#4d1a1a",
          border: "1px solid #dc2626",
          color: "#dc2626",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 100px 120px auto",
          gap: "1rem",
          alignItems: "start",
          marginBottom: "2rem"
        }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "white" }}>Nome</label>
            <input
              type="text"
              placeholder="Nome do padrão"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              style={{
                padding: "0.75rem",
                border: "2px solid #333",
                borderRadius: "8px",
                background: "#000",
                color: "white",
                width: "100%",
                boxSizing: "border-box"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "white" }}>Tempo (min)</label>
            <input
              type="number"
              placeholder="Minutos"
              min="1"
              value={formData.timeMinutes}
              onChange={(e) => setFormData(prev => ({ ...prev, timeMinutes: Number(e.target.value) }))}
              style={{
                padding: "0.75rem",
                border: "2px solid #333",
                borderRadius: "8px",
                background: "#000",
                color: "white",
                width: "100%",
                boxSizing: "border-box"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "white" }}>Preço (R$)</label>
            <input
              type="number"
              placeholder="Preço (R$)"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              style={{
                padding: "0.75rem",
                border: "2px solid #333",
                borderRadius: "8px",
                background: "#000",
                color: "white",
                width: "100%",
                boxSizing: "border-box"
              }}
            />
          </div>
          <div style={{ alignSelf: "end" }}>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                background: loading || !formData.name.trim() ? "#666" : "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading || !formData.name.trim() ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
            </button>
          </div>
        </div>
      </form>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "1rem"
      }}>
        {patterns.map((pattern) => (
          <div key={pattern.id} style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "1rem"
          }}>
            <h3 style={{ color: "white", margin: "0 0 0.5rem 0" }}>{pattern.name}</h3>
            <p style={{ color: "#666", margin: "0 0 1rem 0" }}>
              {pattern.timeMinutes} minutos - R$ {pattern.price.toFixed(2)}
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => handleEdit(pattern)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#333",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(pattern.id)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
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