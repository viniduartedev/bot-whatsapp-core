interface MetricCardProps {
  label: string;
  value: number;
  description: string;
}

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <article className="metric-card">
      <h3>{label}</h3>
      <p className="metric-value">{value}</p>
      <p>{description}</p>
    </article>
  );
}
