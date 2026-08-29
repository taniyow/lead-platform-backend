import { LeadStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../middleware/error-handler';
import { PublicLeadInput } from './lead.schema';

export interface PublicFormDto {
  id: number;
  name: string;
  slug: string;
}

export interface ProcessedLeadResult {
  leadId: number;
  status: LeadStatus;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getPublicFormBySlug(slug: string): Promise<PublicFormDto> {
  const form = await prisma.form.findUnique({ where: { slug } });
  if (!form) {
    throw new ApiError(404, 'Form not found');
  }
  return { id: form.id, name: form.name, slug: form.slug };
}

export async function processPublicLead(
  slug: string,
  input: PublicLeadInput,
  ipAddress: string,
): Promise<ProcessedLeadResult> {
  const form = await prisma.form.findUnique({ where: { slug } });
  if (!form) {
    throw new ApiError(404, 'Form not found');
  }

  const normalizedEmail = normalizeEmail(input.email);

  return prisma.$transaction(async (tx) => {
    const distribution = await tx.distribution.findFirst({
      include: { brokers: { include: { broker: true } } },
    });

    // The lead is always persisted, and attached to the distribution it passed
    // through so duplicates and unsent leads appear in the distribution history.
    const lead = await tx.lead.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim(),
        normalizedEmail,
        phone: input.phone.trim(),
        ipAddress,
        formId: form.id,
        distributionId: distribution?.id ?? null,
        status: 'unsent',
      },
    });

    // Duplicate rule: the normalized email was already assigned to a broker.
    const previouslyAssigned = await tx.lead.findFirst({
      where: {
        normalizedEmail,
        assignedBrokerId: { not: null },
        id: { not: lead.id },
      },
      select: { id: true },
    });
    if (previouslyAssigned) {
      await tx.lead.update({ where: { id: lead.id }, data: { status: 'duplicate' } });
      return { leadId: lead.id, status: 'duplicate' as LeadStatus };
    }

    if (!distribution) {
      return { leadId: lead.id, status: 'unsent' as LeadStatus };
    }

    // Broker eligibility and weighted deficit selection are implemented in the
    // assignment step; until a broker is assigned the lead remains unsent.
    return { leadId: lead.id, status: 'unsent' as LeadStatus };
  });
}
