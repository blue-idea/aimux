import type { ReactNode } from 'react';

interface SettingSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{title}</h3>
      {children}
    </section>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[rgb(var(--ink-rgb)/0.08)] py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        checked ? 'bg-[var(--accent)]' : 'bg-[rgb(var(--ink-rgb)/0.2)]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-[rgb(var(--ink-rgb)/0.06)] p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-xs transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              active
                ? 'bg-[var(--accent)] font-semibold text-slate-950 shadow'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
