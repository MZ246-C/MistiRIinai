import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { AppSettings } from "@/lib/types";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "@/components/ui/Feedback";
import { LogOut } from "lucide-react";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { show } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

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

      <p className="mt-6 text-center text-xs text-booth-ink/40 dark:text-booth-paper/40">
        Roadmap: multi-user accounts &amp; roles, command palette, memory timeline, export/import, and audit
        log viewer are designed for but not yet built — see README "What's next."
      </p>
    </div>
  );
}
