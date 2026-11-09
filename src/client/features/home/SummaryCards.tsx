import { DietSummaryCard } from './DietSummaryCard';
import { FitnessSummaryCard } from './FitnessSummaryCard';
import { GameSummaryCard } from './GameSummaryCard';
import { StudySummaryCard } from './StudySummaryCard';

export function SummaryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StudySummaryCard />
      <FitnessSummaryCard />
      <DietSummaryCard />
      <GameSummaryCard />
    </div>
  );
}
