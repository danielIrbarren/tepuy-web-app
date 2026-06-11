"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, RotateCw, Loader2, AlertTriangle } from "lucide-react";
import { compressImage } from "@/lib/images/compress";
import { MAX_FILES } from "@/lib/images/upload-validation";

/**
 * Selector de fotos para la solicitud (hasta MAX_FILES).
 *
 * Subida progresiva: cada foto se comprime y sube apenas se elige, de forma
 * independiente (reintento por foto). Reporta al formulario padre las URLs ya
 * listas y si hay alguna subida en curso, para que el envío final solo mande
 * URLs y nunca se bloquee por una subida lenta.
 */

type Status = "uploading" | "done" | "error";

interface Item {
  id: string;
  previewUrl: string;
  status: Status;
  url?: string;
  file: File;
}

interface ImageAttachmentsProps {
  disabled?: boolean;
  onUrlsChange: (urls: string[]) => void;
  onUploadingChange: (uploading: boolean) => void;
}

export function ImageAttachments({
  disabled,
  onUrlsChange,
  onUploadingChange,
}: ImageAttachmentsProps) {
  const [items, setItems] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reportar al padre las URLs listas y si hay subidas en curso.
  useEffect(() => {
    onUrlsChange(items.filter((i) => i.status === "done" && i.url).map((i) => i.url as string));
    onUploadingChange(items.some((i) => i.status === "uploading"));
  }, [items, onUrlsChange, onUploadingChange]);

  const patch = useCallback((id: string, next: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));
  }, []);

  const uploadOne = useCallback(
    async (id: string, file: File) => {
      try {
        const blob = await compressImage(file);
        const form = new FormData();
        form.append("files", blob, "foto.jpg");
        const res = await fetch("/api/solicitudes/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error("upload failed");
        const data: { urls: string[] } = await res.json();
        const url = data.urls?.[0];
        if (!url) throw new Error("no url");
        patch(id, { status: "done", url });
      } catch {
        patch(id, { status: "error" });
      }
    },
    [patch]
  );

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const remaining = MAX_FILES - items.length;
      const files = Array.from(fileList).slice(0, Math.max(0, remaining));
      const newItems: Item[] = files.map((file) => ({
        id: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
        file,
      }));
      setItems((prev) => [...prev, ...newItems]);
      newItems.forEach((it) => uploadOne(it.id, it.file));
    },
    [items.length, uploadOne]
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const retry = useCallback(
    (id: string) => {
      const target = items.find((i) => i.id === id);
      if (!target) return;
      patch(id, { status: "uploading" });
      uploadOne(id, target.file);
    },
    [items, patch, uploadOne]
  );

  const atLimit = items.length >= MAX_FILES;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-tepuy-500 uppercase tracking-[0.08em] flex items-center gap-1.5">
          <Camera size={12} strokeWidth={2.5} />
          Fotos (opcional)
        </label>
        <span className="text-[10px] font-bold text-tepuy-400 tabular-nums">
          {items.length}/{MAX_FILES}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative h-20 w-20 rounded-xl overflow-hidden border border-tepuy-200 bg-tepuy-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />

            {item.status === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}

            {item.status === "error" && (
              <button
                type="button"
                onClick={() => retry(item.id)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-red-500/70 text-white"
              >
                <AlertTriangle size={16} strokeWidth={2} />
                <RotateCw size={14} strokeWidth={2.5} />
              </button>
            )}

            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={disabled}
              aria-label="Quitar foto"
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="h-20 w-20 rounded-xl border border-dashed border-tepuy-300 bg-white flex flex-col items-center justify-center gap-1 text-tepuy-400 hover:border-tepuy-500 hover:text-tepuy-500 transition-colors disabled:opacity-50"
          >
            <Camera size={20} strokeWidth={1.6} />
            <span className="text-[10px] font-semibold">Agregar</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = ""; // permite volver a elegir la misma foto
        }}
      />
    </div>
  );
}
