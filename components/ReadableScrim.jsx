// Un voile de lisibilité très léger au centre + vignette en bord
export default function ReadableScrim() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0.5, // entre BG (0) et main (1)
        pointerEvents: "none",
        background: `
          radial-gradient(60% 45% at 50% 35%, rgba(0,0,0,.35) 0%, rgba(0,0,0,.28) 45%, rgba(0,0,0,.15) 65%, rgba(0,0,0,0) 75%),
          linear-gradient(180deg, rgba(0,0,0,.20), rgba(0,0,0,.10) 30%, rgba(0,0,0,.20))
        `
      }}
    />
  );
}
