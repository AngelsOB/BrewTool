import FermentationPlan from "../../../components/FermentationPlan";
import type { FermentationStep } from "../../../hooks/useRecipeStore";

export default function FermentationSection({
  steps,
  onChange,
  showDryHopColumn,
}: {
  steps: FermentationStep[];
  onChange: (steps: FermentationStep[]) => void;
  showDryHopColumn: boolean;
}) {
  return (
    <section className="section-soft space-y-3">
      <FermentationPlan
        steps={steps}
        onChange={onChange}
        showDryHopColumn={showDryHopColumn}
      />
    </section>
  );
}
