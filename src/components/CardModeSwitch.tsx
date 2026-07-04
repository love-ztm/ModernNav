import React from "react";
import { Grid3x3, LayoutGrid, List, LucideIcon } from "lucide-react";
import { CardDisplayMode } from "../types";

interface CardModeSwitchProps {
  mode: CardDisplayMode;
  onChange: (mode: CardDisplayMode) => void;
}

const modes: { value: CardDisplayMode; icon: LucideIcon }[] = [
  { value: "compact", icon: Grid3x3 },
  { value: "standard", icon: LayoutGrid },
  { value: "list", icon: List },
];

export const CardModeSwitch: React.FC<CardModeSwitchProps> = ({ mode, onChange }) => {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-muted)]">
      {modes.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`p-1.5 rounded-md transition-colors ${
            mode === value
              ? "bg-[var(--theme-primary)] text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
          title={value}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
};
