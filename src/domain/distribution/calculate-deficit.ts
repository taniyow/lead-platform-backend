/**
 * The exact deficit formula required by the assessment:
 *
 *   targetAfterLead = (totalSentToday + 1) * brokerPercentage / 100
 *   deficit = targetAfterLead - brokerSentToday
 */
export function calculateDeficit(
  totalSentToday: number,
  brokerPercentage: number,
  brokerSentToday: number,
): number {
  const targetAfterLead = ((totalSentToday + 1) * brokerPercentage) / 100;
  return targetAfterLead - brokerSentToday;
}
