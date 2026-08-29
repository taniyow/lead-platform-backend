import { LeadStatus, Prisma } from '@prisma/client';
import { getBrokerDayRange } from '../../domain/distribution/get-broker-day-range';
import { isBrokerOpen } from '../../domain/distribution/is-broker-open';
import { BrokerCandidate, selectBroker } from '../../domain/distribution/select-broker';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { withSerializableRetry } from '../../lib/transaction';
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

interface LeadCreateData {
  name: string;
  email: string;
  normalizedEmail: string;
  phone: string;
  ipAddress: string;
  formId: number;
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

async function runLeadPipeline(
  tx: Prisma.TransactionClient,
  data: LeadCreateData,
): Promise<ProcessedLeadResult> {
  const distribution = await tx.distribution.findFirst({
    include: { brokers: { include: { broker: true } } },
  });

  // The lead is always persisted, attached to the distribution it passed
  // through so duplicates and unsent leads appear in the distribution history.
  const lead = await tx.lead.create({
    data: { ...data, distributionId: distribution?.id ?? null, status: 'unsent' },
  });

  // Duplicate rule: the normalized email was already assigned to a broker.
  const previouslyAssigned = await tx.lead.findFirst({
    where: {
      normalizedEmail: data.normalizedEmail,
      assignedBrokerId: { not: null },
      id: { not: lead.id },
    },
    select: { id: true },
  });
  if (previouslyAssigned) {
    await tx.lead.update({ where: { id: lead.id }, data: { status: 'duplicate' } });
    return { leadId: lead.id, status: 'duplicate' };
  }

  if (!distribution) {
    return { leadId: lead.id, status: 'unsent' };
  }

  const now = new Date();

  // Each participating broker's sent count for its own local calendar day.
  const sentTodayByBroker = new Map<number, number>();
  for (const entry of distribution.brokers) {
    const range = getBrokerDayRange(entry.broker.timezone, now);
    const sentToday = await tx.lead.count({
      where: {
        assignedBrokerId: entry.brokerId,
        status: 'sent',
        assignedAt: { gte: range.start, lt: range.end },
      },
    });
    sentTodayByBroker.set(entry.brokerId, sentToday);
  }

  // totalSentToday = sum of the participating brokers' own-local-day counts,
  // matching the assessment's worked example (4 + 3 + 3 = 10).
  const totalSentToday = [...sentTodayByBroker.values()].reduce((sum, count) => sum + count, 0);

  const candidates: BrokerCandidate[] = distribution.brokers
    .filter((entry) => {
      const sentToday = sentTodayByBroker.get(entry.brokerId) ?? 0;
      return (
        entry.active &&
        entry.broker.active &&
        sentToday < entry.broker.dailyCap &&
        isBrokerOpen(
          {
            timezone: entry.broker.timezone,
            openingTime: entry.broker.openingTime,
            closingTime: entry.broker.closingTime,
            workingDays: entry.broker.workingDays as string[],
          },
          now,
        )
      );
    })
    .map((entry) => ({
      brokerId: entry.brokerId,
      percentage: entry.percentage,
      sentToday: sentTodayByBroker.get(entry.brokerId) ?? 0,
    }));

  const selected = selectBroker(candidates, totalSentToday);
  if (!selected) {
    return { leadId: lead.id, status: 'unsent' };
  }

  await tx.lead.update({
    where: { id: lead.id },
    data: { status: 'sent', assignedBrokerId: selected.brokerId, assignedAt: now },
  });
  return { leadId: lead.id, status: 'sent' };
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

  const data: LeadCreateData = {
    name: input.name.trim(),
    email: input.email.trim(),
    normalizedEmail: normalizeEmail(input.email),
    phone: input.phone.trim(),
    ipAddress,
    formId: form.id,
  };

  try {
    // Serializable isolation makes the duplicate check, cap counts, and
    // assignment atomic under concurrency; conflicts retry a few times.
    return await withSerializableRetry(() =>
      prisma.$transaction((tx) => runLeadPipeline(tx, data), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }),
    );
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    // The submission was accepted but processing failed unexpectedly:
    // preserve it as a failed lead instead of losing it.
    logger.error('Lead processing failed', err);
    try {
      const distribution = await prisma.distribution.findFirst({ select: { id: true } });
      const failedLead = await prisma.lead.create({
        data: { ...data, distributionId: distribution?.id ?? null, status: 'failed' },
      });
      return { leadId: failedLead.id, status: 'failed' };
    } catch (persistError) {
      logger.error('Could not persist failed lead', persistError);
      throw new ApiError(500, 'Lead processing failed');
    }
  }
}
