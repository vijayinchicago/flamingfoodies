"use client";

import { useFormStatus } from "react-dom";

type AdminSubmitButtonProps = {
  idleLabel: string;
  pendingLabel?: string;
  className: string;
};

export function AdminSubmitButton({
  idleLabel,
  pendingLabel,
  className
}: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`${className} cursor-pointer disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? pendingLabel || "Working..." : idleLabel}
    </button>
  );
}
