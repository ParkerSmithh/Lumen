const gestures = {
  GLOW: [['presence', 'SHOW YOURSELF', 'Step into view']],
  FLOW: [['point', 'POINT + MOVE', 'Draw with your finger']],
  SLASH: [['slash', 'SWIPE TO SLASH', 'Swipe your hand through objects']],
  LAUNCH: [['push', 'POINT + RAPID PUSH', 'Fire balls'], ['grab', 'CLOSE HAND', 'Grab nearby balls'], ['throw', 'MOVE + RELEASE', 'Throw balls']],
};
const fallback = {
  FLOW: [['cursor', 'MOVE / TOUCH', 'Draw with your pointer']],
  SLASH: [['slash', 'SWIPE / DRAG', 'Cut through objects']],
  LAUNCH: [['cursor', 'CLICK / TAP', 'Fire balls'], ['grab', 'HOLD + DRAG', 'Grab a ball'], ['throw', 'RELEASE', 'Throw with momentum']],
};

function Gesture({ type }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {type === 'presence' ? <><circle cx="24" cy="10" r="4" /><path d="M17 37v-9l-4 5m22 0-4-5v9M17 42V24c0-5 3-8 7-8s7 3 7 8v18M24 30v12M8 17V8h5m22 0h5v9M8 34v7h5m22 0h5v-7" /></>
      : type === 'slash' ? <><path d="m8 39 8-8 12-19c2-3 5-1 3 2L20 34l-6 9M16 31l-1-9c0-3 3-4 4-1l1 4M20 34l-4-3" /><path d="M29 30c6-3 10-8 13-15m-7 3 7-3v7M29 36c7-3 11-7 15-13" opacity=".55" /></>
      : type === 'grab' ? <><path d="M13 41v-6c-4-3-6-6-6-10v-6c0-3 4-3 4 0v-5c0-3 5-3 5 0v-2c0-3 5-3 5 0v2c0-3 5-3 5 0v5c0-3 5-3 5 0v12c0 3-2 6-4 8v2M11 19v5m5-10v9m5-9v9m5-4v5M11 28l7-4c3-2 6 2 3 4l-5 3M13 41h14" /><path d="M35 8c6 4 8 10 6 16m-3-4 3 4 4-3" opacity=".55" /></>
      : type === 'cursor' ? <><path d="m15 9 21 20-11 1-6 10Z" /><path d="m28 32 6 9M6 13H2m7-7L6 3m10 1V1" opacity=".55" /></>
      : type === 'move' ? <><circle cx="24" cy="24" r="7" /><path d="M24 3v9m-4-5 4-4 4 4M24 45v-9m-4 5 4 4 4-4M3 24h9m-5-4-4 4 4 4m38-4h-9m5-4 4 4-4 4" opacity=".65" /></>
      : type === 'throw' ? <><g transform="translate(0 15) scale(.48)"><path d="M8 40V24c0-5 6-5 6 0v-9c0-4 6-4 6 0v-3c0-4 6-4 6 0v3c0-4 6-4 6 0v5c0-4 6-4 6 0v13l-6 8H8Z" /></g><path d="M20 29h7m-3-3 3 3-3 3" /><g transform="translate(23 14) scale(.45)"><path d="M8 42V28l-5-7c-2-3 2-5 4-2l5 5V7c0-4 5-4 5 0v16V3c0-4 5-4 5 0v20V6c0-4 5-4 5 0v19V12c0-4 5-4 5 0v19l-7 11" /></g><circle cx="40" cy="8" r="4" /><path d="m34 18 4-4m-6-4 3-3m7 10 3-4" opacity=".6" /></>
      : <><path d="M10 41V29c0-3 3-4 5-1l3 4V10c0-4 5-4 5 0v16-6c0-3 5-3 5 0v7-5c0-3 5-3 5 0v7-4c0-3 5-3 5 0v10l-3 7" />{type === 'push' ? <path d="m29 12 13-8m-6-1 6 1-2 6m-9-4-2 6 6 1" opacity=".6" /> : <path d="M4 18V8m-3 4 3-4 3 4m26-4h10m-4-3 4 3-4 3" opacity=".55" />}</>}
  </svg>;
}

export function InteractionGuide({ mode, mouseMode, quiet }) {
  const instructions = mouseMode && fallback[mode] ? fallback[mode] : gestures[mode];
  return <section className={`interaction-guide ${quiet ? 'quiet' : ''}`} aria-label="Interaction guide">
    {instructions.map(([type, label, description]) => <div className="gesture-instruction" key={label}>
      <Gesture type={type} /><div><p>{label}</p><span>{description}</span></div>
    </div>)}
  </section>;
}
