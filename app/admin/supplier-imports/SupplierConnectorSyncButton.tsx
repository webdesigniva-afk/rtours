"use client";

import { useFormStatus } from "react-dom";
import { Loader2, RefreshCw } from "lucide-react";

type SupplierConnectorSyncButtonProps = {
  disabled?: boolean;
};

export function SupplierConnectorSyncButton({ disabled = false }: SupplierConnectorSyncButtonProps) {
  const { pending } = useFormStatus();
  const Icon = pending ? Loader2 : RefreshCw;

  return (
    <button type="submit" disabled={disabled || pending} aria-busy={pending}>
      <Icon className={pending ? "is-spinning" : undefined} size={16} aria-hidden="true" />
      {pending ? "Синхронизира се..." : "Синхронизирай"}
    </button>
  );
}
