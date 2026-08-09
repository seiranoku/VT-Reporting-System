/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const OWASP_CATEGORIES = [
  { code: 'A01', name: 'Broken Access Control', sortOrder: 1 },
  { code: 'A02', name: 'Cryptographic Failures', sortOrder: 2 },
  { code: 'A03', name: 'Injection', sortOrder: 3 },
  { code: 'A04', name: 'Insecure Design', sortOrder: 4 },
  { code: 'A05', name: 'Security Misconfiguration', sortOrder: 5 },
  { code: 'A06', name: 'Vulnerable and Outdated Components', sortOrder: 6 },
  {
    code: 'A07',
    name: 'Identification and Authentication Failures',
    sortOrder: 7,
  },
  {
    code: 'A08',
    name: 'Software and Data Integrity Failures',
    sortOrder: 8,
  },
  {
    code: 'A09',
    name: 'Security Logging and Monitoring Failures',
    sortOrder: 9,
  },
  {
    code: 'A10',
    name: 'Mishandling of Exceptional Conditions',
    sortOrder: 10,
  },
];

async function main() {
  for (const category of OWASP_CATEGORIES) {
    await prisma.owaspCategory.upsert({
      where: { code: category.code },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
      },
      create: category,
    });
  }

  console.log(`Seeded ${OWASP_CATEGORIES.length} OWASP categories`);

  let project = await prisma.project.findFirst({
    where: { name: 'Demo Application' },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Demo Application',
        description: 'Sample app for VT Reporting System demo',
        targetUrl: 'https://example.local',
        environment: 'Development',
      },
    });
  }

  let burp = await prisma.assessment.findUnique({
    where: { assessmentNumber: 'VT-2026-001' },
  });
  if (!burp) {
    burp = await prisma.assessment.create({
      data: {
        projectId: project.id,
        assessmentNumber: 'VT-2026-001',
        methodology: 'BURP',
        tester: 'Security Team',
        status: 'COMPLETED',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-05'),
        description: 'Demo Burp Suite assessment',
      },
    });
  }

  let owasp = await prisma.assessment.findUnique({
    where: { assessmentNumber: 'VT-2026-002' },
  });
  if (!owasp) {
    owasp = await prisma.assessment.create({
      data: {
        projectId: project.id,
        assessmentNumber: 'VT-2026-002',
        methodology: 'OWASP',
        tester: 'Security Team',
        status: 'IN_PROGRESS',
        startDate: new Date('2026-08-06'),
        description: 'Demo OWASP Top 10 assessment',
      },
    });
  }

  const a01 = await prisma.owaspCategory.findUnique({ where: { code: 'A01' } });
  const a03 = await prisma.owaspCategory.findUnique({ where: { code: 'A03' } });
  const a05 = await prisma.owaspCategory.findUnique({ where: { code: 'A05' } });

  const findingCount = await prisma.finding.count({
    where: { assessmentId: burp.id },
  });

  if (findingCount === 0) {
    await prisma.finding.createMany({
      data: [
        {
          assessmentId: burp.id,
          title: 'SQL Injection',
          severity: 'CRITICAL',
          confidence: 'CERTAIN',
          affectedUrl: 'https://example.local/login',
          httpMethod: 'POST',
          parameter: 'username',
          description: 'Unparameterized SQL query in login form.',
          impact: 'Full database compromise possible.',
          recommendation: 'Use parameterized queries / prepared statements.',
          status: 'OPEN',
        },
        {
          assessmentId: burp.id,
          title: 'Security Misconfiguration',
          severity: 'MEDIUM',
          confidence: 'FIRM',
          affectedUrl: 'https://example.local/',
          httpMethod: 'GET',
          description: 'Verbose server headers expose technology stack.',
          impact: 'Aids targeted attacks.',
          recommendation: 'Remove unnecessary response headers.',
          status: 'OPEN',
        },
      ],
    });
  }

  if (a01 && a03) {
    const owaspFindingCount = await prisma.finding.count({
      where: { assessmentId: owasp.id },
    });

    if (owaspFindingCount === 0) {
      const bacTest = await prisma.owaspTest.create({
        data: {
          assessmentId: owasp.id,
          categoryId: a01.id,
          testCase: 'Horizontal privilege escalation via user ID',
          testObjective: 'Verify users cannot access other users resources',
          testProcedure: 'Change userId parameter to another account',
          result: 'FAIL',
        },
      });

      await prisma.owaspTest.create({
        data: {
          assessmentId: owasp.id,
          categoryId: a03.id,
          testCase: 'Reflected XSS in search',
          testObjective: 'Check output encoding',
          result: 'PASS',
        },
      });

      if (a05) {
        await prisma.owaspTest.create({
          data: {
            assessmentId: owasp.id,
            categoryId: a05.id,
            testCase: 'Default credentials on admin panel',
            result: 'NOT_TESTED',
          },
        });
      }

      await prisma.finding.create({
        data: {
          assessmentId: owasp.id,
          owaspCategoryId: a01.id,
          owaspTestId: bacTest.id,
          title: 'Broken Access Control',
          severity: 'HIGH',
          affectedUrl: 'https://example.local/api/users/2',
          httpMethod: 'GET',
          description: 'User can access another users profile by changing ID.',
          impact: 'Unauthorized data disclosure.',
          recommendation: 'Enforce authorization checks on every request.',
          status: 'OPEN',
        },
      });
    }
  }

  console.log('Seeded demo project, assessments, tests, and findings');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
