import { Form, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../middleware/error-handler';
import { CreateFormInput } from './form.schema';

export interface FormDto {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

function toFormDto(form: Form): FormDto {
  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
  };
}

export async function getForm(): Promise<FormDto | null> {
  const form = await prisma.form.findFirst();
  return form ? toFormDto(form) : null;
}

export async function createForm(input: CreateFormInput): Promise<FormDto> {
  const existing = await prisma.form.findFirst();
  if (existing) {
    throw new ApiError(409, 'A lead form already exists. Only one form can be created.');
  }

  try {
    // singletonKey defaults to 1 with a unique constraint, so the one-form rule
    // also holds at the database layer even under concurrent requests.
    const form = await prisma.form.create({ data: input });
    return toFormDto(form);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = String(err.meta?.target ?? '');
      if (target.includes('slug')) {
        throw new ApiError(409, 'This slug is already in use.');
      }
      throw new ApiError(409, 'A lead form already exists. Only one form can be created.');
    }
    throw err;
  }
}
