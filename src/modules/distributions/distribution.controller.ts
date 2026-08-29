import { Request, Response } from 'express';
import { distributionIdSchema } from './distribution.schema';
import {
  createDistribution,
  getDistribution,
  getDistributionById,
  getDistributionLeads,
} from './distribution.service';

export async function show(_req: Request, res: Response) {
  const distribution = await getDistribution();
  res.json({ data: { distribution }, error: null });
}

export async function showById(req: Request, res: Response) {
  const id = distributionIdSchema.parse(req.params.id);
  const distribution = await getDistributionById(id);
  res.json({ data: { distribution }, error: null });
}

export async function create(_req: Request, res: Response) {
  const distribution = await createDistribution();
  res.status(201).json({ data: { distribution }, error: null });
}

export async function leads(req: Request, res: Response) {
  const id = distributionIdSchema.parse(req.params.id);
  const distributionLeads = await getDistributionLeads(id);
  res.json({ data: { leads: distributionLeads }, error: null });
}
