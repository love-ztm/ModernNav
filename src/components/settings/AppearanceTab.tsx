import React, { useState } from "react";
import {
  Sliders,
  RotateCcw,
  Save,
  Wand2,
  Loader2,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Layers,
  Type,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { DEFAULT_BACKGROUND } from "../../services/storage";
import {
  DEFAULT_LAYOUT_UI,
  DEFAULT_GLASS_BLUR,
  DEFAULT_GLASS_SATURATION,
  DEFAULT_GLASS_NOISE,
  DEFAULT_GLASS_TINT,
  DEFAULT_RADIUS_SCALE,
  DEFAULT_DENSITY_SCALE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_FONT_SIZE,
  DEFAULT_ANIMATION_LEVEL,
  DEFAULT_ANIMATION_SPEED,
  DEFAULT_ANIMATION_STAGGER,
  DEFAULT_NAV_STYLE,
  DEFAULT_SEARCH_STYLE,
  DEFAULT_CARD_DISPLAY_MODE,
  DEFAULT_THEME_PRESET,
} from "../../constants/defaults";
import { THEME_PRESETS } from "../../constants/themes";
import { getDominantColor } from "../../utils/color";
import { useViewportScale } from "../../hooks/useViewportScale";
import { getIconSize } from "../../utils/favicon";
import { SettingsContainer, SettingsSection, SettingsRow } from "./SettingsPrimitives";
import {
  ThemePresetName,
  AnimationLevel,
  CardDisplayMode,
  NavStyle,
  SearchStyle,
  FontWeightOption,
  UserPreferences,
} from "../../types";

interface AppearanceTabProps {
  prefs: UserPreferences;
  currentBackground: string;
  onUpdate: (background: string, prefs: Partial<UserPreferences>) => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  prefs,
  currentBackground,
  onUpdate,
}) => {
  const { t } = useLanguage();
  const viewportScale = useViewportScale();
  const s = (n: number) => getIconSize(n, viewportScale);

  const [bgInput, setBgInput] = useState(currentBackground);
  const [opacityInput, setOpacityInput] = useState(prefs.cardOpacity);
  const [themeColorInput, setThemeColorInput] = useState(prefs.themeColor || "#8b9dc3");
  const [localAutoMode, setLocalAutoMode] = useState(prefs.themeColorAuto ?? true);
  const [themePreset, setThemePreset] = useState<ThemePresetName>(
    prefs.themePreset ?? DEFAULT_THEME_PRESET
  );

  const [widthInput, setWidthInput] = useState(prefs.maxContainerWidth ?? DEFAULT_LAYOUT_UI.width);
  const [cardWidthInput, setCardWidthInput] = useState(
    prefs.cardWidth ?? DEFAULT_LAYOUT_UI.cardWidth
  );
  const [cardHeightInput, setCardHeightInput] = useState(
    prefs.cardHeight ?? DEFAULT_LAYOUT_UI.cardHeight
  );
  const [colsInput, setColsInput] = useState(prefs.gridColumns ?? DEFAULT_LAYOUT_UI.cols);

  const [cardDisplayMode, setCardDisplayMode] = useState<CardDisplayMode>(
    prefs.cardDisplayMode ?? DEFAULT_CARD_DISPLAY_MODE
  );
  const [animationLevel, setAnimationLevel] = useState<AnimationLevel>(
    prefs.animationLevel ?? DEFAULT_ANIMATION_LEVEL
  );
  const [animationSpeed, setAnimationSpeed] = useState(
    prefs.animationSpeed ?? DEFAULT_ANIMATION_SPEED
  );
  const [animationStagger, setAnimationStagger] = useState(
    prefs.animationStagger ?? DEFAULT_ANIMATION_STAGGER
  );

  const [glassBlur, setGlassBlur] = useState(prefs.glassBlur ?? DEFAULT_GLASS_BLUR);
  const [glassSaturation, setGlassSaturation] = useState(
    prefs.glassSaturation ?? DEFAULT_GLASS_SATURATION
  );
  const [glassNoise, setGlassNoise] = useState(prefs.glassNoise ?? DEFAULT_GLASS_NOISE);
  const [glassTint, setGlassTint] = useState(prefs.glassTint ?? DEFAULT_GLASS_TINT);

  const [radiusScale, setRadiusScale] = useState(prefs.radiusScale ?? DEFAULT_RADIUS_SCALE);
  const [densityScale, setDensityScale] = useState(prefs.densityScale ?? DEFAULT_DENSITY_SCALE);
  const [fontWeight, setFontWeight] = useState<FontWeightOption>(
    prefs.fontWeight ?? DEFAULT_FONT_WEIGHT
  );
  const [fontSize, setFontSize] = useState(prefs.fontSize ?? DEFAULT_FONT_SIZE);
  const [navStyle, setNavStyle] = useState<NavStyle>(prefs.navStyle ?? DEFAULT_NAV_STYLE);
  const [searchStyle, setSearchStyle] = useState<SearchStyle>(
    prefs.searchStyle ?? DEFAULT_SEARCH_STYLE
  );

  const [bgStatus, setBgStatus] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);

  const handleResetBackground = () => {
    setBgInput(DEFAULT_BACKGROUND);
    setBgStatus(t("bg_updated"));
    setTimeout(() => setBgStatus(""), 3000);
  };

  const handleSave = () => {
    onUpdate(bgInput, {
      cardOpacity: opacityInput,
      themeColor: themeColorInput,
      themeColorAuto: localAutoMode,
      themePreset,
      maxContainerWidth: widthInput,
      cardWidth: cardWidthInput,
      cardHeight: cardHeightInput,
      gridColumns: colsInput,
      cardDisplayMode,
      animationLevel,
      animationSpeed,
      animationStagger,
      glassBlur,
      glassSaturation,
      glassNoise,
      glassTint,
      radiusScale,
      densityScale,
      fontWeight,
      fontSize,
      navStyle,
      searchStyle,
    });
    setBgStatus(t("bg_updated"));
    setTimeout(() => setBgStatus(""), 3000);
  };

  const handleColorPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThemeColorInput(e.target.value);
    setLocalAutoMode(false);
  };

  const handlePresetSelect = (name: ThemePresetName) => {
    const preset = THEME_PRESETS[name as Exclude<ThemePresetName, "custom">];
    if (preset) {
      setThemePreset(name);
      setThemeColorInput(preset.primary);
      setLocalAutoMode(false);
    }
  };

  const handleAutoExtract = async () => {
    if (!bgInput) return;
    setIsExtracting(true);
    setBgStatus(t("extracting_color"));
    try {
      const color = await getDominantColor(bgInput);
      setThemeColorInput(color);
      setLocalAutoMode(true);
      setBgStatus(t("theme_updated"));
    } catch {
      setBgStatus("Extraction failed");
    } finally {
      setIsExtracting(false);
      setTimeout(() => setBgStatus(""), 3000);
    }
  };

  const previewStyles: Record<string, string | number> = {
    "--theme-primary": themeColorInput,
    "--theme-hover": `color-mix(in srgb, ${themeColorInput}, black 10%)`,
    "--theme-active": `color-mix(in srgb, ${themeColorInput}, black 20%)`,
    "--theme-light": `color-mix(in srgb, ${themeColorInput}, white 30%)`,
  };

  const animLevels: AnimationLevel[] = ["none", "subtle", "fluid", "expressive"];
  const cardModes: { value: CardDisplayMode; label: string }[] = [
    { value: "compact", label: t("card_mode_compact") },
    { value: "standard", label: t("card_mode_standard") },
    { value: "list", label: t("card_mode_list") },
  ];
  const navStyles: { value: NavStyle; label: string }[] = [
    { value: "floating", label: t("nav_floating") },
    { value: "flush", label: t("nav_flush") },
    { value: "minimal", label: t("nav_minimal") },
  ];
  const searchStyles: { value: SearchStyle; label: string }[] = [
    { value: "pill", label: t("search_pill") },
    { value: "underline", label: t("search_underline") },
    { value: "ghost", label: t("search_ghost") },
  ];
  const fontWeights: { value: FontWeightOption; label: string }[] = [
    { value: "light", label: t("font_light") },
    { value: "regular", label: t("font_regular") },
    { value: "medium", label: t("font_medium") },
  ];

  const SegmentedControl = <T extends string>({
    options,
    value,
    onChange,
  }: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
  }) => (
    <div className="flex gap-1 p-1 surface-active rounded-xl border border-muted">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
            value === opt.value
              ? "bg-[var(--theme-primary)] text-white shadow-md"
              : "text-muted hover:text-secondary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const RangeSlider = ({
    label,
    value,
    min,
    max,
    step,
    unit = "",
    onChange,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange: (v: number) => void;
  }) => (
    <div className="group">
      <div className="flex justify-between mb-1.5 px-1">
        <label className="text-[10px] font-bold text-muted uppercase tracking-widest group-hover:text-secondary transition-colors">
          {label}
        </label>
        <span className="text-[10px] text-[var(--theme-primary)] font-mono font-bold bg-[var(--theme-primary)]/10 px-1.5 py-0.5 rounded leading-none">
          {step < 1 ? value.toFixed(2) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 surface-active rounded-lg appearance-none cursor-pointer accent-[var(--theme-primary)]"
      />
    </div>
  );

  return (
    <SettingsContainer style={previewStyles}>
      {/* Background + Theme Color Preview */}
      <section className="surface-elevated border border-default rounded-2xl overflow-hidden">
        <div className="h-40 relative overflow-hidden group">
          {bgInput.startsWith("http") || bgInput.startsWith("data:") ? (
            <img
              src={bgInput}
              alt="Background"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-700"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <div className="w-full h-full opacity-60" style={{ background: bgInput }} />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl transition-all duration-300"
              style={{
                width: `${(cardWidthInput / 100) * 110}px`,
                height: `${(cardHeightInput / 100) * 80}px`,
                background: `linear-gradient(135deg, rgba(255, 255, 255, ${opacityInput}), rgba(255, 255, 255, ${opacityInput * 0.4}))`,
              }}
            />
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsRow label={t("bg_url_label")}>
            <div className="relative">
              <ImageIcon
                size={s(16)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={bgInput}
                onChange={(e) => setBgInput(e.target.value)}
                placeholder={t("bg_url_placeholder")}
                className="input-primary pl-10 pr-4 font-mono text-[11px]"
              />
            </div>
          </SettingsRow>

          <SettingsRow label={t("label_theme_color")}>
            <div className="flex items-center gap-2">
              <label className="flex flex-1 items-center gap-2 surface-hover rounded-lg p-1.5 border border-muted cursor-pointer hover:surface-active transition-colors">
                <input
                  type="color"
                  value={themeColorInput}
                  onChange={handleColorPick}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent p-0 border-0 shrink-0"
                />
                <span className="text-[10px] font-mono text-secondary uppercase flex-1 text-right pr-1">
                  {themeColorInput}
                </span>
              </label>
              <button
                onClick={handleAutoExtract}
                disabled={isExtracting}
                className="btn-secondary h-9 px-4 rounded-lg disabled:opacity-50"
                title={t("btn_auto_extract")}
              >
                {isExtracting ? (
                  <Loader2 size={s(16)} className="animate-spin" />
                ) : (
                  <Wand2 size={s(16)} />
                )}
              </button>
            </div>
          </SettingsRow>
        </div>
      </section>

      {/* Theme Presets */}
      <SettingsSection
        icon={Palette}
        title={t("theme_presets")}
        description={t("theme_presets_desc")}
      >
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.values(THEME_PRESETS).map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset.name)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                themePreset === preset.name
                  ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 shadow-md"
                  : "border-muted hover:border-[var(--theme-primary)]/40"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full shadow-inner border border-white/20"
                style={{ background: preset.primary }}
              />
              <span className="text-[9px] font-bold uppercase tracking-wider text-secondary">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Card Display Mode */}
      <SettingsSection
        icon={Layers}
        title={t("card_display_mode")}
        description={t("card_display_mode_desc")}
      >
        <SegmentedControl
          options={cardModes}
          value={cardDisplayMode}
          onChange={setCardDisplayMode}
        />
      </SettingsSection>

      {/* Animation System */}
      <SettingsSection
        icon={Sparkles}
        title={t("animation_system")}
        description={t("animation_system_desc")}
      >
        <div className="space-y-4">
          <SegmentedControl
            options={animLevels.map((l) => ({ value: l, label: t(`anim_${l}`) }))}
            value={animationLevel}
            onChange={setAnimationLevel}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RangeSlider
              label={t("anim_speed")}
              value={animationSpeed}
              min={0.3}
              max={2.0}
              step={0.1}
              unit="x"
              onChange={setAnimationSpeed}
            />
            <RangeSlider
              label={t("anim_stagger")}
              value={animationStagger}
              min={10}
              max={80}
              step={5}
              unit="ms"
              onChange={setAnimationStagger}
            />
          </div>
        </div>
      </SettingsSection>

      {/* Glass Quality */}
      <SettingsSection
        icon={Layers}
        title={t("glass_quality")}
        description={t("glass_quality_desc")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RangeSlider
            label={t("glass_blur")}
            value={glassBlur}
            min={0}
            max={80}
            step={2}
            unit="px"
            onChange={setGlassBlur}
          />
          <RangeSlider
            label={t("glass_saturation")}
            value={glassSaturation}
            min={100}
            max={300}
            step={10}
            unit="%"
            onChange={setGlassSaturation}
          />
          <RangeSlider
            label={t("glass_noise")}
            value={glassNoise}
            min={0}
            max={1}
            step={0.05}
            onChange={setGlassNoise}
          />
          <RangeSlider
            label={t("glass_tint")}
            value={glassTint}
            min={0}
            max={1}
            step={0.05}
            onChange={setGlassTint}
          />
        </div>
      </SettingsSection>

      {/* Layout */}
      <SettingsSection
        icon={Sliders}
        title={t("precision_controls")}
        description={t("geometry_layout")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RangeSlider
            label={t("canvas_width")}
            value={widthInput}
            min={600}
            max={1440}
            step={20}
            unit="px"
            onChange={setWidthInput}
          />
          <RangeSlider
            label={t("grid_cols")}
            value={colsInput}
            min={2}
            max={12}
            step={1}
            onChange={setColsInput}
          />
          <RangeSlider
            label={t("card_width")}
            value={cardWidthInput}
            min={60}
            max={200}
            step={4}
            unit="px"
            onChange={setCardWidthInput}
          />
          <RangeSlider
            label={t("card_height")}
            value={cardHeightInput}
            min={60}
            max={200}
            step={4}
            unit="px"
            onChange={setCardHeightInput}
          />
          <RangeSlider
            label={t("surface_opacity")}
            value={opacityInput}
            min={0.05}
            max={0.85}
            step={0.05}
            onChange={setOpacityInput}
          />
        </div>
      </SettingsSection>

      {/* Global Tuning */}
      <SettingsSection icon={Type} title={t("global_tuning")} description={t("global_tuning_desc")}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RangeSlider
              label={t("radius_scale")}
              value={radiusScale}
              min={0}
              max={2}
              step={0.1}
              unit="x"
              onChange={setRadiusScale}
            />
            <RangeSlider
              label={t("density_scale")}
              value={densityScale}
              min={0.7}
              max={1.5}
              step={0.05}
              unit="x"
              onChange={setDensityScale}
            />
            <RangeSlider
              label={t("font_size_scale")}
              value={fontSize}
              min={0.8}
              max={1.3}
              step={0.05}
              unit="x"
              onChange={setFontSize}
            />
          </div>
          <SettingsRow label={t("font_weight")}>
            <SegmentedControl options={fontWeights} value={fontWeight} onChange={setFontWeight} />
          </SettingsRow>
          <SettingsRow label={t("nav_style_label")}>
            <SegmentedControl options={navStyles} value={navStyle} onChange={setNavStyle} />
          </SettingsRow>
          <SettingsRow label={t("search_style_label")}>
            <SegmentedControl
              options={searchStyles}
              value={searchStyle}
              onChange={setSearchStyle}
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* Action bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleResetBackground}
          className="btn-secondary flex-1 py-2.5 rounded-xl tracking-[0.15em] font-bold uppercase group"
        >
          <RotateCcw size={s(14)} className="group-active:rotate-[-90deg] transition-transform" />
          <span className="text-[10px]">{t("reset_bg_btn")}</span>
        </button>
        <button
          onClick={handleSave}
          className="btn-primary flex-1 py-2.5 rounded-xl tracking-[0.2em] text-[11px]"
        >
          <Save size={s(14)} />
          <span>{t("update_bg_btn")}</span>
        </button>
      </div>

      {bgStatus && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 animate-fade-in-up drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] pointer-events-none">
          {bgStatus}
        </div>
      )}
    </SettingsContainer>
  );
};
