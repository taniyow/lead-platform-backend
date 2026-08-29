import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { create, leads, show, showById } from './distribution.controller';

export const distributionRoutes = Router();

distributionRoutes.use(requireAuth);
distributionRoutes.get('/', show);
distributionRoutes.post('/', create);
distributionRoutes.get('/:id', showById);
distributionRoutes.get('/:id/leads', leads);
