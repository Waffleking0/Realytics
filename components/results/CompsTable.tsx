import type { ComparableProperty } from "@/types";
import { fmt$ } from "@/lib/utils";

export function CompsTable({ comps }: { comps: ComparableProperty[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300">
            {["Address","Price","$/SqFt","SqFt","Monthly Rent","Cap Rate","Distance","Match"].map(h => (
              <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comps.map((c, i) => (
            <tr key={c.id} className={`border-b border-gray-200 ${i === 0 ? "bg-blue-500/5" : "hover:bg-gray-200/50"}`}>
              <td className="py-3 px-3 text-gray-700 font-medium">{c.address}</td>
              <td className="py-3 px-3 text-gray-900 font-semibold">{fmt$(c.price)}</td>
              <td className="py-3 px-3 text-gray-600">{c.pricePerSqft ? fmt$(c.pricePerSqft) : "—"}</td>
              <td className="py-3 px-3 text-gray-600">{c.size?.toLocaleString()}</td>
              <td className="py-3 px-3 text-gray-600">{c.monthlyRent ? fmt$(c.monthlyRent) : "—"}</td>
              <td className="py-3 px-3 text-gray-600">{c.capRate ? `${(c.capRate * 100).toFixed(1)}%` : "—"}</td>
              <td className="py-3 px-3 text-gray-600">{c.distance} mi</td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${c.similarity}%` }} />
                  </div>
                  <span className="text-gray-600 text-xs">{c.similarity}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
