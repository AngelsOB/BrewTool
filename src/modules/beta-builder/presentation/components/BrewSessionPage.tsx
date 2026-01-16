/**
 * Brew Session Tracker Page
 *
 * Focused on brew-day execution with inline edits.
 */

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBrewSessionStore } from '../stores/brewSessionStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useRecipeCalculations } from '../hooks/useRecipeCalculations';
import type { SessionStatus } from '../../domain/models/BrewSession';
import type { Recipe, RecipeVersion } from '../../domain/models/Recipe';
import { waterChemistryService } from '../../domain/services/WaterChemistryService';
import { recipeVersionRepository } from '../../domain/repositories/RecipeVersionRepository';
import FermentableSection from './FermentableSection';
import HopSection from './HopSection';
import YeastSection from './YeastSection';
import WaterSection from './WaterSection';
import MashScheduleSection from './MashScheduleSection';
import FermentationSection from './FermentationSection';
import { EquipmentSection } from './EquipmentSection';
import { volumeCalculationService } from '../../domain/services/VolumeCalculationService';

const SALT_KEYS = ['gypsum_g', 'cacl2_g', 'epsom_g', 'nacl_g', 'nahco3_g'] as const;
type SaltKey = (typeof SALT_KEYS)[number];
const SALT_LABELS: Record<SaltKey, string> = {
  gypsum_g: 'Gypsum',
  cacl2_g: 'CaCl2',
  epsom_g: 'Epsom',
  nacl_g: 'NaCl',
  nahco3_g: 'NaHCO3',
};

