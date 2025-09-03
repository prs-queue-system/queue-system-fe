import { useState } from "react";
import { login } from "../services/api";
import "../styles/pages/Login.css";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) return;

    setLoading(true);
    setError("");
    try {
      const response = await login(formData.email, formData.password);

      // Store token and user data
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirect based on role
      const role = response.data.user.role;
      if (["MASTER", "ADMIN"].includes(role)) {
        window.location.replace("/admin");
      } else if (role === "SELLER") {
        window.location.replace("/seller");
      } else {
        window.location.replace("/register");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <div
            style={{
              width: "300px",
              height: "82px",
              backgroundImage:
                'url("https://loja.prsim.com.br/wp-content/uploads/2025/04/prs-preto-branco-vermelho-300x82.png")',
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 2rem auto",
            }}
          ></div>
        </div>

        <h1>Login do Sistema</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Digite seu e-mail"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Digite sua senha"
            />
          </div>

          <button
            type="submit"
            disabled={
              loading || !formData.email.trim() || !formData.password.trim()
            }
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
