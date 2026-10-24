import { FolderOpen, Play } from 'lucide-react';
import { Link } from 'react-router';
import { AdBanner } from '@/components/ads/AdBanner';
import { FlowPanel } from '@/components/layout/FlowPanel';
import { Button } from '@/components/ui/button';
import { CrmNote } from '@/components/onboarding/CrmNote';
import { ProgressIndicator } from '@/components/onboarding/ProgressIndicator';
import { ClipCard } from '@/components/video/ClipCard';
import { girlImages, type GirlImage } from '@/data/girlImages';
import { useAdNavigation } from '@/hooks/useAdNavigation';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Cards shown before each in-grid banner: one banner after the first 4 faces.
 * Whatever is left forms a final ad-free tail, so the grid never ends on a
 * trailing banner.
 *
 * Why only one: Ad Manager's per-unit report showed the lower banners being
 * seen by only 15-32% of visitors, at an eCPM of $0.08-0.13 against $0.63 for
 * the top banner — they added ~30% of the impressions but ~7% of the revenue
 * and dragged the average eCPM down. Add `4` / `6` entries (e.g. `[4, 4, 6]`)
 * to bring them back.
 */
const BLOCK_SIZES = [4];

type ClipBlock = {
  /** The faces this block renders. */
  images: GirlImage[];
  /** Whether a banner closes this block. */
  withAd: boolean;
};

/** Split the pictures into the blocks the grid renders, per `BLOCK_SIZES`. */
function toBlocks(images: GirlImage[]): ClipBlock[] {
  const blocks: ClipBlock[] = [];
  let rest = images;
  for (const size of BLOCK_SIZES) {
    // Only cut a block when it is full and more faces still follow it, so a
    // banner never ends up sitting at the bottom of the grid.
    if (rest.length <= size) break;
    blocks.push({ images: rest.slice(0, size), withAd: true });
    rest = rest.slice(size);
  }
  if (rest.length > 0) blocks.push({ images: rest, withAd: false });
  return blocks;
}

export default function ClipsPage() {
  usePageTitle('Live Video');
  const { guardLink, navigateWithAd } = useAdNavigation();
  const blocks = toBlocks(girlImages);

  return (
    <FlowPanel>
      {/* Same stepper the onboarding screens show, starting on "Live Video". */}
      <div className="shrink-0 pb-4">
        <ProgressIndicator current={0} />
      </div>

      {/* Title + the one primary action come FIRST, so Start is on the first
          screen of every phone. The top banner sits right below it: it is
          still in view (viewable) but no longer pushes the button off-screen.
          The interstitial plays on tap, then the flow continues at the age
          step (see useAdNavigation / gpt.ts: requested on demand, once or twice
          per session at most). */}
      <div className="pt-2 text-center">
        <h1 className="text-center text-[20px] font-bold text-white">Random Video Call</h1>
        <Button
          variant="gradient"
          size="lg"
          className="mt-4 w-full rounded-full cursor-pointer"
          onClick={() => void navigateWithAd('interstitial', '/age')}
        >
          <Play aria-hidden="true" />
          START VIDEO CALL
        </Button>
      </div>

      <AdBanner className="mt-5" />

      <div className="flex flex-1 flex-col">
        {girlImages.length > 0 ? (
          <div className="flex flex-col gap-6">
            {blocks.map((block, blockIndex) => (
              <div key={block.images[0]?.file ?? blockIndex} className="flex flex-col gap-6">
                <ul className="grid grid-cols-2 gap-4">
                  {block.images.map((image) => (
                    <li key={image.file}>
                      <Link
                        to="/age"
                        onClick={guardLink('interstitial', '/age')}
                        className="block h-full rounded-2xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-violet-soft"
                      >
                        <ClipCard image={image} className="h-full" priority={blockIndex === 0} />
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* The banner that closes each block (after card 4 with the
                    current schedule). `lazy`: it is only requested once the
                    visitor is about to scroll to it, so it is not paid for
                    (and not counted) when nobody gets that far. */}
                {block.withAd ? (
                  <AdBanner instance={`inline-${blockIndex + 1}`} className="mt-0" lazy />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="surface flex flex-col items-start gap-4 p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-violet/15 text-violet-soft">
              <FolderOpen aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">No pictures are available yet</h2>
              <p className="mt-2 max-w-prose text-fg-muted">
                This grid shows every picture in{' '}
                <code className="rounded bg-white/8 px-1.5 py-0.5 text-fg">public/Video_Girl_image/</code>. Put a
                png, jpg, webp, gif or avif picture in that folder and reload this page.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Same CRM note the onboarding screens show under the Continue button. */}
      <div className="pt-6 text-center text-[12.5px] leading-relaxed text-fg-muted">
        <CrmNote
          featuresTitle="How a CRM keeps every conversation"
          features={[
            {
              emoji: '💬',
              title: 'Unified inbox',
              text: 'Chat, email and call history land in one shared thread instead of separate apps.',
            },
            {
              emoji: '🕒',
              title: 'Response tracking',
              text: 'Every message is timestamped, so slow replies show up in the report, not in guesses.',
            },
            {
              emoji: '🔁',
              title: 'Purchase history',
              text: 'Past orders reveal when a customer is due to buy again and what they prefer.',
            },
            {
              emoji: '🎁',
              title: 'Targeted offers',
              text: 'Campaigns reach only the segment most likely to respond, never the whole list.',
            },
          ]}
          funFact="Winning a new customer costs five to seven times more than keeping an existing one — and retention is exactly what a CRM is built for."
          stepsTitle="How the follow-up works?"
          steps={[
            'The conversation is logged on the customer profile.',
            'The next best action is suggested from their history.',
            'Reminders and replies go out on their own schedule.',
            'Satisfaction is measured and the relationship deepens.',
          ]}
        />
      </div>
    </FlowPanel>
  );
}
