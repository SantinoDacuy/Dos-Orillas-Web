/** Fondo único y fijo detrás de toda la home (adaptado del patrón «elegant dark pattern» de 21st.dev,
 * reescrito en CSS y teñido al acento): un brillo frío desde arriba a la izquierda, franjas inclinadas
 * que se desvanecen, una grilla de puntos tenue y grano. Es estático: no escucha scroll ni puntero,
 * así que se ve igual con y sin JS, en todos los tiers y con movimiento reducido. */
export function LivingBackground() {
  return <div className="lb" aria-hidden="true">
    <span className="lb-glow" />
    <span className="lb-streaks"><i /><i /><i /><i /></span>
    <span className="lb-dots" />
    <span className="lb-grain" />
    <span className="lb-vignette" />
  </div>;
}
