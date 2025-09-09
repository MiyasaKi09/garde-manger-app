export default function MatisseCutoutsBG() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--bg-top, #0b0f0a)"/>
            <stop offset="100%" stopColor="var(--bg-bottom, #1a2318)"/>
          </linearGradient>
          <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 .05 .15 .05 0"/>
            </feComponentTransfer>
            <feBlend mode="multiply" in2="SourceGraphic"/>
          </filter>
          <style>
            {`.paper{fill:var(--paper,#f6f7f3)} .earth{fill:var(--earth,#b1793a)} .clay{fill:var(--clay,#c9b098)} .moss{fill:var(--moss,#6ea067)} .deep{fill:url(#bgGrad)}`}
          </style>
        </defs>

        <rect classN
