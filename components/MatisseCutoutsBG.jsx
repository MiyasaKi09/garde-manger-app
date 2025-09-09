// components/MatisseCutoutsBG.jsx
export default function MatisseCutoutsBG() {
  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--bg-top, #0b0f0a)" />
            <stop offset="100%" stopColor="var(--bg-bottom, #1a2318)" />
          </linearGradient>

          <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 .05 .15 .05 0" />
            </feComponentTransfer>
            <feBlend mode="multiply" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Fond */}
        <rect x="0" y="0" width="1000" height="1000" fill="url(#bgGrad)" />

        {/* Bandeau gauche (papier découpé) */}
        <g>
          <path
            d="M40,60 C40,60 80,50 120,60 C140,70 160,95 170,130 C180,160 180,210 170,250 C160,295 140,330 120,360 C100,390 85,420 80,460 C70,520 90,560 110,610 C130,655 150,700 140,740 C120,820 60,860 40,860 L40,60 Z"
            style={{ fill: "var(--paper, #f6f7f3)" }}
          />
          <path
            d="M90,140 C140,110 200,120 240,160 C210,180 170,200 120,230 C110,200 100,170 90,140 Z"
            style={{ fill: "var(--earth, #b1793a)" }}
          />
          <path
            d="M95,260 C165,225 225,230 270,270 C240,290 175,320 110,350 C105,320 100,290 95,260 Z"
            style={{ fill: "var(--earth, #b1793a)" }}
          />
          <path
            d="M95,380 C170,345 245,350 290,395 C255,420 175,450 110,480 C103,446 99,413 95,380 Z"
            style={{ fill: "var(--earth, #b1793a)" }}
          />
          <path
            d="M95,500 C165,468 235,472 280,515 C240,540 170,565 110,595 C104,564 100,532 95,500 Z"
            style={{ fill: "var(--earth, #b1793a)" }}
          />
          <path
            d="M95,620 C160,595 225,598 265,640 C230,662 165,690 115,715 C107,683 101,651 95,620 Z"
            style={{ fill: "var(--earth, #b1793a)" }}
          />
        </g>

        {/* Bandeau droit (argile + découpe claire) */}
        <g>
          <path
            d="M880,80 C930,120 950,170 950,230 C950,320 900,370 870,430 C845,480 845,530 865,580 C890,640 930,690 940,750 C950,820 915,880 860,910 C800,940 740,930 700,900 C760,860 775,820 770,770 C765,720 735,680 720,640 C700,585 710,525 735,480 C760,435 800,410 820,360 C850,290 830,210 800,160 C830,150 860,150 880,80 Z"
            style={{ fill: "var(--clay, #c9b098)" }}
          />
          <path
            d="M760,840 C800,800 820,760 805,715 C792,680 760,650 740,620 C765,640 790,640 815,630 C845,620 875,600 895,575 C905,615 910,655 905,700 C900,760 870,815 820,860 C800,860 780,850 760,840 Z"
            style={{ fill: "var(--paper, #f6f7f3)" }}
          />
        </g>

        {/* Touches mousse vertes (parcimonie) */}
        <path
          d="M640,170 C700,150 760,165 790,210 C760,220 705,235 655,255 C648,225 645,195 640,170 Z"
          style={{ fill: "var(--moss, #6ea067)" }}
          opacity=".55"
        />
        <path
          d="M620,420 C675,400 735,410 760,450 C735,460 680,480 640,495 C633,470 628,445 620,420 Z"
          style={{ fill: "var(--moss, #6ea067)" }}
          opacity=".5"
        />

        {/* Grain subtil */}
        <rect
          x="0"
          y="0"
          width="1000"
          height="1000"
          filter="url(#grain)"
          opacity=".18"
        />
      </svg>
    </div>
  );
}
