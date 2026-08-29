import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { create, index, show, update } from './broker.controller';

export const brokerRoutes = Router();

brokerRoutes.use(requireAuth);
brokerRoutes.get('/', index);
brokerRoutes.post('/', create);
brokerRoutes.get('/:id', show);
brokerRoutes.patch('/:id', update);
