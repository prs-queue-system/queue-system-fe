import Player from "../components/Player";
import Queue from "../components/Queue";
import Simulators from "../components/Simulators";

export default function Admin() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          width: '300px',
          height: '82px',
          backgroundImage: 'url("https://loja.prsim.com.br/wp-content/uploads/2025/04/prs-preto-branco-vermelho-300x82.png")',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        </div>
        <h1 className="app-title" style={{ margin: 0 }}>Sistema de Filas e Simuladores - Admin</h1>
      </div>
      <div className="section">
        <Player />
      </div>
      <div className="section">
        <Queue />
      </div>
      <div className="section">
        <Simulators />
      </div>
    </>
  );
}