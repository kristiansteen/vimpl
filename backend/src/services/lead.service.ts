import { PrismaClient } from '@prisma/client';
import { sendLeadWelcomeEmail } from './email.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

class LeadService {
    async createLead(data: { name: string; email: string; phone?: string; selectedDocuments: string[] }) {
        try {
            // 1. Save to database
            const lead = await prisma.lead.create({
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    selectedDocuments: data.selectedDocuments,
                },
            });

            logger.info(`Lead created: ${lead.email}`);

            // 2. Trigger welcome email with attachments
            const emailSent = await sendLeadWelcomeEmail(
                data.email,
                data.name,
                data.selectedDocuments
            );

            if (!emailSent) {
                logger.warn(`Failed to send welcome email to ${data.email}`);
            }

            return lead;
        } catch (error) {
            logger.error('Error creating lead:', error);
            throw error;
        }
    }

    async getAllLeads() {
        return prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
}

export default new LeadService();
