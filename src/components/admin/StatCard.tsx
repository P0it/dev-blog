export function StatCard({
  label,
  num,
  delta,
  up = true,
}: {
  label: string;
  num: string;
  delta: string;
  up?: boolean;
}) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="num">{num}</div>
      <div className={`delta ${up ? "up" : ""}`}>{delta}</div>
    </div>
  );
}
