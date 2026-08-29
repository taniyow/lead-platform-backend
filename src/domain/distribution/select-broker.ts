import { calculateDeficit } from './calculate-deficit';

export interface BrokerCandidate {
  brokerId: number;
  percentage: number;
  sentToday: number;
}

/**
 * Selects the eligible broker with the highest deficit. Ties break to the
 * broker with fewer sent leads today (per the assessment), then to the lowest
 * broker id for full determinism (documented assumption).
 */
export function selectBroker(
  candidates: BrokerCandidate[],
  totalSentToday: number,
): BrokerCandidate | null {
  let best: BrokerCandidate | null = null;
  let bestDeficit = -Infinity;

  for (const candidate of candidates) {
    const deficit = calculateDeficit(totalSentToday, candidate.percentage, candidate.sentToday);

    if (best === null || deficit > bestDeficit) {
      best = candidate;
      bestDeficit = deficit;
      continue;
    }

    if (deficit === bestDeficit) {
      const fewerSent = candidate.sentToday < best.sentToday;
      const sameSentLowerId =
        candidate.sentToday === best.sentToday && candidate.brokerId < best.brokerId;
      if (fewerSent || sameSentLowerId) {
        best = candidate;
      }
    }
  }

  return best;
}
