import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssessmentsModule } from './assessments/assessments.module';
import { AuditModule } from './audit/audit.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EvidencesModule } from './evidences/evidences.module';
import { FindingsModule } from './findings/findings.module';
import { OwaspModule } from './owasp/owasp.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';
import { ScansModule } from './scans/scans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuditModule,
    ProjectsModule,
    AssessmentsModule,
    FindingsModule,
    EvidencesModule,
    OwaspModule,
    ReportsModule,
    DashboardModule,
    ScansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
