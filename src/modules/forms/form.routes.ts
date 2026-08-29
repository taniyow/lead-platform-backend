import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { create, show } from './form.controller';

export const formRoutes = Router();

formRoutes.use(requireAuth);
formRoutes.get('/', show);
formRoutes.post('/', create);
