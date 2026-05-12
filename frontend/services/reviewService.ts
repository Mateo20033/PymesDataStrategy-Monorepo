import type { Anomaly, ReviewAction } from "@/types";
import { mockAnomalies } from "@/data";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getAnomalies(datasetId: string): Promise<Anomaly[]> {
  await delay(500);
  return mockAnomalies.filter((a) => a.datasetId === datasetId);
}

export async function submitDecision(
  anomalyId: string,
  action: ReviewAction,
  correction?: string
): Promise<Anomaly> {
  await delay(300);

  const anomaly = mockAnomalies.find((a) => a.id === anomalyId);
  if (!anomaly) {
    throw new Error(`Anomaly with id ${anomalyId} not found`);
  }

  return {
    ...anomaly,
    action,
    userCorrection: correction,
  };
}

export async function submitAllDecisions(
  decisions: { anomalyId: string; action: ReviewAction; correction?: string }[]
): Promise<void> {
  await delay(800);

  for (const decision of decisions) {
    const anomaly = mockAnomalies.find((a) => a.id === decision.anomalyId);
    if (!anomaly) {
      throw new Error(`Anomaly with id ${decision.anomalyId} not found`);
    }
  }
}
