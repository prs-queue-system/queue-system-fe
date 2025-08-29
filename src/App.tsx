// src/App.tsx
import Player from "./components/Player";
import Queue from "./components/Queue";
import Simulators from "./components/Simulators";
import "./App.css";

export default function App() {
  return (
    <div className="app-container">
      <h1 className="app-title">Sistema de Filas e Simuladores</h1>
      <div className="section">
        <Player />
      </div>
      <div className="section">
        <Queue />
      </div>
      <div className="section">
        <Simulators />
      </div>
    </div>
  );
}
