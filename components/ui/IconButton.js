export default function IconButton({ title, children, ...props }) {
  return (
    <button
      {...props}
      title={title}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        borderRadius: 6,
        lineHeight: 1
      }}
    >
      {children}
    </button>
  );
}
