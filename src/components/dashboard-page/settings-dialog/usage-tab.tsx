import type { UsageSummary } from "@/lib/usage";
import { MeterRow } from "./meter";
import { CenteredLoader, LoadFailedNotice } from "./placeholders";

/** Rate-limit meters: chat messages, sources, podcast episodes, quiz decks. */
const UsageTab = ({
  usage,
  loadFailed,
}: {
  usage: UsageSummary | null;
  loadFailed: boolean;
}) => {
  if (loadFailed) return <LoadFailedNotice />;
  if (!usage) return <CenteredLoader />;

  return (
    <>
      <MeterRow label="Chat messages today" meter={usage.chatMessages} />
      <MeterRow label="Sources this month" meter={usage.sources} />
      <MeterRow label="Podcast episodes this month" meter={usage.podcasts} />
      <MeterRow label="Quiz decks this month" meter={usage.quizDecks} />
    </>
  );
};

export default UsageTab;
