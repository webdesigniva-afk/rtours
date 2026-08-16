"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { processConfiguredSupplierBatch } from "@/app/admin/supplier-imports/actions";

type BatchState = {
  status: "idle" | "running" | "success" | "error";
  runId: string | null;
  offset: number;
  totalFound: number | null;
  totalProcessed: number;
  new: number;
  changed: number;
  unchanged: number;
  unavailable: number;
  error: number;
  message: string;
};

type SupplierBatchSyncPanelProps = {
  connectorId: string;
  disabled?: boolean;
};

const initialState: BatchState = {
  status: "idle",
  runId: null,
  offset: 0,
  totalFound: null,
  totalProcessed: 0,
  new: 0,
  changed: 0,
  unchanged: 0,
  unavailable: 0,
  error: 0,
  message: ""
};

export function SupplierBatchSyncPanel({ connectorId, disabled = false }: SupplierBatchSyncPanelProps) {
  const [state, setState] = useState<BatchState>(initialState);
  const [isPending, startTransition] = useTransition();
  const isRunning = state.status === "running" || isPending;
  const percent = useMemo(() => {
    if (!state.totalFound || state.totalFound <= 0) return 0;
    return Math.min(Math.round((state.totalProcessed / state.totalFound) * 100), 100);
  }, [state.totalFound, state.totalProcessed]);

  function runBatch(nextState: BatchState) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("connector_id", connectorId);
      formData.set("offset", String(nextState.offset));
      formData.set("limit", "25");
      if (nextState.runId) formData.set("run_id", nextState.runId);

      const result = await processConfiguredSupplierBatch(formData);

      if (!result.ok) {
        setState({
          ...nextState,
          status: "error",
          message: result.message
        });
        return;
      }

      const updatedState: BatchState = {
        status: result.done ? "success" : "running",
        runId: result.runId || nextState.runId,
        offset: result.nextOffset ?? nextState.offset,
        totalFound: result.totalFound ?? nextState.totalFound,
        totalProcessed: result.totalProcessed ?? nextState.totalProcessed,
        new: result.new ?? nextState.new,
        changed: result.changed ?? nextState.changed,
        unchanged: result.unchanged ?? nextState.unchanged,
        unavailable: result.unavailable ?? nextState.unavailable,
        error: result.error ?? nextState.error,
        message: result.message
      };

      setState(updatedState);

      if (!result.done) {
        window.setTimeout(() => runBatch(updatedState), 350);
      }
    });
  }

  function startSync() {
    const freshState = { ...initialState, status: "running" as const, message: "Стартира синхронизация..." };
    setState(freshState);
    runBatch(freshState);
  }

  return (
    <div className="supplier-batch-sync">
      <button type="button" disabled={disabled || isRunning} aria-busy={isRunning} onClick={startSync}>
        {isRunning ? <Loader2 className="is-spinning" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
        {isRunning ? "Синхронизира се..." : "Синхронизирай"}
      </button>

      {state.status !== "idle" ? (
        <div className={`supplier-batch-progress is-${state.status}`} role="status" aria-live="polite">
          <div>
            {state.status === "success" ? <CheckCircle2 size={16} aria-hidden="true" /> : state.status === "error" ? <XCircle size={16} aria-hidden="true" /> : <Loader2 className="is-spinning" size={16} aria-hidden="true" />}
            <strong>{state.totalProcessed} / {state.totalFound ?? "?"}</strong>
            <span>{percent}%</span>
          </div>
          <i><b style={{ width: `${percent}%` }} /></i>
          <p>{state.message}</p>
          <small>Нови {state.new} · променени {state.changed} · без промяна {state.unchanged} · липсващи {state.unavailable} · грешки {state.error}</small>
        </div>
      ) : null}
    </div>
  );
}
