import type { GearSpecification } from "./types";

type SpecificationTableProps = {
  specifications: GearSpecification[];
};

export function SpecificationTable({ specifications }: SpecificationTableProps) {
  return (
    <div className="overflow-hidden rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border">
      <table className="w-full border-collapse text-left text-sm">
        <tbody>
          {specifications.map((spec, index) => (
            <tr
              key={spec.label}
              className={
                index % 2 === 0
                  ? "bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim"
                  : undefined
              }
            >
              <td className="w-1/3 border-b border-vanguard-light-border p-4 font-display text-xs font-semibold uppercase tracking-wider dark:border-vanguard-dark-border">
                {spec.label}
              </td>
              <td className="border-b border-vanguard-light-border p-4 text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted">
                {spec.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
