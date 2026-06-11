"use client";

import { forwardRef } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children" | "size"> & {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  size?: "sm" | "md";
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    {
      label,
      options,
      placeholder,
      invalid,
      size = "md",
      className = "",
      id,
      ...rest
    },
    ref,
  ) {
    const height = size === "sm" ? "h-9" : "h-10";
    const state = invalid
      ? "border-destructive/60 focus:ring-destructive/40"
      : "border-input focus:ring-ring";
    const select = (
      <select
        ref={ref}
        id={id}
        className={`${height} w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:ring-2 ${state} ${className}`}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );

    if (!label) return select;

    return (
      <label className="space-y-1.5 text-sm font-semibold" htmlFor={id}>
        <span>{label}</span>
        {select}
      </label>
    );
  },
);
