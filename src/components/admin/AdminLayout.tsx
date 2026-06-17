import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Settings,
  Image as ImageIcon,
  Database,
  ShieldCheck,
  LogOut,
  Home,
  Shield,
} from "lucide-react";
import { storageService } from "../../services/storage";
import { useLanguage } from "../../contexts/LanguageContext";
import { useBootstrap } from "../../services/queries";
import { ThemeMode } from "../../types";
import { DEFAULT_PREFS } from "../../constants/defaults";

const NAV = [
  { to: "/admin/content", labelKey: "tab_content", Icon: LayoutGrid },
  { to: "/admin/general", labelKey: "tab_general", Icon: Settings },
  { to: "/admin/appearance", labelKey: "tab_appearance", Icon: ImageIcon },
  { to: "/admin/data", labelKey: "tab_data", Icon: Database },
  { to: "/admin/security", labelKey: "tab_security", Icon: ShieldCheck },
] as const;

export const AdminLayout: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data } = useBootstrap();
  const themeMode = data?.prefs.themeMode ?? DEFAULT_PREFS.themeMode;
  const themeClass = themeMode === ThemeMode.Light ? "theme-light" : "theme-dark";

  const handleLogout = async () => {
    await storageService.logout();
    navigate("/admin/auth", { replace: true });
  };

  return (
    <div className={`${themeClass} min-h-screen surface-base text-primary`}>
      {/* ─── Top Navigation Bar (MiSub-style) ─── */}
      <header className="sticky top-0 z-50 w-full surface-elevated backdrop-blur-xl border-b border-default transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="shrink-0 pr-5">
            <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <Shield size={16} className="text-emerald-400" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-primary group-hover:text-emerald-500 transition-colors">
                ModernNav
              </span>
            </button>
          </div>

          {/* Center: Tab navigation */}
          <nav className="flex items-center gap-0.5">
            {NAV.map(({ to, labelKey, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? "text-primary" : "text-secondary hover:text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute inset-0 surface-active rounded-lg" />}
                    <Icon
                      size={15}
                      className={`relative z-10 shrink-0 transition-transform duration-300 ${
                        isActive ? "scale-105" : "opacity-75 group-hover:opacity-100"
                      }`}
                    />
                    <span className="relative z-10">{t(labelKey)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center pl-5 ml-3 gap-2">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-full text-secondary hover:text-primary surface-hover transition-colors"
              title={t("back_to_home") || "Back to home"}
            >
              <Home size={18} />
            </button>
            <div className="h-4 w-px bg-[var(--border)] mx-1" />
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title={t("logout")}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Page Content (centered, comfortable width) ─── */}
      <main className="w-full">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
