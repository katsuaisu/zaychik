import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { uploadCardImage } from "@/lib/card-image";
import { CardImage } from "@/components/CardImage";
import type { Mask } from "@/lib/card-data";

/**
 * Upload a picture and drag on it to cover the parts that become the answer.
 */
export function PictureCardEditor({
  image,
  masks,
  onImageChange,
  onMasksChange,
}: {
  image: string | null;
  masks: Mask[];
  onImageChange: (path: string | null) => void;
  onMasksChange: (masks: Mask[]) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Mask | null>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function point(e: React.PointerEvent) {
    const rect = boxRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }

  function rect(a: { x: number; y: number }, b: { x: number; y: number }): Mask {
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      w: Math.abs(a.x - b.x),
      h: Math.abs(a.y - b.y),
    };
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const path = await uploadCardImage(file);
      onImageChange(path);
      onMasksChange([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload that picture.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60">
        <ImagePlus className="h-4 w-4" />
        {uploading ? "Uploading…" : image ? "Replace picture" : "Upload picture"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
      </label>

      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

      {image && (
        <>
          <p className="text-sm text-muted-foreground">
            Drag on the picture to cover a part — each covered area is what you have to recall.
          </p>
          <div
            ref={boxRef}
            onPointerDown={(e) => {
              e.preventDefault();
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              const p = point(e);
              setStart(p);
              setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
            }}
            onPointerMove={(e) => {
              if (!start) return;
              setDraft(rect(start, point(e)));
            }}
            onPointerUp={(e) => {
              if (start && draft) {
                const final = rect(start, point(e));
                if (final.w > 0.02 && final.h > 0.02) onMasksChange([...masks, final]);
              }
              setStart(null);
              setDraft(null);
            }}
            className="relative w-full touch-none select-none overflow-hidden rounded-2xl border border-border"
          >
            <CardImage path={image} alt="Card picture" className="block w-full" />
            {[...masks, ...(draft ? [draft] : [])].map((m, i) => (
              <div
                key={i}
                className="absolute rounded-md border-2 border-brand bg-brand/70"
                style={{
                  left: `${m.x * 100}%`,
                  top: `${m.y * 100}%`,
                  width: `${m.w * 100}%`,
                  height: `${m.h * 100}%`,
                }}
              />
            ))}
          </div>

          {masks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {masks.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onMasksChange(masks.filter((_, j) => j !== i))}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold press hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Area {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onMasksChange([])}
                className="min-h-9 rounded-full px-3 text-xs font-bold text-muted-foreground press hover:bg-muted"
              >
                Clear all
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
