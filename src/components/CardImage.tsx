import { useCardImageUrl } from "@/lib/card-image";

/** Renders a picture stored in the card-images bucket. */
export function CardImage({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const { data: url, isLoading } = useCardImageUrl(path);

  if (!path) return null;
  if (isLoading || !url) {
    return (
      <div className={`grid min-h-40 w-full place-items-center rounded-2xl bg-muted ${className ?? ""}`}>
        <span className="text-sm text-muted-foreground">Loading picture…</span>
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} draggable={false} />;
}
