export function GameFeedback({label,active,anchor}) {
  if (!label || !active) return null;
  return <div className="game-feedback" aria-live="polite" style={anchor ? {left:`${anchor.x*100}%`,top:`${anchor.y*100}%`} : undefined}>{label}</div>;
}
