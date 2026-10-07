import { useEffect, useRef } from 'react';

const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function SlashHUD({ game, canPlay, onStart, onResume }) {
  const action = useRef(null);
  useEffect(() => {
    if (game.phase === 'results' || game.paused) action.current?.focus({ preventScroll: true });
  }, [game.phase, game.paused]);
  const running = game.phase === 'playing' || game.phase === 'results';
  return <>
    {running && <div className={`slash-hud${game.seconds <= 10 ? ' final-seconds' : ''}`} aria-label="SLASH session">
      <div><span>SLASHED</span><strong aria-label="Objects slashed">{game.count}</strong></div>
      <time aria-label="Time remaining">{formatTime(game.seconds)}</time>
    </div>}
    {(game.phase !== 'playing' || game.paused) && <section className="slash-game-overlay" aria-label="SLASH game">
      {game.paused ? <>
        <h2>Paused</h2><p>{canPlay ? 'Continue when you’re ready.' : 'Start your camera or use mouse / touch to continue.'}</p>
        <button ref={action} className="enter" disabled={!canPlay} onClick={onResume}>RESUME</button>
      </> : game.phase === 'ready' ? <>
        <h2>SLASH</h2><p>Two minutes. Cut through digital matter.</p>
        <button className="enter" disabled={!canPlay} onClick={onStart}>START</button>
        {!canPlay && <p className="slash-input-hint">Start your camera or use mouse / touch below.</p>}
      </> : game.phase === 'countdown' ? <div className="slash-countdown" aria-label="Starting in" aria-live="polite" aria-atomic="true">{game.countdown}</div> : <>
        <h2 aria-label="Final result">{game.count} SLASHED</h2>
        <p>Digital matter, undone.</p>
        <button ref={action} className="enter" disabled={!canPlay} onClick={onStart}>PLAY AGAIN</button>
        {!canPlay && <p className="slash-input-hint">Start your camera or use mouse / touch below.</p>}
      </>}
    </section>}
  </>;
}
