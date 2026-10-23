import { Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { GirlImage } from '@/data/girlImages';

type ClipCardProps = {
  image: GirlImage;
  className?: string;
};

/**
 * One card on the live-video grid: the picture edge-to-edge inside a rounded
 * frame, a round play-type button on the top-right corner and an avatar with
 * the name on the bottom-left, so the grid reads as a wall of calls.
 *
 * The exported files are not plain photos. Each one is a smaller photo with a
 * light stroke and rounded corners drawn around it, floating on a transparent
 * canvas with a soft shadow, so the opaque picture only occupies the middle of
 * the image. The margins differ from file to file (canvas size, border width
 * and even the photo's own aspect ratio all vary), so no single measured crop
 * box fits them all — a fixed box either stretches a face or leaves the card's
 * dark background showing at an edge.
 *
 * Instead the picture fills the card with `size-full object-cover` — which
 * always covers the whole card while preserving each image's aspect ratio (no
 * stretching, no empty band) — and is then zoomed with `scale` so the enlarged
 * frame pushes the transparent stroke margin outside the card, where
 * `overflow-hidden` clips it. The zoom pivots high (`transform-origin` near the
 * top) so the extra crop comes off the bottom of the photo — the body — instead
 * of the top, which keeps the head fully in frame while still clearing the
 * margins on every edge.
 *
 * The name is the card's text, so the pictures themselves are decorative for
 * screen readers — the link is labelled by the name it shows.
 *
 * A picture is roughly a megabyte, so the card opens on a shimmering skeleton:
 * the placeholder sits under the photo and both cross-fade once the bytes are
 * in, instead of the card flashing from dark box to face.
 */
export function ClipCard({ image, className }: ClipCardProps) {
  const pictureRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // A picture already in the browser cache can finish before React attaches
  // `onLoad`, so ask the element itself on mount — otherwise this card would
  // keep shimmering over an image that is already there.
  useEffect(() => {
    if (pictureRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <div
      className={cn(
        'relative aspect-[3/4] w-full overflow-hidden rounded-2xl motion-safe:animate-fade-up',
        className,
      )}
    >
      {/* Shimmering placeholder; fades out as the photo fades in. */}
      <div
        aria-hidden="true"
        className={cn(
          'skeleton animate-shimmer absolute inset-0 transition-opacity duration-300',
          loaded ? 'opacity-0' : 'opacity-100',
        )}
      />

      {/* A megabyte per picture, so only load the ones being looked at.
          `object-cover` guarantees the card is fully covered; the zoom throws the
          photo's transparent stroke margin past the card edges (clipped away),
          and pivoting near the top keeps the head in frame. Held invisible until
          decoded (`onLoad`), and revealed on `onError` too so a broken file does
          not leave a card shimmering forever. */}
      <img
        ref={pictureRef}
        src={image.src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn(
          'size-full scale-[1.35] object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transformOrigin: '50% 35%' }}
      />

      {/* Soft darkening behind the name so it stays readable over any photo. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent"
      />

      <span className="pointer-events-none absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-2">
        {/* The same picture, zoomed onto the head; the frame maths above would
            leave the stroke ring showing inside a disc this small. */}
        <span aria-hidden="true" className="relative size-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/40">
          <img
            src={image.src}
            alt=""
            loading="lazy"
            className="size-full scale-[1.6] object-cover object-top"
          />
        </span>
        <span className="truncate text-sm font-medium text-white drop-shadow-sm">{image.name}</span>
      </span>

      {/* Static play-type button: a small green disc floating at the top-right
          corner, signalling that the card starts a video. */}
      <span className="pointer-events-none absolute right-2 top-2 flex size-7.5 items-center justify-center rounded-full bg-live text-white shadow-sm ring-1 ring-white/25">
        <Play aria-hidden="true" className="size-3.5 translate-x-px fill-current" />
      </span>
    </div>
  );
}
