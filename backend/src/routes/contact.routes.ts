import { Router, RequestHandler } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all contact routes
router.use(authenticate as RequestHandler);

// Contact routes
router.get('/', ContactController.listContacts as RequestHandler);
router.post('/', ContactController.createContact as RequestHandler);
router.get('/:id', ContactController.getContact as RequestHandler);
router.put('/:id', ContactController.updateContact as RequestHandler);
router.delete('/:id', ContactController.deleteContact as RequestHandler);

// Search route
router.get('/search', ContactController.searchContacts as RequestHandler);

// Sync routes
router.get('/sync/status', ContactController.getSyncStatus as RequestHandler);
router.post('/sync', ContactController.syncContacts as RequestHandler);
router.post('/sync/resolve', ContactController.resolveConflict as RequestHandler);

export default router; 