import { Request, Response } from 'express';
import { brokerIdSchema, createBrokerSchema, updateBrokerSchema } from './broker.schema';
import { createBroker, getBrokerById, listBrokers, updateBroker } from './broker.service';

export async function index(_req: Request, res: Response) {
  const brokers = await listBrokers();
  res.json({ data: { brokers }, error: null });
}

export async function show(req: Request, res: Response) {
  const id = brokerIdSchema.parse(req.params.id);
  const broker = await getBrokerById(id);
  res.json({ data: { broker }, error: null });
}

export async function create(req: Request, res: Response) {
  const input = createBrokerSchema.parse(req.body);
  const broker = await createBroker(input);
  res.status(201).json({ data: { broker }, error: null });
}

export async function update(req: Request, res: Response) {
  const id = brokerIdSchema.parse(req.params.id);
  const input = updateBrokerSchema.parse(req.body);
  const broker = await updateBroker(id, input);
  res.json({ data: { broker }, error: null });
}
