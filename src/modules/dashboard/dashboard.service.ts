import { getBrokerDayRange } from '../../domain/distribution/get-broker-day-range';
import { isBrokerOpen } from '../../domain/distribution/is-broker-open';
import { prisma } from '../../lib/prisma';

export interface DashboardBrokerStat {
  id: number;
  name: string;
  active: boolean;
  inDistribution: boolean;
  distributionActive: boolean;
  percentage: number | null;
  dailyCap: number;
  sentToday: number;
  openNow: boolean;
}

export interface DashboardStats {
  leadCounts: {
    total: number;
    sent: number;
    unsent: number;
    duplicate: number;
    failed: number;
  };
  brokers: DashboardBrokerStat[];
  form: { id: number; name: string; slug: string } | null;
  distribution: { id: number; createdAt: Date } | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [statusGroups, brokers, form, distribution] = await Promise.all([
    prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.broker.findMany({ orderBy: { id: 'asc' } }),
    prisma.form.findFirst(),
    prisma.distribution.findFirst({ include: { brokers: true } }),
  ]);

  const leadCounts = { total: 0, sent: 0, unsent: 0, duplicate: 0, failed: 0 };
  for (const group of statusGroups) {
    leadCounts[group.status] = group._count._all;
    leadCounts.total += group._count._all;
  }

  const now = new Date();
  const brokerStats: DashboardBrokerStat[] = [];
  for (const broker of brokers) {
    const membership = distribution?.brokers.find((entry) => entry.brokerId === broker.id);
    const range = getBrokerDayRange(broker.timezone, now);
    const sentToday = await prisma.lead.count({
      where: {
        assignedBrokerId: broker.id,
        status: 'sent',
        assignedAt: { gte: range.start, lt: range.end },
      },
    });

    brokerStats.push({
      id: broker.id,
      name: broker.name,
      active: broker.active,
      inDistribution: membership !== undefined,
      distributionActive: membership?.active ?? false,
      percentage: membership?.percentage ?? null,
      dailyCap: broker.dailyCap,
      sentToday,
      openNow: isBrokerOpen(
        {
          timezone: broker.timezone,
          openingTime: broker.openingTime,
          closingTime: broker.closingTime,
          workingDays: broker.workingDays as string[],
        },
        now,
      ),
    });
  }

  return {
    leadCounts,
    brokers: brokerStats,
    form: form ? { id: form.id, name: form.name, slug: form.slug } : null,
    distribution: distribution ? { id: distribution.id, createdAt: distribution.createdAt } : null,
  };
}
