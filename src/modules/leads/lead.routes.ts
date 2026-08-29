import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { index, manualAssign, showPublicForm, submitPublicLead } from './lead.controller';

export const publicRoutes = Router();

publicRoutes.get('/forms/:slug', showPublicForm);
publicRoutes.post('/forms/:slug/leads', submitPublicLead);

export const leadRoutes = Router();

leadRoutes.use(requireAuth);
leadRoutes.get('/', index);
leadRoutes.post('/:id/manual-assign', manualAssign);
