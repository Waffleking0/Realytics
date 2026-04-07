export function RiskBadge({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const styles = {
    Low:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Medium: "bg-yellow-500/15  text-yellow-400  border-yellow-500/30",
    High:   "bg-red-500/15     text-red-400     border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${styles[risk]}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {risk} Risk
    </span>
  );
}

export function RecommendationBadge({ rec }: { rec: "Buy" | "Hold" | "Pass" }) {
  const styles = {
    Buy:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Hold: "bg-blue-500/15    text-blue-400    border-blue-500/30",
    Pass: "bg-red-500/15     text-red-400     border-red-500/30",
  };
  const icons = { Buy: "✅", Hold: "⏸️", Pass: "❌" };
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-base font-bold border ${styles[rec]}`}>
      {icons[rec]} {rec}
    </span>
  );
}