export default function BrewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    loadSession,
    currentSession,
    updateActuals,
    updateStatus,
    updateSession,
    saveCurrentSession,
  } = useBrewSessionStore();
  const {
    currentRecipe: editorRecipe,
    setCurrentRecipe: setEditorRecipe,
    updateRecipe: updateEditorRecipe,
  } = useRecipeStore();
  const saveTimerRef = useRef<number | null>(null);
  const editorSnapshotRef = useRef<Recipe | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  const brewDayCalcs = useRecipeCalculations(currentSession?.brewDayRecipe ?? null);
  const editorCalcs = useRecipeCalculations(editorRecipe ?? null);

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading session...</div>
      </div>
    );
  }

  const sessionRecipe = currentSession.brewDayRecipe;
  const targetMashTempC = sessionRecipe.mashSteps[0]?.temperatureC ?? 66;
  const strikeTempC = volumeCalculationService.calculateStrikeTemp(
    targetMashTempC,
    sessionRecipe.equipment.mashThicknessLPerKg
  );
  const spargeTempC = 76;
  const pitchTempC = sessionRecipe.fermentationSteps[0]?.temperatureC;
  const mashWaterL = brewDayCalcs?.mashWaterL ?? 0;
  const spargeWaterL = brewDayCalcs?.spargeWaterL ?? 0;
  const saltAdditions = sessionRecipe.waterChemistry?.saltAdditions ?? {};
  const { mashSalts, spargeSalts } = waterChemistryService.splitSaltsProportionally(
    saltAdditions,
    mashWaterL,
    spargeWaterL
  );

  const queueSave = () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveCurrentSession();
    }, 400);
  };

  const updateActual = (updates: Partial<typeof currentSession.actuals>) => {
    updateActuals(updates);
    queueSave();
  };

  const openBrewedEditor = () => {
    editorSnapshotRef.current = editorRecipe;
    const clone = deepCloneRecipe(sessionRecipe);
    setEditorRecipe(clone);
    setIsEditModalOpen(true);
  };

  const closeBrewedEditor = () => {
    setIsEditModalOpen(false);
    setEditorRecipe(editorSnapshotRef.current ?? null);
  };

  const saveBrewedVersion = () => {
    if (!editorRecipe) return;
    const now = new Date().toISOString();
    const versionNumber =
      currentSession.brewedVersionNumber ??
      recipeVersionRepository.getLatestVersionNumber(currentSession.recipeId) + 1;

    const brewedSnapshot: Recipe = {
      ...editorRecipe,
      currentVersion: versionNumber,
      updatedAt: now,
    };

    const brewedVersion: RecipeVersion = {
      id: crypto.randomUUID(),
      recipeId: currentSession.recipeId,
      versionNumber,
      createdAt: now,
      changeNotes: `Brew session ${currentSession.id}`,
      recipeSnapshot: brewedSnapshot,
    };

    recipeVersionRepository.save(brewedVersion);
    updateSession({
      brewDayRecipe: brewedSnapshot,
      recipeName: brewedSnapshot.name,
      brewedVersionNumber: versionNumber,
    });
    saveCurrentSession();
    closeBrewedEditor();
  };


  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/beta-builder/recipes')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Recipes
            </button>
            <div className="flex items-center gap-3">
              <select
                value={currentSession.status}
                onChange={(e) => {
                  updateStatus(e.target.value as SessionStatus);
                  saveCurrentSession();
                }}
                className="px-3 py-1 border border-[rgb(var(--border))] rounded-md bg-[rgb(var(--bg))]"
              >
                <option value="planning">Planning</option>
                <option value="brewing">Brewing</option>
                <option value="fermenting">Fermenting</option>
                <option value="conditioning">Conditioning</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={openBrewedEditor}
                className="px-3 py-1 text-sm border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))]"
              >
                Edit Brewed Version
              </button>
              <button
                onClick={() => {
                  saveCurrentSession();
                  navigate('/beta-builder/recipes');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {currentSession.recipeName}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Brewed: {new Date(currentSession.brewDate).toLocaleDateString()}</span>
            <span>Version {currentSession.recipeVersionNumber}</span>
            {currentSession.brewedVersionNumber && (
              <span>Brewed v{currentSession.brewedVersionNumber}</span>
            )}
          </div>
        </header>

        <SectionCard
          title="Ingredients"
          description="Read-only view. Use Edit Brewed Version to adjust."
          tone="slate"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <IngredientCard tone="fermentables">
              <div className="space-y-3">
                <SubSectionHeader title="Grains" />
                {sessionRecipe.fermentables.length === 0 && (
                  <div className="text-sm text-gray-500">No fermentables listed.</div>
                )}
                <div className="space-y-2">
                  {sessionRecipe.fermentables.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-md bg-[rgb(var(--bg))] p-2">
                      <div>
                        <div className="text-sm font-medium">{f.name}</div>
                        <div className="text-xs text-gray-500">{f.colorLovibond} L</div>
                      </div>
                      <ReadOnlyNumber
                        value={f.weightKg}
                        format={(value) => value.toFixed(2)}
                        suffix=" kg"
                        className="text-sm font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </IngredientCard>

            <IngredientCard tone="hops">
              <div className="space-y-3">
                <SubSectionHeader title="Hops" />
                {sessionRecipe.hops.length === 0 && (
                  <div className="text-sm text-gray-500">No hops listed.</div>
                )}
                <div className="space-y-2">
                  {sessionRecipe.hops.map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded-md bg-[rgb(var(--bg))] p-2">
                      <div>
                        <div className="text-sm font-medium">{h.name}</div>
                        <div className="text-xs text-gray-500">
                          {h.type}
                          {h.timeMinutes !== undefined && ` • ${h.timeMinutes} min`}
                        </div>
                      </div>
                      <ReadOnlyNumber
                        value={h.grams}
                        format={(value) => value.toFixed(0)}
                        suffix=" g"
                        className="text-sm font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </IngredientCard>

            <IngredientCard tone="yeast" className="md:col-span-2">
              <div className="space-y-3">
                <SubSectionHeader title="Yeast" />
                {sessionRecipe.yeast ? (
                  <div className="space-y-2 rounded-md bg-[rgb(var(--bg))] p-3">
                    <div className="text-sm font-medium">{sessionRecipe.yeast.name}</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium capitalize">
                          {sessionRecipe.yeast.starter?.yeastType
                            ? sessionRecipe.yeast.starter.yeastType.replace('-', ' ')
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Packs</span>
                        <ReadOnlyNumber
                          value={sessionRecipe.yeast.starter?.packs}
                          format={(value) => value.toFixed(0)}
                        />
                      </div>
                    </div>
                    {sessionRecipe.yeast.starter?.steps?.length ? (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {sessionRecipe.yeast.starter.mfgDate && (
                          <div className="flex items-center justify-between col-span-2">
                            <span className="text-gray-500">Mfg</span>
                            <span className="font-medium">{sessionRecipe.yeast.starter.mfgDate}</span>
                          </div>
                        )}
                        {sessionRecipe.yeast.starter.slurryLiters !== undefined && (
                          <div className="flex items-center justify-between col-span-2">
                            <span className="text-gray-500">Slurry</span>
                            <span className="font-medium">
                              {sessionRecipe.yeast.starter.slurryLiters.toFixed(1)} L
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No yeast selected.
                  </div>
                )}
              </div>
            </IngredientCard>

            <IngredientCard tone="water" className="md:col-span-2">
              <div className="space-y-3">
                <SubSectionHeader title="Water & Salts" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-md bg-[rgb(var(--bg))] p-3">
                    <div className="text-xs text-gray-500 uppercase">Strike Water</div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-500">Target</span>
                      <span className="font-medium">{formatNumber(mashWaterL, 1)} L</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Actual</span>
                      <EditableNumber
                        value={currentSession.actuals.strikeWaterL}
                        onCommit={(value) => updateActual({ strikeWaterL: value })}
                        step={0.1}
                        format={(value) => value.toFixed(1)}
                        suffix=" L"
                      />
                    </div>
                  </div>
                  <div className="rounded-md bg-[rgb(var(--bg))] p-3">
                    <div className="text-xs text-gray-500 uppercase">Sparge Water</div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-500">Target</span>
                      <span className="font-medium">{formatNumber(spargeWaterL, 1)} L</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Actual</span>
                      <EditableNumber
                        value={currentSession.actuals.spargeWaterL}
                        onCommit={(value) => updateActual({ spargeWaterL: value })}
                        step={0.1}
                        format={(value) => value.toFixed(1)}
                        suffix=" L"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-[rgb(var(--bg))] p-3">
                  <div className="text-xs text-gray-500 uppercase">Salts (grams)</div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-2">
                    <span>Salt</span>
                    <span>Strike</span>
                    <span>Sparge</span>
                  </div>
                  {sessionRecipe.waterChemistry ? (
                    <div className="space-y-2 mt-2">
                      {SALT_KEYS.map((key) => (
                        <div key={key} className="grid grid-cols-3 gap-2 items-center text-sm">
                          <span className="text-gray-600">{SALT_LABELS[key]}</span>
                          <ReadOnlyNumber
                            value={mashSalts[key]}
                            format={(value) => value.toFixed(2)}
                            suffix=" g"
                          />
                          <ReadOnlyNumber
                            value={spargeSalts[key]}
                            format={(value) => value.toFixed(2)}
                            suffix=" g"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-2">
                      No water profile.
                    </div>
                  )}
                </div>
              </div>
            </IngredientCard>
          </div>
        </SectionCard>

        <SectionCard title="Gravity" description="Expected vs recorded for this session." tone="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md bg-[rgb(var(--bg))] p-3">
              <div className="text-xs text-gray-500 uppercase">Original Gravity</div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Expected</span>
                <span className="font-medium">{formatNumber(brewDayCalcs?.og, 3)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Recorded</span>
                <EditableNumber
                  value={currentSession.actuals.originalGravity}
                  onCommit={(value) => updateActual({ originalGravity: value })}
                  step={0.001}
                  format={(value) => value.toFixed(3)}
                />
              </div>
            </div>
            <div className="rounded-md bg-[rgb(var(--bg))] p-3">
              <div className="text-xs text-gray-500 uppercase">Final Gravity</div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Expected</span>
                <span className="font-medium">{formatNumber(brewDayCalcs?.fg, 3)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Recorded</span>
                <EditableNumber
                  value={currentSession.actuals.finalGravity}
                  onCommit={(value) => updateActual({ finalGravity: value })}
                  step={0.001}
                  format={(value) => value.toFixed(3)}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Instructions" description="Brew day steps in order." tone="emerald">
          <div className="space-y-4">
            {sessionRecipe.yeast?.starter?.steps?.length ? (
              <InstructionStep number={1} title="Starter (if using)">
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md bg-[rgb(var(--bg))] p-2 text-sm">
                    <span className="text-gray-500">Packs</span>
                    <ReadOnlyNumber
                      value={sessionRecipe.yeast.starter.packs}
                      format={(value) => value.toFixed(0)}
                    />
                  </div>
                  {sessionRecipe.yeast.starter.steps.map((step) => (
                    <div key={step.id} className="rounded-md bg-[rgb(var(--bg))] p-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <InfoPill text={`${step.liters.toFixed(1)} L`} />
                        <InfoPill text={`${step.gravity.toFixed(3)} SG`} />
                      </div>
                    </div>
                  ))}
                </div>
              </InstructionStep>
            ) : null}

            <InstructionStep number={sessionRecipe.yeast?.starter?.steps?.length ? 2 : 1} title="Warm strike + sparge water">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-[rgb(var(--bg))] p-2">
                  <div className="text-xs text-gray-500 uppercase">Strike</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <InfoPill text={`${formatNumber(mashWaterL, 1)} L`} />
                    <InfoPill text={`${strikeTempC.toFixed(1)} °C`} />
                  </div>
                </div>
                <div className="rounded-md bg-[rgb(var(--bg))] p-2">
                  <div className="text-xs text-gray-500 uppercase">Sparge</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <InfoPill text={`${formatNumber(spargeWaterL, 1)} L`} />
                    <InfoPill text={`${spargeTempC.toFixed(0)} °C`} />
                  </div>
                </div>
              </div>
            </InstructionStep>

            <InstructionStep
              number={sessionRecipe.yeast?.starter?.steps?.length ? 3 : 2}
              title="Add water salts (strike + sparge)"
            >
              {sessionRecipe.waterChemistry ? (
                <div className="space-y-2">
                  {SALT_KEYS.map((key) => (
                    <div key={key} className="grid grid-cols-3 gap-2 items-center text-sm">
                      <span className="text-gray-600">{SALT_LABELS[key]}</span>
                      <ReadOnlyNumber
                        value={mashSalts[key]}
                        format={(value) => value.toFixed(2)}
                        suffix=" g"
                      />
                      <ReadOnlyNumber
                        value={spargeSalts[key]}
                        format={(value) => value.toFixed(2)}
                        suffix=" g"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No water profile.</div>
              )}
            </InstructionStep>

            <InstructionStep
              number={sessionRecipe.yeast?.starter?.steps?.length ? 4 : 3}
              title="Mash in"
            >
              {sessionRecipe.fermentables.length === 0 ? (
                <div className="text-sm text-gray-500">No grains listed.</div>
              ) : (
                <div className="space-y-2">
                  {sessionRecipe.fermentables.map((fermentable) => (
                    <div
                      key={fermentable.id}
                      className="flex items-center justify-between rounded-md bg-[rgb(var(--bg))] px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{fermentable.name}</span>
                      <InfoPill text={`${fermentable.weightKg.toFixed(2)} kg`} />
                    </div>
                  ))}
                </div>
              )}
            </InstructionStep>

            <InstructionStep
              number={sessionRecipe.yeast?.starter?.steps?.length ? 5 : 4}
              title="Mash steps"
            >
              {sessionRecipe.mashSteps.length === 0 ? (
                <div className="text-sm text-gray-500">No mash steps.</div>
              ) : (
                <div className="space-y-2">
                  {sessionRecipe.mashSteps.map((step) => (
                    <div key={step.id} className="rounded-md bg-[rgb(var(--bg))] p-2 text-sm">
                      <div className="font-medium">{step.name}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <InfoPill text={`${step.temperatureC.toFixed(1)} °C`} />
                        <InfoPill text={`${step.durationMinutes.toFixed(0)} min`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </InstructionStep>

            <InstructionStep
              number={sessionRecipe.yeast?.starter?.steps?.length ? 6 : 5}
              title="Pull grains and sparge"
            >
              <div className="flex flex-wrap gap-2 text-sm">
                <InfoPill text={`Sparge ${formatNumber(spargeWaterL, 1)} L`} />
                <InfoPill text={`${spargeTempC.toFixed(0)} °C`} />
              </div>
            </InstructionStep>

            <InstructionStep
              number={sessionRecipe.yeast?.starter?.steps?.length ? 7 : 6}
              title="Boil + hop additions"
            >
              {sessionRecipe.hops.length === 0 ? (
                <div className="text-sm text-gray-500">No hop additions.</div>
              ) : (
                <div className="space-y-2">
                  {sessionRecipe.hops.map((hop) => (
                    <div key={hop.id} className="rounded-md bg-[rgb(var(--bg))] p-2 text-sm">
                      <div className="font-medium">{hop.name}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <InfoPill text={`${hop.grams.toFixed(0)} g`} />
                        <InfoPill text={hop.type} />
                        {hop.timeMinutes !== undefined && (
                          <InfoPill text={`${hop.timeMinutes} min`} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </InstructionStep>

            <InstructionStep
              number={sessionRecipe.yeast?.starter?.steps?.length ? 8 : 7}
              title="Cool and pitch yeast"
            >
              <div className="flex flex-wrap gap-2 text-sm">
                {pitchTempC !== undefined ? (
                  <InfoPill text={`Pitch at ${pitchTempC.toFixed(1)} °C`} />
                ) : (
                  <span className="text-gray-500">Pitch temp not set.</span>
                )}
              </div>
            </InstructionStep>

            <InstructionStep
              number={sessionRecipe.yeast?.starter?.steps?.length ? 9 : 8}
              title="Fermentation steps"
            >
              {sessionRecipe.fermentationSteps.filter((step) => step.type !== 'conditioning' && step.type !== 'cold-crash')
                .length === 0 ? (
                <div className="text-sm text-gray-500">No fermentation steps.</div>
              ) : (
                <div className="space-y-2">
                  {sessionRecipe.fermentationSteps
                    .filter((step) => step.type !== 'conditioning' && step.type !== 'cold-crash')
                    .map((step) => (
                      <div key={step.id} className="rounded-md bg-[rgb(var(--bg))] p-2 text-sm">
                        <div className="font-medium">{step.name}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <InfoPill text={`${step.temperatureC.toFixed(1)} °C`} />
                          <InfoPill text={`${step.durationDays.toFixed(0)} days`} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </InstructionStep>

            <InstructionStep
              number={sessionRecipe.yeast?.starter?.steps?.length ? 10 : 9}
              title="Conditioning steps"
            >
              {sessionRecipe.fermentationSteps.filter((step) => step.type === 'conditioning' || step.type === 'cold-crash')
                .length === 0 ? (
                <div className="text-sm text-gray-500">No conditioning steps.</div>
              ) : (
                <div className="space-y-2">
                  {sessionRecipe.fermentationSteps
                    .filter((step) => step.type === 'conditioning' || step.type === 'cold-crash')
                    .map((step) => (
                      <div key={step.id} className="rounded-md bg-[rgb(var(--bg))] p-2 text-sm">
                        <div className="font-medium">{step.name}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <InfoPill text={`${step.temperatureC.toFixed(1)} °C`} />
                          <InfoPill text={`${step.durationDays.toFixed(0)} days`} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </InstructionStep>
          </div>
        </SectionCard>

        <SectionCard title="Brew Notes" tone="slate">
          <h2 className="text-xl font-semibold mb-4">Brew Notes</h2>
          <textarea
            value={currentSession.notes || ''}
            onChange={(e) => {
              updateSession({ notes: e.target.value });
              queueSave();
            }}
            placeholder="Notes about this brew day..."
            className="w-full h-32 px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-[rgb(var(--bg))] resize-none"
          />
        </SectionCard>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="w-[95vw] max-w-6xl max-h-[92vh] bg-[rgb(var(--bg))] rounded-xl shadow-2xl border border-[rgb(var(--border))] overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[rgb(var(--border))] bg-white/80 dark:bg-gray-900/50">
              <div className="flex-1">
                <div className="text-xs text-gray-500">Brewed version editor</div>
                <input
                  type="text"
                  value={editorRecipe?.name ?? ''}
                  onChange={(e) => updateEditorRecipe({ name: e.target.value })}
                  className="w-full text-xl font-semibold bg-transparent border-b border-transparent focus:border-[rgb(var(--border))] outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeBrewedEditor}
                  className="px-4 py-2 text-sm border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBrewedVersion}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Save Brewed Version
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(92vh-80px)] space-y-6">
              {editorRecipe ? (
                <>
                  <EquipmentSection />
                  <FermentableSection />
                  <HopSection />
                  <YeastSection />
                  <WaterSection calculations={editorCalcs} recipe={editorRecipe} />
                  <MashScheduleSection />
                  <FermentationSection />
                </>
              ) : (
                <div className="text-sm text-gray-500">Loading editor…</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(value: number | undefined, digits: number) {
  if (value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
      {children}
    </div>
  );
}

function IngredientCard({
  tone,
  className = '',
  children,
}: {
  tone: 'fermentables' | 'hops' | 'yeast' | 'water';
  className?: string;
  children: ReactNode;
}) {
  const toneBorder = {
    fermentables: 'border-blue-500',
    hops: 'border-green-500',
    yeast: 'border-amber-500',
    water: 'border-cyan-500',
  } as const;

  return (
    <div
      className={`rounded-lg border border-[rgb(var(--border))] border-t-4 bg-[rgb(var(--card))] p-4 shadow-sm ${toneBorder[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

function InstructionStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center">
          {number}
        </div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 px-2.5 py-1 text-xs font-medium">
      {text}
    </span>
  );
}

function deepCloneRecipe(recipe: Recipe): Recipe {
  if (typeof structuredClone === 'function') {
    return structuredClone(recipe) as Recipe;
  }
  return JSON.parse(JSON.stringify(recipe)) as Recipe;
}

function SubSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <SectionTitle>{title}</SectionTitle>
      {actionLabel && onAction && (
        <button onClick={onAction} className="text-xs text-blue-600 hover:text-blue-700">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  tone = 'slate',
  children,
}: {
  title: string;
  description?: string;
  tone?: 'blue' | 'amber' | 'emerald' | 'slate';
  children: ReactNode;
}) {
  const toneStyles = {
    blue: 'border-t-blue-500/60 bg-blue-50/30 dark:bg-blue-950/10',
    amber: 'border-t-amber-400/70 bg-amber-50/40 dark:bg-amber-950/10',
    emerald: 'border-t-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/10',
    slate: 'border-t-slate-300/70 bg-white/80 dark:bg-gray-900/40',
  } as const;

  return (
    <div
      className={`rounded-xl border border-[rgb(var(--border))] border-t-4 p-5 shadow-sm ${toneStyles[tone]}`}
    >
      <div className="mb-4">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</div>
        {description && <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>}
      </div>
      {children}
    </div>
  );
}

function ReadOnlyNumber({
  value,
  format,
  suffix,
  placeholder = '—',
  className = '',
}: {
  value: number | undefined;
  format?: (value: number) => string;
  suffix?: string;
  placeholder?: string;
  className?: string;
}) {
  const displayValue =
    value === undefined
      ? placeholder
      : `${format ? format(value) : value}${suffix ?? ''}`;

  return <span className={className}>{displayValue}</span>;
}

function EditableNumber({
  value,
  onCommit,
  step = 0.1,
  format,
  suffix,
  placeholder = '—',
  className = '',
}: {
  value: number | undefined;
  onCommit: (value: number | undefined) => void;
  step?: number;
  format?: (value: number) => string;
  suffix?: string;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value === undefined ? '' : String(value));

  useEffect(() => {
    setDraft(value === undefined ? '' : String(value));
  }, [value]);

  const displayValue =
    value === undefined
      ? placeholder
      : `${format ? format(value) : value}${suffix ?? ''}`;

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      onCommit(undefined);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setDraft(value === undefined ? '' : String(value));
      return;
    }
    onCommit(parsed);
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${className}`}>{displayValue}</span>
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        step={step}
        className="w-24 px-2 py-1 text-sm border border-[rgb(var(--border))] rounded bg-[rgb(var(--bg))] text-right"
      />
    </div>
  );
}
