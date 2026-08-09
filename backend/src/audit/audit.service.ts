import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(action: string, entity: string, entityId?: string, userId?: string) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId: entityId ?? null,
        userId: userId ?? null,
      },
    });
  }

  findRecent(limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
