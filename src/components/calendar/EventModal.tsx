import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Feedback";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { CalendarEvent, EventCategory } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: "birthday", label: "Birthday", color: "#C05F76" },
  { value: "anniversary", label: "Anniversary", color: "#B8903F" },
  { value: "first_meeting", label: "First meeting", color: "#8C4A63" },
  { value: "special_day", label: "Special day", color: "#D3AE63" },
  { value: "trip", label: "Trip", color: "#6E3349" },
  { value: "celebration", label: "Celebration", color: "#E7B4BE" },
  { value: "reminder", label: "Reminder", color: "#582939" },
  { value: "custom", label: "Custom", color: "#B5758F" },
];

export function EventModal({
  open,
  onClose,
  defaultDate,
  existing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  existing?: CalendarEvent | null;
  onSaved: () => void;
}) {
  const { show } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<EventCategory>("special_day");
  const [recurrence, setRecurrence] = useState("");
  const [reminder, setReminder] = useState("none");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? "");
      setDate(existing.start_datetime.slice(0, 10));
      setCategory(existing.category);
      setRecurrence(existing.recurrence_rule ?? "");
      setReminder(existing.reminder ?? "none");
    } else {
      setTitle("");
      setDescription("");
      setDate(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
      setCategory("special_day");
      setRecurrence("");
      setReminder("none");
    }
  }, [existing, defaultDate, open]);

  const categoryMeta = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];

  async function handleSave() {
    if (!title.trim() || !date) {
      show("An event needs a title and a date.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description: description || undefined,
        startDatetime: new Date(date).toISOString(),
        allDay: true,
        category,
        color: categoryMeta.color,
        recurrenceRule: recurrence || null,
        reminder,
      };
      if (existing) {
        await api.patch(`/calendar-update?id=${existing.id}`, payload);
        show("Important date saved.", "success");
      } else {
        await api.post("/calendar-create", payload);
        show("Important date saved.", "success");
      }
      onSaved();
      onClose();
    } catch {
      show("Couldn't save that date.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setDeleting(true);
    try {
      await api.delete(`/calendar-delete?id=${existing.id}`);
      show("Event deleted.", "success");
      onSaved();
      onClose();
    } catch {
      show("Couldn't delete that event.", "error");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={existing ? "Edit important date" : "Save an important date"} size="md">
        <div className="flex flex-col gap-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Our anniversary" />
          <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Repeats" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              <option value="">Doesn't repeat</option>
              <option value="FREQ=YEARLY">Every year</option>
              <option value="FREQ=MONTHLY">Every month</option>
            </Select>
            <Select label="Reminder" value={reminder} onChange={(e) => setReminder(e.target.value)}>
              <option value="none">No reminder</option>
              <option value="1_day_before">1 day before</option>
              <option value="1_week_before">1 week before</option>
            </Select>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            {existing ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-rose-500 hover:text-rose-600"
              >
                <Trash2 size={15} /> Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this date?"
        description="This will permanently remove this important date from your calendar."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
