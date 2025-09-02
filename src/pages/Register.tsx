import { useState, useEffect, useMemo } from 'react';
import { createPlayer, checkEmailExists } from '../services/api';
import './Register.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      await createPlayer(formData.name, formData.email, formData.phone);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '' });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao registrar jogador');
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

  const isSubmitDisabled = useMemo(() => 
    loading || !formData.name.trim() || !formData.email.trim() || !!emailError || checkingEmail,
    [loading, formData.name, formData.email, emailError, checkingEmail]
  );

  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email)) {
        setEmailError('');
        return;
      }
      
      setCheckingEmail(true);
      try {
        const exists = await checkEmailExists(formData.email);
        setEmailError(exists ? 'Este e-mail já está em uso' : '');
      } catch {
        setEmailError('');
      } finally {
        setCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Registro de Jogador</h1>
        
        {success && (
          <div className="success-message">
            Jogador registrado com sucesso!
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
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
            <label htmlFor="email">E-mail *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Digite seu e-mail"
              style={{
                borderColor: emailError ? '#dc2626' : undefined
              }}
            />
            {checkingEmail && <small style={{ color: '#666' }}>Verificando e-mail...</small>}
            {emailError && <small style={{ color: '#dc2626' }}>{emailError}</small>}
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

          <button type="submit" disabled={isSubmitDisabled}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  );
}