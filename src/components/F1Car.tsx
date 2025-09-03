import "../styles/components/F1Car.css";

interface F1CarProps {
  isActive: boolean;
}

export default function F1Car({ isActive }: F1CarProps) {
  return (
    <div className="f1-car-container">
      <div className={`f1-car ${isActive ? 'animate' : ''}`}>
        <div id="nose-top"></div>
        <div id="nose-bottom"></div>
        <div id="nose"></div>
        <div id="front-wing"></div>
        <div id="top-front-wing"></div>
        <div id="bottom-front-wing"></div>
        <div id="bottom-front-wheel"></div>
        <div id="top-front-wheel"></div>
        <div id="top-back-wheel"></div>
        <div id="bottom-back-wheel"></div>
        <div id="rear-body"></div>
        <div id="body-hood"></div>
        <div id="driver-bg"></div>
        <div id="driver-helmet"></div>
      </div>
    </div>
  );
}