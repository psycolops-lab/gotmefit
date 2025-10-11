// src/components/DonutChart.tsx
export function DonutChart({ percentage }: { percentage: number }) {
  const circ = 100;
  const r = circ / (2 * Math.PI);
  const greenLength = (percentage / 100) * circ;
  const redLength = circ - greenLength;

  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#e0e0e0" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="green"
        strokeWidth="4"
        strokeDasharray={`${greenLength} ${circ}`}
        transform="rotate(-90 20 20)"
      />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="red"
        strokeWidth="4"
        strokeDasharray={`${redLength} ${circ}`}
        strokeDashoffset={`-${greenLength}`}
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}