export default function IconButton({ title, children, ...props }) {
  return (
    <button
      {...props}
      title={title}
      className="btn"
      style={{
        background:'#fff',
        border:'1px solid #dcdce0',
        borderRadius:8,
        padding:'4px 6px',
        lineHeight:1,
        cursor:'pointer'
      }}
    >
      {children}
    </button>
  );
}
