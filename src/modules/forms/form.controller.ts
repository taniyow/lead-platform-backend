import { Request, Response } from 'express';
import { createFormSchema } from './form.schema';
import { createForm, getForm } from './form.service';

export async function show(_req: Request, res: Response) {
  const form = await getForm();
  res.json({ data: { form }, error: null });
}

export async function create(req: Request, res: Response) {
  const input = createFormSchema.parse(req.body);
  const form = await createForm(input);
  res.status(201).json({ data: { form }, error: null });
}
