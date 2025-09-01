import { useState } from 'react';
import { createPlayer } from '../services/api';
import './Register.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setLoading(true);
    try {
      await createPlayer(formData.name);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', instagram: '' });
    } catch (error) {
      console.error('Error registering player:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Registro de Jogador</h1>
        
        {success && (
          <div className="success-message">
            Jogador registrado com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Digite seu nome"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Digite seu e-mail"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Digite seu telefone"
            />
          </div>

          <div className="form-group">
            <label htmlFor="instagram">Instagram</label>
            <input
              type="text"
              id="instagram"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              placeholder="@seu_instagram"
            />
          </div>

          <button type="submit" disabled={loading || !formData.name.trim()}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  );
}