export default function Card({ children, urgent=false }) {
  return (
    <div className="card" style={{ borderWidth: urgent ? 2 : 1 }}>
      {children}
    </div>
  );
}
