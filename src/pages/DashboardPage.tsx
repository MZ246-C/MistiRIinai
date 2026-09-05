import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Image, Video, Music, FileText, Type as TypeIcon, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import { LoadingState } from "@/components/ui/Feedback";
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents";
import { MemoryCard } from "@/components/memories/MemoryCard";

const STAT_ITEMS = [
  { key: "photo", label: "Photos", icon: Image },
  { key: "video", label: "Videos", icon: Video },
  { key: "audio", label: "Audio", icon: Music },
  { key: "document", label: "Documents", icon: FileText },
  { key: "text", label: "Notes", icon: TypeIcon },
] as const;

export function DashboardPage({ onOpenMemory }: { onOpenMemory: (id: string) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardStats>("/dashboard-stats")
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Getting your dashboard ready..." />;
  if (!stats) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl text-booth-ink dark:text-booth-paper sm:text-3xl">Welcome back.</h1>
        <p className="mt-1 text-booth-ink/60 dark:text-booth-paper/60">Let's keep the little moments safe.</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="All memories" value={stats.counts.total} icon={Sparkles} highlight />
        {STAT_ITEMS.map((item, i) => (
          <StatCard
            key={item.key}
            label={item.label}
            value={stats.counts[item.key]}
            icon={item.icon}
            delay={(i + 1) * 0.05}
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg text-booth-ink dark:text-booth-paper">Recently added</h2>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-booth-ink/50 dark:text-booth-paper/50">
              Nothing yet — add your first memory to see it here.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.recent.map((m) => (
                <MemoryCard key={m.id} memory={m} layout="grid" onOpen={() => onOpenMemory(m.id)} />
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-3 font-display text-lg text-booth-ink dark:text-booth-paper">Upcoming</h2>
          <UpcomingEvents items={stats.upcoming} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`rounded-2xl p-4 shadow-soft ${
        highlight
          ? "bg-booth-plum-600 text-white dark:bg-booth-gold-500 dark:text-booth-night"
          : "bg-white/60 text-booth-ink dark:bg-white/5 dark:text-booth-paper"
      }`}
    >
      <Icon size={18} className={highlight ? "opacity-90" : "text-booth-plum-500 dark:text-booth-paper/60"} />
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className={`text-xs ${highlight ? "opacity-80" : "text-booth-ink/50 dark:text-booth-paper/50"}`}>{label}</p>
    </motion.div>
  );
}
