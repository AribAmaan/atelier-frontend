"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Date-of-birth picker built from three <select>s instead of <input type="date">.
 *
 * The native date input is unreliable on phones: the picker opens at today's
 * year (so reaching a birth year means scrolling back decades), iOS Safari can
 * render it collapsed or mis-sized when empty, and styling is inconsistent
 * across browsers. Selects behave the same everywhere and open native wheels.
 *
 * `value` / `onChange` use "YYYY-MM-DD", the format the backend requires. The
 * value is "" until Day, Month and Year are all chosen and form a real date
 * (Feb 30 can't be selected). Everything uses local time, never UTC.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate(); // month is 1-12

function parse(value: string): { y: string; m: string; d: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? { y: match[1], m: String(Number(match[2])), d: String(Number(match[3])) } : { y: "", m: "", d: "" };
}

/** Whole years between a YYYY-MM-DD birthdate and today (local). */
function ageFrom(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age;
}

export default function BirthdateField({
  value,
  onChange,
  selectClassName = "",
}: {
  value: string;
  onChange: (value: string) => void;
  selectClassName?: string;
}) {
  const initial = useMemo(() => parse(value), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [y, setY] = useState(initial.y);
  const [m, setM] = useState(initial.m);
  const [d, setD] = useState(initial.d);

  // Sync from the parent only when it changes the value to something this
  // component didn't emit itself (e.g. a form reset). Partial selections emit
  // "" and must not be wiped by that echo.
  const lastEmitted = useRef(value);
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    const p = parse(value);
    setY(p.y);
    setM(p.m);
    setD(p.d);
  }, [value]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 101 }, (_, i) => currentYear - i), [currentYear]);

  const maxDay = y && m ? daysInMonth(Number(y), Number(m)) : 31;
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function emit(nextY: string, nextM: string, nextD: string) {
    // Keep the day valid when month/year change (e.g. 31 Jan -> Feb).
    let day = nextD;
    if (nextY && nextM && day) {
      const limit = daysInMonth(Number(nextY), Number(nextM));
      if (Number(day) > limit) day = String(limit);
    }
    setY(nextY);
    setM(nextM);
    setD(day);
    const next = nextY && nextM && day ? `${nextY}-${pad(Number(nextM))}-${pad(Number(day))}` : "";
    lastEmitted.current = next;
    onChange(next);
  }

  const underage = value !== "" && ageFrom(value) < 18;

  const base =
    "rounded-xl bg-plum-deep/80 border border-white/10 px-3 py-2.5 focus-ring text-base [color-scheme:dark] min-w-0 " +
    selectClassName;

  return (
    <div>
      <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2" role="group" aria-label="Date of birth">
        <select
          aria-label="Day"
          required
          value={d}
          onChange={(e) => emit(y, m, e.target.value)}
          className={base}
        >
          <option value="">Day</option>
          {days.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          aria-label="Month"
          required
          value={m}
          onChange={(e) => emit(y, e.target.value, d)}
          className={base}
        >
          <option value="">Month</option>
          {MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Year"
          required
          value={y}
          onChange={(e) => emit(e.target.value, m, d)}
          className={base}
        >
          <option value="">Year</option>
          {years.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      {underage && (
        <p className="mt-2 text-sm text-rose" role="alert">
          You must be 18 or older to use Rolichat.
        </p>
      )}
    </div>
  );
}
