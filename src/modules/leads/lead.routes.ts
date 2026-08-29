import { Router } from 'express';
import { showPublicForm, submitPublicLead } from './lead.controller';

export const publicRoutes = Router();

publicRoutes.get('/forms/:slug', showPublicForm);
publicRoutes.post('/forms/:slug/leads', submitPublicLead);
