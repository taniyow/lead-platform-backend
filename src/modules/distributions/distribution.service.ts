import { LeadStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../middleware/error-handler';
import { WeekDay } from '../brokers/broker.schema';

export interface DistributionBrokerDto {
  brokerId: number;
  name: string;
  brokerActive: boolean;
  active: boolean;
  percentage: number;
  dailyCap: number;
  timezone: string;
  openingTime: string;
  closingTime: string;
  workingDays: WeekDay[];
}

export interface DistributionDto {
  id: number;
  formId: number;
  formName: string;
  formSlug: string;
  createdAt: Date;
  brokers: DistributionBrokerDto[];
  totalPercentage: number;
}

export interface DistributionLeadDto {
  id: number;
  name: string;
  normalizedEmail: string;
  phone: string;
  ipAddress: string;
  formName: string;
  brokerName: string | null;
  status: LeadStatus;
  createdAt: Date;
  assignedAt: Date | null;
}

const distributionInclude = {
  form: { select: { name: true, slug: true } },
  brokers: { include: { broker: true }, orderBy: { brokerId: 'asc' } },
} satisfies Prisma.DistributionInclude;

type DistributionWithRelations = Prisma.DistributionGetPayload<{
  include: typeof distributionInclude;
}>;

function toDistributionDto(distribution: DistributionWithRelations): DistributionDto {
  const brokers = distribution.brokers.map((entry) => ({
    brokerId: entry.brokerId,
    name: entry.broker.name,
    brokerActive: entry.broker.active,
    active: entry.active,
    percentage: entry.percentage,
    dailyCap: entry.broker.dailyCap,
    timezone: entry.broker.timezone,
    openingTime: entry.broker.openingTime,
    closingTime: entry.broker.closingTime,
    workingDays: entry.broker.workingDays as WeekDay[],
  }));

  return {
    id: distribution.id,
    formId: distribution.formId,
    formName: distribution.form.name,
    formSlug: distribution.form.slug,
    createdAt: distribution.createdAt,
    brokers,
    totalPercentage: brokers.reduce((sum, b) => sum + b.percentage, 0),
  };
}

export async function getDistribution(): Promise<DistributionDto | null> {
  const distribution = await prisma.distribution.findFirst({ include: distributionInclude });
  return distribution ? toDistributionDto(distribution) : null;
}

export async function getDistributionById(id: number): Promise<DistributionDto> {
  const distribution = await prisma.distribution.findUnique({
    where: { id },
    include: distributionInclude,
  });
  if (!distribution) {
    throw new ApiError(404, 'Distribution not found');
  }
  return toDistributionDto(distribution);
}

export async function createDistribution(): Promise<DistributionDto> {
  const form = await prisma.form.findFirst();
  if (!form) {
    // Required wording from the assessment - do not change.
    throw new ApiError(400, 'Oops, please create a form first.');
  }

  const existing = await prisma.distribution.findFirst();
  if (existing) {
    throw new ApiError(409, 'A distribution already exists. Only one distribution can be created.');
  }

  try {
    // singletonKey defaults to 1 with a unique constraint, so the
    // one-distribution rule also holds at the database layer.
    const distribution = await prisma.distribution.create({
      data: { formId: form.id },
      include: distributionInclude,
    });
    return toDistributionDto(distribution);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ApiError(
        409,
        'A distribution already exists. Only one distribution can be created.',
      );
    }
    throw err;
  }
}

export async function getDistributionLeads(id: number): Promise<DistributionLeadDto[]> {
  const distribution = await prisma.distribution.findUnique({ where: { id } });
  if (!distribution) {
    throw new ApiError(404, 'Distribution not found');
  }

  const leads = await prisma.lead.findMany({
    where: { distributionId: id },
    include: {
      form: { select: { name: true } },
      assignedBroker: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    normalizedEmail: lead.normalizedEmail,
    phone: lead.phone,
    ipAddress: lead.ipAddress,
    formName: lead.form.name,
    brokerName: lead.assignedBroker?.name ?? null,
    status: lead.status,
    createdAt: lead.createdAt,
    assignedAt: lead.assignedAt,
  }));
}
