/**
 * Water Chemistry Section Component
 *
 * Expandable section for managing water chemistry settings.
 * Shows final ion metrics inline, with expandable detailed view
 * for source/target profiles, salt additions, and comparison table.
 */

import type { SaltAdditions, WaterProfile } from "../../../domain/services/WaterChemistryService";
import SaltSummary from "./SaltSummary";
import SaltAdditionsPanel from "./SaltAdditionsPanel";
import WaterProfileComparison from "./WaterProfileComparison";
import { ION_LABELS } from "./constants";

type TargetStyle = {
  profile: WaterProfile;
  clToSo4Ratio: string;
};

type Props = {
  /** Whether the chemistry details are expanded */
  isExpanded: boolean;
  /** Callback to toggle expanded state */
  onToggleExpanded: () => void;
  /** Source water profile */
  sourceProfile: WaterProfile;
  /** Source water profile name */
  sourceProfileName?: string;
  /** Target style profile with ratio description */
  targetStyle: TargetStyle | undefined;
  /** Target style name */
  targetStyleName?: string;
  /** Calculated final water profile */
  finalProfile: WaterProfile;
  /** Current salt additions */
  saltAdditions: Partial<SaltAdditions>;
  /** Salt amounts for mash water */
  mashSalts: Partial<SaltAdditions>;
  /** Salt amounts for sparge water */
  spargeSalts: Partial<SaltAdditions>;
  /** Callback to open source water profile modal */
  onOpenSourceModal: () => void;
  /** Callback to open target style modal */
  onOpenTargetModal: () => void;
  /** Callback when a salt amount changes */
  onSaltChange: (saltKey: keyof SaltAdditions, value: number) => void;
};

export default function WaterChemistrySection({
  isExpanded,
  onToggleExpanded,
  sourceProfile,
  sourceProfileName,
  targetStyle,
  targetStyleName,
  finalProfile,
  saltAdditions,
  mashSalts,
  spargeSalts,
  onOpenSourceModal,
  onOpenTargetModal,
  onSaltChange,
}: Props) {
  const targetProfile = targetStyle?.profile || { Ca: 75, Mg: 10, Na: 10, Cl: 75, SO4: 75, HCO3: 75 };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Water Chemistry
        </h3>

        {/* Final Water Metrics - Inline */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Final:</span>
          {ION_LABELS.map((ion) => {
            const finalValue = Math.round(finalProfile[ion]);
            return (
              <div key={ion} className="text-xs">
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  {ion}:
                </span>
                <span className="ml-1 font-bold text-gray-900 dark:text-gray-100">
                  {finalValue}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onToggleExpanded}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
        >
          {isExpanded ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {/* Collapsed View - Salt Summary */}
      {!isExpanded && (
        <SaltSummary
          saltAdditions={saltAdditions}
          mashSalts={mashSalts}
          spargeSalts={spargeSalts}
          sourceProfileName={sourceProfileName}
        />
      )}

      {/* Expanded View - Full Controls */}
      {isExpanded && (
        <>
          {/* Source and Target Profiles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Source Water</label>
              <button
                onClick={onOpenSourceModal}
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-left hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors"
              >
                {sourceProfileName || "Custom"}
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Target Style</label>
              <button
                onClick={onOpenTargetModal}
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-left hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors"
              >
                {targetStyleName || "Balanced"}
              </button>
              {targetStyle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {targetStyle.clToSo4Ratio}
                </p>
              )}
            </div>
          </div>

          {/* Salt Additions */}
          <SaltAdditionsPanel
            saltAdditions={saltAdditions}
            mashSalts={mashSalts}
            spargeSalts={spargeSalts}
            onSaltChange={onSaltChange}
          />

          {/* Water Profile Comparison */}
          <WaterProfileComparison
            sourceProfile={sourceProfile}
            targetProfile={targetProfile}
            finalProfile={finalProfile}
          />
        </>
      )}
    </div>
  );
}
