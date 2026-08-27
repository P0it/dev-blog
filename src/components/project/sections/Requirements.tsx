export function Requirements({ items }: { items: string[] }) {
  return (
    <div className="lab-req lab-stagger">
      {items.map((text, i) => (
        <div key={i} className="lab-panel lab-req-item">
          <span className="mark" aria-hidden />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}
