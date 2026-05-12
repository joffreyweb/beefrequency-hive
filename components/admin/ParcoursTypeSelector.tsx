"use client";

import { FLAG_KEYS, getDefaultsForParcoursType, type ParcoursFlags } from "@/lib/parcours-defaults";
import { FLAG_LABELS, PARCOURS_TYPE_OPTIONS } from "@/lib/parcours-labels";
import type { ParcoursType } from "@prisma/client";

interface ParcoursTypeSelectorProps {
  parcoursType: ParcoursType;
  flags: ParcoursFlags;
  onChange: (next: { parcoursType: ParcoursType; flags: ParcoursFlags }) => void;
  disabled?: boolean;
}

export default function ParcoursTypeSelector({
  parcoursType,
  flags,
  onChange,
  disabled = false,
}: ParcoursTypeSelectorProps) {
  function handleTypeChange(nextType: ParcoursType) {
    onChange({
      parcoursType: nextType,
      flags: getDefaultsForParcoursType(nextType),
    });
  }

  function handleFlagToggle(flag: keyof ParcoursFlags) {
    onChange({
      parcoursType,
      flags: { ...flags, [flag]: !flags[flag] },
    });
  }

  function handleResetDefaults() {
    onChange({
      parcoursType,
      flags: getDefaultsForParcoursType(parcoursType),
    });
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
      {/* Type de parcours */}
      <div>
        <label
          htmlFor="parcoursType"
          className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
        >
          Type de parcours
        </label>
        <select
          id="parcoursType"
          value={parcoursType}
          onChange={(e) => handleTypeChange(e.target.value as ParcoursType)}
          disabled={disabled}
          className="w-full px-3 py-2.5 bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200 disabled:opacity-50"
        >
          {PARCOURS_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs font-ui text-brun-mid/60 mt-1.5">
          Changer le type pré-coche les modules par défaut. Tu peux ensuite ajuster manuellement.
        </p>
      </div>

      {/* Modules actifs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-ui font-light text-brun-mid uppercase tracking-wider">
            Modules actifs
          </p>
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={disabled}
            className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors disabled:opacity-50"
          >
            Réinitialiser selon le type de parcours
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FLAG_KEYS.map((flag) => (
            <label
              key={flag}
              className={`flex items-center gap-2 px-3 py-2 bg-creme-sacree border border-or-pale rounded-sharp text-sm font-ui cursor-pointer hover:border-or-sacre transition-colors ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={flags[flag]}
                onChange={() => handleFlagToggle(flag)}
                disabled={disabled}
                className="accent-or-sacre"
              />
              <span className="text-brun-chaud">{FLAG_LABELS[flag]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
