import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { AppSettings } from "@/lib/types";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/context/ThemeContext";
import { useAppearance } from "@/context/AppearanceContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "@/components/ui/Feedback";
import { LogOut, Check } from "lucide-react";

const ICON_PRESETS = [
  { label: "Dusk plum", bg: "#311D28", letter: "#B99040" },
  { label: "Midnight", bg: "#1C1520", letter: "#D2ABBB" },
  { label: "Rosewood", bg: "#402030", letter: "#E7B4BE" },
  { label: "Ink & gold", bg: "#150F13", letter: "#D3AE63" },
];

const SITE_PRESETS = [
  { label: "Dusk plum", color: "#402030" },
  { label: "Wine", color: "#582939" },
  { label: "Rose", color: "#B5758F" },
  { label: "Gold", color: "#B8903F" },
];

function ColorPicker({
  label,
  value,
  onChange,
  presets,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  presets: { label: string; color: string }[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-booth-ink/70 dark:text-booth-paper/70">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button
            key={p.color}
            onClick={() => onChange(p.color)}
            title={p.label}
            aria-label={p.label}
            className="relative h-8 w-8 rounded-full ring-1 ring-black/10 dark:ring-white/20"
            style={{ backgroundColor: p.color }}
          >
            {value.toLowerCase() === p.color.toLowerCase() && (
              <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow" />
            )}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-booth-ink/10 dark:bg-white/10" />
        <label className="flex items-center gap-2 text-xs text-booth-ink/60 dark:text-booth-paper/60">
          Custom
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-booth-plum-200 bg-transparent dark:border-white/10"
          />
        </label>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { show } = useToast();
  const { logout } = useAuth();
  const { applyLocally } = useAppearance();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);

  useEffect(() => {
    api.get<{ settings: AppSettings }>("/settings-get").then((res) => setSettings(res.settings));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      await api.patch("/settings-update", {
        siteSubtitle: settings.site_subtitle,
        defaultGalleryLayout: settings.default_gallery_layout,
        defaultSort: settings.default_sort,
        dateFormat: settings.date_format,
        timeFormat: settings.time_format,
      });
      show("Settings saved.", "success");
    } catch {
      show("Couldn't save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveAppearance() {
    if (!settings) return;
    setSavingAppearance(true);
    try {
      await api.patch("/settings-update", {
        iconBgColor: settings.icon_bg_color,
        iconLetterColor: settings.icon_letter_color,
        siteThemeColor: settings.site_theme_color,
      });
      applyLocally({
        icon_bg_color: settings.icon_bg_color,
        icon_letter_color: settings.icon_letter_color,
        site_theme_color: settings.site_theme_color,
      });
      show("Appearance saved.", "success");
    } catch {
      show("Couldn't save appearance.", "error");
    } finally {
      setSavingAppearance(false);
    }
  }

  if (!settings) return <LoadingState label="Loading settings..." />;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6 md:pb-10">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 font-display text-2xl text-booth-ink dark:text-booth-paper"
      >
        Settings
      </motion.h1>

      <div className="flex flex-col gap-5 rounded-3xl bg-white/50 p-5 dark:bg-white/5 sm:p-6">
        <Input
          label="Site subtitle"
          value={settings.site_subtitle}
          onChange={(e) => setSettings({ ...settings, site_subtitle: e.target.value })}
        />

        <Select label="Theme" value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
          <option value="system">Match system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>

        <Select
          label="Default gallery layout"
          value={settings.default_gallery_layout}
          onChange={(e) =>
            setSettings({ ...settings, default_gallery_layout: e.target.value as AppSettings["default_gallery_layout"] })
          }
        >
          <option value="masonry">Masonry</option>
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </Select>

        <Select
          label="Default sort order"
          value={settings.default_sort}
          onChange={(e) => setSettings({ ...settings, default_sort: e.target.value as AppSettings["default_sort"] })}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="recently_updated">Recently updated</option>
          <option value="alphabetical">Alphabetical</option>
        </Select>

        <Select
          label="Time format"
          value={settings.time_format}
          onChange={(e) => setSettings({ ...settings, time_format: e.target.value as AppSettings["time_format"] })}
        >
          <option value="12h">12-hour</option>
          <option value="24h">24-hour</option>
        </Select>

        <div className="flex justify-end">
          <Button onClick={save} loading={saving}>
            Save settings
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white/50 p-5 dark:bg-white/5 sm:p-6">
        <h2 className="mb-1 font-display text-lg text-booth-ink dark:text-booth-paper">Appearance</h2>
        <p className="mb-5 text-sm text-booth-ink/60 dark:text-booth-paper/60">
          Pick a preset theme or customize your own colors for the app icon and the website.
        </p>

        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-medium text-booth-ink dark:text-booth-paper">App icon</p>
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-2xl font-bold shadow-soft"
                style={{ backgroundColor: settings.icon_bg_color, color: settings.icon_letter_color }}
              >
                M
              </div>
              <p className="text-xs text-booth-ink/50 dark:text-booth-paper/50">
                Preview — this is what a freshly added home-screen icon will look like on Android.
                On iPhone, the home screen icon uses the original dusk-plum/gold design regardless
                of this setting (iOS doesn't support dynamically colored icons).
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorPicker
                label="Background"
                value={settings.icon_bg_color}
                onChange={(hex) => setSettings({ ...settings, icon_bg_color: hex })}
                presets={ICON_PRESETS.map((p) => ({ label: p.label, color: p.bg }))}
              />
              <ColorPicker
                label="Letter"
                value={settings.icon_letter_color}
                onChange={(hex) => setSettings({ ...settings, icon_letter_color: hex })}
                presets={ICON_PRESETS.map((p) => ({ label: p.label, color: p.letter }))}
              />
            </div>
          </div>

          <div className="h-px bg-booth-ink/10 dark:bg-white/10" />

          <ColorPicker
            label="Website color"
            value={settings.site_theme_color}
            onChange={(hex) => setSettings({ ...settings, site_theme_color: hex })}
            presets={SITE_PRESETS}
          />

          <div className="flex justify-end">
            <Button onClick={saveAppearance} loading={savingAppearance}>
              Save appearance
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white/50 p-5 dark:bg-white/5 sm:p-6">
        <h2 className="mb-2 font-display text-lg text-booth-ink dark:text-booth-paper">Account</h2>
        <p className="mb-4 text-sm text-booth-ink/60 dark:text-booth-paper/60">
          To change the shared password, update the <code>INITIAL_ADMIN_PASSWORD</code> value and clear the
          stored hash — see the setup guide for the exact steps.
        </p>
        <Button
          variant="secondary"
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          <LogOut size={15} /> Log out
        </Button>
      </div>
    </div>
  );
}