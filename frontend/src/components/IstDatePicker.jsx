import { CalendarDays } from "lucide-react";
import { toApiDate } from "../utils/istDates";

export default function IstDatePicker({ value, onChange, label, min, max }) {
  return (
    <span className="relative inline-flex h-10 w-32 items-center justify-between gap-2 rounded-xl border border-[#ded7c9] bg-white px-3 text-sm text-stone-700 focus-within:ring-2 focus-within:ring-[#aa8241]">
      <span aria-hidden="true">{value || "dd/mm/yy"}</span>
      <CalendarDays
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-stone-500"
      />
      <input
        type="date"
        aria-label={label}
        value={toApiDate(value)}
        min={toApiDate(min || "") || "2000-01-01"}
        max={toApiDate(max || "") || "2099-12-31"}
        onClick={(event) => {
          // Open the calendar from anywhere on the field, with native fallback.
          try {
            event.currentTarget.showPicker?.();
          } catch {
            /* Native input remains usable. */
          }
        }}
        onChange={(event) => {
          const selected = event.target.value;
          if (!selected) {
            onChange("");
            return;
          }
          const [year, month, day] = selected.split("-");
          if (Number(year) < 2000 || Number(year) > 2099) return;
          onChange(`${day}/${month}/${year.slice(-2)}`);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  );
}
