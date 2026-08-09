-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TESTER', 'VIEWER');

-- CreateEnum
CREATE TYPE "Methodology" AS ENUM ('BURP', 'OWASP');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('CERTAIN', 'FIRM', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FIXED', 'RETEST', 'CLOSED');

-- CreateEnum
CREATE TYPE "OwaspTestResult" AS ENUM ('PASS', 'FAIL', 'NOT_APPLICABLE', 'NOT_TESTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TESTER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_url" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "assessment_number" TEXT NOT NULL,
    "methodology" "Methodology" NOT NULL,
    "tester" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "description" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owasp_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "owasp_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owasp_tests" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "test_case" TEXT NOT NULL,
    "test_objective" TEXT,
    "test_procedure" TEXT,
    "result" "OwaspTestResult" NOT NULL DEFAULT 'NOT_TESTED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owasp_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "owasp_category_id" TEXT,
    "owasp_test_id" TEXT,
    "title" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "confidence" "Confidence",
    "affected_url" TEXT,
    "http_method" TEXT,
    "parameter" TEXT,
    "description" TEXT,
    "impact" TEXT,
    "recommendation" TEXT,
    "reference" TEXT,
    "status" "FindingStatus" NOT NULL DEFAULT 'OPEN',
    "cvss_score" DOUBLE PRECISION,
    "cvss_vector" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidences" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_assessment_number_key" ON "assessments"("assessment_number");

-- CreateIndex
CREATE INDEX "assessments_project_id_idx" ON "assessments"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "owasp_categories_code_key" ON "owasp_categories"("code");

-- CreateIndex
CREATE INDEX "owasp_tests_assessment_id_idx" ON "owasp_tests"("assessment_id");

-- CreateIndex
CREATE INDEX "owasp_tests_category_id_idx" ON "owasp_tests"("category_id");

-- CreateIndex
CREATE INDEX "findings_assessment_id_idx" ON "findings"("assessment_id");

-- CreateIndex
CREATE INDEX "findings_severity_idx" ON "findings"("severity");

-- CreateIndex
CREATE INDEX "findings_status_idx" ON "findings"("status");

-- CreateIndex
CREATE INDEX "evidences_finding_id_idx" ON "evidences"("finding_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owasp_tests" ADD CONSTRAINT "owasp_tests_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owasp_tests" ADD CONSTRAINT "owasp_tests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "owasp_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_owasp_category_id_fkey" FOREIGN KEY ("owasp_category_id") REFERENCES "owasp_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_owasp_test_id_fkey" FOREIGN KEY ("owasp_test_id") REFERENCES "owasp_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
