import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider, useToast } from "@/context/ToastContext";
import { onUnauthorized } from "@/lib/api";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { MemoriesPage } from "@/pages/MemoriesPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { AddMemoryModal } from "@/components/memories/AddMemoryModal";
import { MemoryDetailModal } from "@/components/memories/MemoryDetailModal";
import { SearchModal } from "@/components/memories/SearchModal";
import { LoadingState } from "@/components/ui/Feedback";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Opening the Memory Booth..." />
      </div>
    );
  }
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SessionWatcher() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { logout } = useAuth();

  useEffect(() => {
    const unsubscribe = onUnauthorized(async () => {
      await logout();
      show("Your session has expired. Please sign in again.", "info");
      navigate("/login");
    });
    return () => {
      unsubscribe();
    };
  }, [logout, navigate, show]);

  return null;
}

function AppShell() {
  const [addOpen, setAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMemoryId, setOpenMemoryId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="min-h-screen bg-booth-ivory dark:bg-booth-night">
      <Header onSearch={() => setSearchOpen(true)} onAddMemory={() => setAddOpen(true)} />

      <AnimatePresence mode="wait">
        <motion.main
          key={window.location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Routes>
            <Route path="/" element={<DashboardPage key={refreshKey} onOpenMemory={setOpenMemoryId} />} />
            <Route
              path="/memories"
              element={
                <MemoriesPage key={refreshKey} onOpenMemory={setOpenMemoryId} onAddMemory={() => setAddOpen(true)} />
              }
            />
            <Route
              path="/favorites"
              element={
                <MemoriesPage
                  key={`fav-${refreshKey}`}
                  favoritesOnly
                  onOpenMemory={setOpenMemoryId}
                  onAddMemory={() => setAddOpen(true)}
                />
              }
            />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.main>
      </AnimatePresence>

      <MobileNav onAddMemory={() => setAddOpen(true)} />

      <AddMemoryModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={bumpRefresh} />
      <MemoryDetailModal memoryId={openMemoryId} onClose={() => setOpenMemoryId(null)} onChanged={bumpRefresh} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onOpenMemory={setOpenMemoryId} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <SessionWatcher />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
