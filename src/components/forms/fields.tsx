"use client";

import { useId, useState, type ReactNode } from "react";
import { Eye, EyeOff, Star } from "lucide-react";
import { useFormState } from "./action-form";

const control =
  "block w-full rounded-md border bg-white px-3 text-base text-ink-900 shadow-xs placeholder:text-ink-500 transition-colors focus:border-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-200 disabled:bg-ink-100 sm:text-sm";
const okBorder = "border-ink-300 hover:border-ink-400";
const errBorder = "border-danger-600";

interface BaseProps {
  name: string;
  label: string;
  hint?: ReactNode;
  required?: boolean;
  optionalLabel?: boolean;
  className?: string;
}

function useField(name: string, defaultValue?: string | number | null) {
  const state = useFormState();
  const errors = state.fieldErrors?.[name];
  const echoed = state.values?.[name];
  const value = echoed ?? (defaultValue == null ? "" : String(defaultValue));
  return { errors, value, id: `field-${name}` };
}

function Shell({
  id,
  label,
  hint,
  required,
  optionalLabel,
  errors,
  className = "",
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  required?: boolean;
  optionalLabel?: boolean;
  errors?: string[];
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-ink-800">
        {label}
        {required && (
          <span className="text-danger-700" aria-hidden>
            *
          </span>
        )}
        {optionalLabel && <span className="text-xs font-normal text-ink-500">(optional)</span>}
      </label>
      {children}
      {hint && !errors?.length && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-600">
          {hint}
        </p>
      )}
      {errors?.length ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger-700">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, hint: unknown, errors?: string[]) =>
  [errors?.length ? `${id}-error` : null, hint && !errors?.length ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;

export function TextField({
  name,
  label,
  hint,
  required,
  optionalLabel,
  className,
  defaultValue,
  type = "text",
  autoComplete,
  placeholder,
  inputMode,
  maxLength,
  min,
  max,
  id: idOverride,
}: BaseProps & {
  /** Needed when the same field name appears more than once on a page. */
  id?: string;
  defaultValue?: string | number | null;
  type?: "text" | "email" | "tel" | "url" | "number" | "date" | "month" | "search";
  autoComplete?: string;
  placeholder?: string;
  inputMode?: "text" | "email" | "tel" | "url" | "numeric" | "decimal" | "search";
  maxLength?: number;
  min?: string | number;
  max?: string | number;
}) {
  const field = useField(name, defaultValue);
  const { errors, value } = field;
  const id = idOverride ?? field.id;
  return (
    <Shell id={id} label={label} hint={hint} required={required} optionalLabel={optionalLabel} errors={errors} className={className}>
      <input
        key={value}
        id={id}
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        max={max}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)}
        className={`${control} min-h-11 ${errors?.length ? errBorder : okBorder}`}
      />
    </Shell>
  );
}

export function PasswordField({
  name,
  label,
  hint,
  autoComplete = "current-password",
  className,
}: BaseProps & { autoComplete?: "current-password" | "new-password" }) {
  const { errors, id } = useField(name);
  const [visible, setVisible] = useState(false);
  return (
    <Shell id={id} label={label} hint={hint} required errors={errors} className={className}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={describedBy(id, hint, errors)}
          className={`${control} min-h-11 pr-12 ${errors?.length ? errBorder : okBorder}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-ink-600 hover:text-ink-900"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </button>
      </div>
    </Shell>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  required,
  optionalLabel,
  className,
  defaultValue,
  rows = 4,
  maxLength,
  placeholder,
}: BaseProps & { defaultValue?: string | null; rows?: number; maxLength?: number; placeholder?: string }) {
  const { errors, value, id } = useField(name, defaultValue);
  return (
    <Shell id={id} label={label} hint={hint} required={required} optionalLabel={optionalLabel} errors={errors} className={className}>
      <textarea
        key={value}
        id={id}
        name={name}
        rows={rows}
        defaultValue={value}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)}
        className={`${control} py-2.5 leading-relaxed ${errors?.length ? errBorder : okBorder}`}
      />
    </Shell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  required,
  optionalLabel,
  className,
  defaultValue,
  options,
  placeholder = "Select…",
}: BaseProps & { defaultValue?: string | null; options: readonly (string | { value: string; label: string })[]; placeholder?: string }) {
  const { errors, value, id } = useField(name, defaultValue);
  return (
    <Shell id={id} label={label} hint={hint} required={required} optionalLabel={optionalLabel} errors={errors} className={className}>
      <select
        key={value}
        id={id}
        name={name}
        defaultValue={value}
        required={required}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)}
        className={`${control} min-h-11 pr-8 ${errors?.length ? errBorder : okBorder}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </Shell>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
  className = "",
  required,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  defaultChecked?: boolean;
  className?: string;
  required?: boolean;
}) {
  const state = useFormState();
  const errors = state.fieldErrors?.[name];
  const id = `field-${name}`;
  const echoed = state.values ? state.values[name] === "on" : undefined;
  const checked = echoed ?? Boolean(defaultChecked);
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          key={String(checked)}
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={checked}
          required={required}
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={errors?.length ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="mt-0.5 size-5 shrink-0 rounded border-ink-400 accent-brand-700"
        />
        <label htmlFor={id} className="text-sm text-ink-800">
          {label}
          {hint && (
            <span id={`${id}-hint`} className="mt-0.5 block text-xs text-ink-600">
              {hint}
            </span>
          )}
        </label>
      </div>
      {errors?.length ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger-700">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

export function FileField({
  name,
  label,
  hint,
  required,
  optionalLabel,
  className,
  accept = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}: BaseProps & { accept?: string }) {
  const state = useFormState();
  const errors = state.fieldErrors?.[name];
  const id = `field-${name}`;
  const autoId = useId();
  return (
    <Shell id={id} label={label} hint={hint} required={required} optionalLabel={optionalLabel} errors={errors} className={className}>
      <input
        key={`${autoId}-${state.at ?? 0}`}
        id={id}
        name={name}
        type="file"
        required={required}
        accept={accept}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)}
        className={`block w-full rounded-md border bg-white text-sm text-ink-700 file:mr-3 file:min-h-11 file:cursor-pointer file:border-0 file:border-r file:border-ink-300 file:bg-ink-100 file:px-4 file:text-sm file:font-semibold file:text-ink-900 hover:file:bg-ink-200 ${errors?.length ? errBorder : okBorder}`}
      />
    </Shell>
  );
}

/**
 * 1–5 star rating built on a native radio group, so keyboard (arrow keys)
 * and screen readers work as for any radio buttons.
 */
export function RatingField({ name, label, required, className = "" }: Omit<BaseProps, "hint" | "optionalLabel">) {
  const { errors, value, id } = useField(name);
  const [rating, setRating] = useState(Number(value) || 0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  const words = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
  return (
    <fieldset className={className} aria-invalid={errors?.length ? true : undefined} aria-describedby={errors?.length ? `${id}-error` : undefined}>
      <legend className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-ink-800">
        {label}
        {required && (
          <span className="text-danger-700" aria-hidden>
            *
          </span>
        )}
      </legend>
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-1 has-[:focus-visible]:rounded-md has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand-200" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name={name}
                value={n}
                required={required}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="sr-only"
                {...(n === 1 ? { id } : {})}
              />
              <Star aria-hidden className={`size-8 transition-colors ${n <= shown ? "fill-brand-400 text-brand-600" : "fill-transparent text-ink-300"}`} />
              <span className="sr-only">
                {n} star{n === 1 ? "" : "s"} – {words[n]}
              </span>
            </label>
          ))}
        </div>
        <span className="text-sm font-medium text-ink-700" aria-hidden>
          {shown ? words[shown] : "Tap a star"}
        </span>
      </div>
      {errors?.length ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger-700">
          {errors[0]}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Visually hidden honeypot. Real users never see or fill it. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label htmlFor="field-website">Leave this field empty</label>
      <input id="field-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
