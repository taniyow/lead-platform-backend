import { Broker } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../middleware/error-handler';
import { CreateBrokerInput, UpdateBrokerInput, WeekDay } from './broker.schema';

export interface BrokerDto {
  id: number;
  name: string;
  active: boolean;
  dailyCap: number;
  timezone: string;
  openingTime: string;
  closingTime: string;
  workingDays: WeekDay[];
  createdAt: Date;
  updatedAt: Date;
}

function toBrokerDto(broker: Broker): BrokerDto {
  return {
    id: broker.id,
    name: broker.name,
    active: broker.active,
    dailyCap: broker.dailyCap,
    timezone: broker.timezone,
    openingTime: broker.openingTime,
    closingTime: broker.closingTime,
    workingDays: broker.workingDays as WeekDay[],
    createdAt: broker.createdAt,
    updatedAt: broker.updatedAt,
  };
}

export async function listBrokers(): Promise<BrokerDto[]> {
  const brokers = await prisma.broker.findMany({ orderBy: { id: 'asc' } });
  return brokers.map(toBrokerDto);
}

export async function getBrokerById(id: number): Promise<BrokerDto> {
  const broker = await prisma.broker.findUnique({ where: { id } });
  if (!broker) {
    throw new ApiError(404, 'Broker not found');
  }
  return toBrokerDto(broker);
}

export async function createBroker(input: CreateBrokerInput): Promise<BrokerDto> {
  const broker = await prisma.broker.create({ data: input });
  return toBrokerDto(broker);
}

export async function updateBroker(id: number, input: UpdateBrokerInput): Promise<BrokerDto> {
  const existing = await prisma.broker.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Broker not found');
  }

  // Validate the merged schedule so single-field updates cannot produce an
  // equal opening/closing pair.
  const openingTime = input.openingTime ?? existing.openingTime;
  const closingTime = input.closingTime ?? existing.closingTime;
  if (openingTime === closingTime) {
    throw new ApiError(400, 'Opening and closing time cannot be equal');
  }

  const broker = await prisma.broker.update({ where: { id }, data: input });
  return toBrokerDto(broker);
}
