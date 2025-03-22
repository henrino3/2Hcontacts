import { Router, RequestHandler } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate as RequestHandler);

// CRUD operations
router.post('/', ContactController.createContact as RequestHandler);
router.get('/', ContactController.listContacts as RequestHandler);
router.get('/:id', ContactController.getContact as RequestHandler);
router.put('/:id', ContactController.updateContact as RequestHandler);
router.delete('/:id', ContactController.deleteContact as RequestHandler);

// Search and sync operations
router.get('/search', ContactController.searchContacts as RequestHandler);
router.get('/sync/status', ContactController.getSyncStatus as RequestHandler);
router.post('/sync', ContactController.syncContacts as RequestHandler);

export default router; 