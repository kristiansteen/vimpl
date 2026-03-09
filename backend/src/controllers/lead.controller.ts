import { Request, Response } from 'express';
import leadService from '../services/lead.service';
import logger from '../utils/logger';

class LeadController {
    async handleLead(req: Request, res: Response) {
        try {
            const { name, email, phone, selectedDocuments } = req.body;

            if (!name || !email || !selectedDocuments || !Array.isArray(selectedDocuments) || selectedDocuments.length === 0) {
                return res.status(400).json({
                    error: 'Missing required fields. Name, email, and at least one selected document are required.'
                });
            }

            const lead = await leadService.createLead({
                name,
                email,
                phone,
                selectedDocuments,
            });

            return res.status(201).json({
                message: 'Lead captured successfully and email sent.',
                leadId: lead.id,
            });
        } catch (error) {
            logger.error('LeadController handleLead error:', error);
            return res.status(500).json({ error: 'Internal server error while processing lead.' });
        }
    }

    async getLeads(_req: Request, res: Response) {
        try {
            const leads = await leadService.getAllLeads();
            return res.status(200).json(leads);
        } catch (error) {
            logger.error('LeadController getLeads error:', error);
            return res.status(500).json({ error: 'Internal server error fetching leads.' });
        }
    }
}

export default new LeadController();
