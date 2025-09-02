export default function Button({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid #ddd',
        background: '#fff',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}
