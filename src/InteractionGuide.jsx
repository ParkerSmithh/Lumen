const gestures = {
  GLOW: [['presence', 'SHOW YOURSELF', 'Step into view']],
  FLOW: [['point', 'POINT + MOVE', 'Draw with your finger']],
  SLASH: [['slash', 'SWIPE TO SLASH', 'Swipe your hand through objects']],
  LAUNCH: [['push', 'POINT + RAPID PUSH', 'Fire balls'], ['grab', 'CLOSE HAND', 'Grab nearby balls'], ['throw', 'MOVE + RELEASE', 'Carry and throw']],
};
const fallback = {
  FLOW: [['cursor', 'MOVE / TOUCH', 'Draw with your pointer']],
  SLASH: [['slash', 'SWIPE / DRAG', 'Cut through objects']],
  LAUNCH: [['cursor', 'CLICK / TAP', 'Fire balls'], ['move', 'MOVE', 'Move to nudge balls']],
};

function Gesture({ type }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {type === 'presence' ? <><circle cx="24" cy="10" r="4" /><path d="M17 37v-9l-4 5m22 0-4-5v9M17 42V24c0-5 3-8 7-8s7 3 7 8v18M24 30v12M8 17V8h5m22 0h5v9M8 34v7h5m22 0h5v-7" /></>
      : type === 'slash' ? <><path d="m8 39 8-8 12-19c2-3 5-1 3 2L20 34l-6 9M16 31l-1-9c0-3 3-4 4-1l1 4M20 34l-4-3" /><path d="M29 30c6-3 10-8 13-15m-7 3 7-3v7M29 36c7-3 11-7 15-13" opacity=".55" /></>
      : type === 'grab' ? <><path d="M13 41v-6c-4-3-6-6-6-10v-6c0-3 4-3 4 0v-5c0-3 5-3 5 0v-2c0-3 5-3 5 0v2c0-3 5-3 5 0v5c0-3 5-3 5 0v12c0 3-2 6-4 8v2M11 19v5m5-10v9m5-9v9m5-4v5M11 28l7-4c3-2 6 2 3 4l-5 3M13 41h14" /><path d="M35 8c6 4 8 10 6 16m-3-4 3 4 4-3" opacity=".55" /></>
      : type === 'cursor' ? <><path d="m15 9 21 20-11 1-6 10Z" /><path d="m28 32 6 9M6 13H2m7-7L6 3m10 1V1" opacity=".55" /></>
      : type === 'move' ? <><circle cx="24" cy="24" r="7" /><path d="M24 3v9m-4-5 4-4 4 4M24 45v-9m-4 5 4 4 4-4M3 24h9m-5-4-4 4 4 4m38-4h-9m5-4 4 4-4 4" opacity=".65" /></>
      : type === 'throw' ? <><path d="m8 39 4-10V18c0-3 4-3 4 0v7-13c0-3 4-3 4 0v13-16c0-3 4-3 4 0v16-13c0-3 4-3 4 0v15l4-5c2-3 5-1 3 2l-6 12-2 6" /><circle cx="37" cy="9" r="4" /><path d="m32 19 4-4M37 23l5-6" opacity=".55" /></>
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
