import Player from "../components/Player";
import Queue from "../components/Queue";
import Simulators from "../components/Simulators";

export default function Admin() {
  return (
    <>
      <h1 className="app-title">Sistema de Filas e Simuladores - Admin</h1>
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