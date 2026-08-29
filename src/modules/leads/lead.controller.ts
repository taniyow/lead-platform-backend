import { Request, Response } from 'express';
import { getClientIp } from '../../lib/client-ip';
import { logger } from '../../lib/logger';
import { formSlugSchema, leadIdSchema, manualAssignSchema, publicLeadSchema } from './lead.schema';
import {
  getPublicFormBySlug,
  listLeads,
  manuallyAssignLead,
  processPublicLead,
} from './lead.service';

export async function showPublicForm(req: Request, res: Response) {
  const slug = formSlugSchema.parse(req.params.slug);
  const form = await getPublicFormBySlug(slug);
  res.json({ data: { form }, error: null });
}

export async function submitPublicLead(req: Request, res: Response) {
  const slug = formSlugSchema.parse(req.params.slug);
  const input = publicLeadSchema.parse(req.body);
  const ipAddress = getClientIp(req);

  const result = await processPublicLead(slug, input, ipAddress);
  logger.info(`Lead ${result.leadId} processed with status ${result.status}`);

  // The public response stays neutral: visitors are not told whether their
  // submission was assigned, unsent, or a duplicate.
  res.status(201).json({ data: { success: true }, error: null });
}

export async function index(_req: Request, res: Response) {
  const leads = await listLeads();
  res.json({ data: { leads }, error: null });
}

export async function manualAssign(req: Request, res: Response) {
  const id = leadIdSchema.parse(req.params.id);
  const input = manualAssignSchema.parse(req.body);
  const lead = await manuallyAssignLead(id, input.brokerId);
  res.json({ data: { lead }, error: null });
}
