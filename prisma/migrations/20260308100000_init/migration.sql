-- CreateEnum
CREATE TYPE "PreRegistrationStatus" AS ENUM ('Pending', 'Processed', 'Rejected');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('Pending_Payment', 'Vigente', 'Suspendida', 'Vencida', 'Cancelada');

-- CreateEnum
CREATE TYPE "SponsorStatus" AS ENUM ('Active', 'Inactive', 'Pending');

-- CreateEnum
CREATE TYPE "DonorSponsorType" AS ENUM ('Donor', 'Sponsor');

-- CreateEnum
CREATE TYPE "DonorSponsorPersonType" AS ENUM ('Natural', 'Juridica');

-- CreateEnum
CREATE TYPE "SportsCategoryStatus" AS ENUM ('Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "AthleteStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "InscriptionStatus" AS ENUM ('Active', 'Suspended', 'Expired');

-- CreateEnum
CREATE TYPE "InscriptionRecordType" AS ENUM ('initial_inscription', 'renewal', 'status_change');

-- CreateEnum
CREATE TYPE "GuardianRelationship" AS ENUM ('Mother', 'Father', 'Grandparent', 'Uncle_Aunt', 'Sibling', 'Cousin', 'Legal_Guardian', 'Neighbor', 'Family_Friend', 'Other');

-- CreateEnum
CREATE TYPE "TemporaryPersonStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "TemporaryPersonType" AS ENUM ('Deportista', 'Entrenador', 'Participante');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('Active', 'Inactive', 'Disbanded');

-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('Athlete', 'Employee', 'TemporaryPerson');

-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('Individual', 'Team');

-- CreateEnum
CREATE TYPE "ProviderEntityType" AS ENUM ('legal', 'natural');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('Pending', 'Received', 'Partial', 'Cancelled');

-- CreateEnum
CREATE TYPE "ScheduleRecurrence" AS ENUM ('no', 'dia', 'semana', 'mes', 'anio', 'laboral', 'personalizado');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('Programado', 'Completado', 'Cancelado');

-- CreateEnum
CREATE TYPE "ScheduleNoveltyType" AS ENUM ('full', 'time');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('Player', 'Coach', 'Assistant', 'Manager', 'Captain');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('ECONOMICA', 'ESPECIE', 'ALIMENTOS');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('Recibida', 'EnProceso', 'Verificada', 'Ejecutada', 'Anulada');

-- CreateEnum
CREATE TYPE "DonationFileType" AS ENUM ('comprobante', 'soporte', 'factura', 'evidencia');

-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive', 'Suspended');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('Activo', 'Licencia', 'Desvinculado', 'Fallecido');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('Programado', 'En_curso', 'Finalizado', 'Cancelado');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('Fundacion', 'Temporal');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GroupLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EventInvitationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('INDIVIDUAL', 'TEAM');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "EventMaterialType" AS ENUM ('CONSUMIBLE', 'REUTILIZABLE');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('Entrada', 'Baja', 'Consumo', 'Ajuste', 'TRANSFERENCIA', 'SALIDA_EVENTO', 'REVERSO_SALIDA_EVENTO', 'Salida', 'ASIGNACION_EVENTO', 'REVERSION_ASIGNACION');

-- CreateEnum
CREATE TYPE "DestinoMovimiento" AS ENUM ('Evento', 'ConsumoInterno', 'Dano', 'Perdida', 'Entrega');

-- CreateEnum
CREATE TYPE "DestinoStock" AS ENUM ('USO_INTERNO', 'EVENTOS');

-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('FUNDACION', 'EVENTOS');

-- CreateEnum
CREATE TYPE "TipoBaja" AS ENUM ('DanoDeterioro', 'Perdida', 'Robo', 'AjusteInventario', 'Otro');

-- CreateEnum
CREATE TYPE "OrigenMovimiento" AS ENUM ('Compra', 'Donacion', 'AjustePositivo', 'AjusteNegativo', 'UsoEvento', 'Dano', 'Perdida', 'Entrega', 'ConsumoInterno');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('Entrada', 'Salida', 'ASIGNACION_EVENTO', 'REVERSION_ASIGNACION');

-- CreateEnum
CREATE TYPE "EventAssignmentStatus" AS ENUM ('RESERVADO', 'USADO', 'DEVUELTO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('MONTHLY', 'ENROLLMENT_INITIAL', 'ENROLLMENT_RENEWAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "document_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "status" "RoleStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "permissions" JSONB DEFAULT '{}',

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "secondLastName" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "identification" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "age" INTEGER,
    "avatarColorIndex" INTEGER DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "attempts" INTEGER DEFAULT 0,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_attempts" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "success" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked_until" TIMESTAMP(3),

    CONSTRAINT "password_reset_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "newEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'Activo',
    "statusAssignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employeeTypeId" INTEGER,
    "userId" INTEGER NOT NULL,
    "signature_url" VARCHAR(500),
    "signature_public_id" VARCHAR(255),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privileges" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "privileges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_permissions" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_schedules" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "scheduleDate" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "recurrence" "ScheduleRecurrence" NOT NULL DEFAULT 'no',
    "customRecurrence" TEXT,
    "description" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'Programado',
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_schedule_novelties" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "ScheduleNoveltyType" NOT NULL DEFAULT 'full',
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_schedule_novelties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "specialistId" INTEGER NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "description" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'Programado',
    "cancelReason" TEXT,
    "conclusion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_categories" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "edadMinima" INTEGER NOT NULL,
    "edadMaxima" INTEGER NOT NULL,
    "descripcion" VARCHAR(500),
    "archivo" TEXT,
    "estado" "SportsCategoryStatus" NOT NULL DEFAULT 'Activo',
    "publicar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "identification" VARCHAR(50) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "address" VARCHAR(200),
    "occupation" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "birthDate" TIMESTAMP(3),
    "statusAssignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athletes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "AthleteStatus" NOT NULL DEFAULT 'Active',
    "guardianId" INTEGER,
    "relationship" "GuardianRelationship",
    "otherRelationship" VARCHAR(100),
    "currentInscriptionStatus" "InscriptionStatus",
    "isScholarship" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inactivityReason" VARCHAR(200),
    "statusAssignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_attendances" (
    "id" SERIAL NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "asistencia" BOOLEAN NOT NULL DEFAULT false,
    "observacion" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "fechaMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EnrollmentStatus" NOT NULL DEFAULT 'Vigente',
    "observaciones" TEXT,
    "comprobantePago" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" SERIAL NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "sportsCategoryId" INTEGER NOT NULL,
    "type" "InscriptionRecordType" NOT NULL DEFAULT 'initial_inscription',
    "status" "InscriptionStatus" NOT NULL DEFAULT 'Active',
    "previousStatus" "InscriptionStatus",
    "inscriptionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conceptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "concept" VARCHAR(500) NOT NULL,
    "notes" TEXT,
    "paymentProofUrl" VARCHAR(500),
    "paymentProofName" VARCHAR(255),
    "paymentProofType" VARCHAR(50),
    "paymentProofUploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_persons" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "identification" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "age" INTEGER,
    "address" TEXT,
    "organization" TEXT,
    "person_type" "TemporaryPersonType",
    "status" "TemporaryPersonStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentTypeId" INTEGER,

    CONSTRAINT "temporary_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coach" TEXT,
    "category" TEXT,
    "status" "TeamStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamType" "TeamType" NOT NULL DEFAULT 'Temporal',

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "memberType" "MemberType" NOT NULL,
    "position" TEXT,
    "jerseyNumber" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteId" INTEGER,
    "employeeId" INTEGER,
    "temporaryPersonId" INTEGER,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" SERIAL NOT NULL,
    "type" "ParticipantType" NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Registered',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "sportsCategoryId" INTEGER,
    "athleteId" INTEGER,
    "teamId" INTEGER,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" SERIAL NOT NULL,
    "entityType" "ProviderEntityType" NOT NULL DEFAULT 'legal',
    "businessName" VARCHAR(200) NOT NULL,
    "nit" VARCHAR(50) NOT NULL,
    "mainContact" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "status" "ProviderStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentTypeId" INTEGER,
    "statusAssignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_registrations" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "second_last_name" VARCHAR(100),
    "birth_date" TIMESTAMP(3) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "status" "PreRegistrationStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "identification" VARCHAR(50),

    CONSTRAINT "pre_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'Programado',
    "imageUrl" TEXT,
    "scheduleFile" TEXT,
    "publish" BOOLEAN NOT NULL DEFAULT false,
    "typeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" INTEGER,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSponsor" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "sponsorId" INTEGER NOT NULL,

    CONSTRAINT "ServiceSponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_sports_categories" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "sportsCategoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_sports_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contactEmail" VARCHAR(150),
    "phone" VARCHAR(30),
    "status" "SponsorStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "DonorSponsorType" NOT NULL DEFAULT 'Donor',
    "personType" "DonorSponsorPersonType" NOT NULL DEFAULT 'Natural',
    "documentType" VARCHAR(50),
    "identification" VARCHAR(100) NOT NULL,
    "contactName" VARCHAR(150),
    "address" VARCHAR(200),
    "city" VARCHAR(120),
    "country" VARCHAR(120),

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "donorSponsorId" INTEGER,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "type" "DonationType" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'Recibida',
    "program" TEXT,
    "donationAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "cancelReason" TEXT,
    "cancelAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "serviceId" INTEGER,
    "responsible_id" INTEGER,
    "employeeId" INTEGER,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationDetail" (
    "id" SERIAL NOT NULL,
    "donationId" INTEGER NOT NULL,
    "kind" "DonationType" NOT NULL,
    "recordType" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2),
    "amount" DECIMAL(15,2),
    "channel" TEXT,
    "classification" TEXT,
    "expiresAt" TIMESTAMP(3),
    "material_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationTransaction" (
    "id" SERIAL NOT NULL,
    "donationId" INTEGER NOT NULL,
    "fromStatus" "DonationStatus",
    "toStatus" "DonationStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationFile" (
    "id" SERIAL NOT NULL,
    "donationId" INTEGER NOT NULL,
    "detailId" INTEGER,
    "fileType" "DonationFileType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "level" "GroupLevel" NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_memberships" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_invitations" (
    "id" SERIAL NOT NULL,
    "participantId" INTEGER NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "status" "EventInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitationType" "InvitationType" NOT NULL,
    "recipientEmail" VARCHAR(150) NOT NULL,
    "recipientName" VARCHAR(200) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_categories" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "estado" "CategoryStatus" NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "estado" "MaterialStatus" NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "unidad_medida" VARCHAR(20) NOT NULL DEFAULT 'unidad',
    "stock_fundacion" INTEGER NOT NULL DEFAULT 0,
    "stock_eventos" INTEGER NOT NULL DEFAULT 0,
    "stock_eventos_reservado" INTEGER NOT NULL DEFAULT 0,
    "es_reutilizable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_movements" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "material_nombre" VARCHAR(255) NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "tipo_movimiento" "MovementType" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "observaciones" TEXT,
    "stock_anterior" INTEGER NOT NULL,
    "stock_nuevo" INTEGER NOT NULL,
    "reference_id" INTEGER,
    "reference_type" VARCHAR(50),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,
    "created_by_name" VARCHAR(255),
    "destino" "DestinoMovimiento",
    "evento_id" INTEGER,
    "donacion_id" INTEGER,
    "reservation_id" INTEGER,
    "fecha_ingreso" DATE,
    "proveedor_id" INTEGER,
    "tipo_baja" "TipoBaja",
    "destino_stock" "DestinoStock",
    "inventario_origen" VARCHAR(20),
    "inventario_destino" VARCHAR(20),

    CONSTRAINT "material_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_materials" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "cantidad_asignada" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_by_name" VARCHAR(255),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "EventMaterialType" NOT NULL DEFAULT 'CONSUMIBLE',
    "donacion_id" INTEGER,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_material_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_materials_reusable" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_by_name" VARCHAR(255),

    CONSTRAINT "event_materials_reusable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" SERIAL NOT NULL,
    "purchaseNumber" VARCHAR(50) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "providerId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "concept" VARCHAR(500),
    "paymentMethod" VARCHAR(100),
    "invoiceUrl" VARCHAR(500),
    "invoiceName" VARCHAR(255),

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_attempts" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "success" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked_until" TIMESTAMP(3),

    CONSTRAINT "email_verification_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "monthlyAmount" INTEGER NOT NULL,
    "enrollmentAmount" INTEGER NOT NULL,
    "lateFeeDailyAmount" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_obligations" (
    "id" SERIAL NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "type" "PaymentType" NOT NULL,
    "period" TEXT,
    "baseAmount" INTEGER NOT NULL,
    "dueStart" TIMESTAMP(3) NOT NULL,
    "dueEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "obligationId" INTEGER NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "receiptUrl" TEXT NOT NULL,
    "receiptName" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_identification_key" ON "users"("identification");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_attempts_email_idx" ON "password_reset_attempts"("email");

-- CreateIndex
CREATE INDEX "password_reset_attempts_ip_address_idx" ON "password_reset_attempts"("ip_address");

-- CreateIndex
CREATE INDEX "password_reset_attempts_created_at_idx" ON "password_reset_attempts"("created_at");

-- CreateIndex
CREATE INDEX "password_reset_attempts_blocked_until_idx" ON "password_reset_attempts"("blocked_until");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "privileges_name_permissionId_key" ON "privileges"("name", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_permissions_employeeId_permissionId_key" ON "employee_permissions"("employeeId", "permissionId");

-- CreateIndex
CREATE INDEX "employee_schedule_novelties_scheduleId_date_idx" ON "employee_schedule_novelties"("scheduleId", "date");

-- CreateIndex
CREATE INDEX "appointments_athleteId_appointmentDate_idx" ON "appointments"("athleteId", "appointmentDate");

-- CreateIndex
CREATE INDEX "appointments_specialistId_appointmentDate_idx" ON "appointments"("specialistId", "appointmentDate");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "event_categories_name_key" ON "event_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_identification_key" ON "guardians"("identification");

-- CreateIndex
CREATE UNIQUE INDEX "athletes_userId_key" ON "athletes"("userId");

-- CreateIndex
CREATE INDEX "athletes_guardianId_idx" ON "athletes"("guardianId");

-- CreateIndex
CREATE INDEX "athletes_currentInscriptionStatus_idx" ON "athletes"("currentInscriptionStatus");

-- CreateIndex
CREATE INDEX "athletes_status_idx" ON "athletes"("status");

-- CreateIndex
CREATE INDEX "athlete_attendances_date_idx" ON "athlete_attendances"("date");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_attendances_athleteId_date_key" ON "athlete_attendances"("athleteId", "date");

-- CreateIndex
CREATE INDEX "enrollments_athleteId_idx" ON "enrollments"("athleteId");

-- CreateIndex
CREATE INDEX "enrollments_estado_idx" ON "enrollments"("estado");

-- CreateIndex
CREATE INDEX "enrollments_fechaMatricula_idx" ON "enrollments"("fechaMatricula");

-- CreateIndex
CREATE INDEX "enrollments_fechaVencimiento_idx" ON "enrollments"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "inscriptions_athleteId_idx" ON "inscriptions"("athleteId");

-- CreateIndex
CREATE INDEX "inscriptions_sportsCategoryId_idx" ON "inscriptions"("sportsCategoryId");

-- CreateIndex
CREATE INDEX "inscriptions_status_idx" ON "inscriptions"("status");

-- CreateIndex
CREATE INDEX "inscriptions_inscriptionDate_idx" ON "inscriptions"("inscriptionDate");

-- CreateIndex
CREATE INDEX "inscriptions_expirationDate_idx" ON "inscriptions"("expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_jerseyNumber_key" ON "team_members"("teamId", "jerseyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "providers_nit_key" ON "providers"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "providers_email_key" ON "providers"("email");

-- CreateIndex
CREATE INDEX "providers_businessName_idx" ON "providers"("businessName");

-- CreateIndex
CREATE INDEX "providers_entityType_idx" ON "providers"("entityType");

-- CreateIndex
CREATE INDEX "providers_status_idx" ON "providers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pre_registrations_email_key" ON "pre_registrations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pre_registrations_identification_key" ON "pre_registrations"("identification");

-- CreateIndex
CREATE INDEX "pre_registrations_createdAt_idx" ON "pre_registrations"("createdAt");

-- CreateIndex
CREATE INDEX "pre_registrations_status_idx" ON "pre_registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSponsor_serviceId_sponsorId_key" ON "ServiceSponsor"("serviceId", "sponsorId");

-- CreateIndex
CREATE UNIQUE INDEX "service_sports_categories_serviceId_sportsCategoryId_key" ON "service_sports_categories"("serviceId", "sportsCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_name_key" ON "ServiceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_name_key" ON "Sponsor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_identification_key" ON "Sponsor"("identification");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_code_key" ON "Donation"("code");

-- CreateIndex
CREATE INDEX "Donation_status_type_donationAt_idx" ON "Donation"("status", "type", "donationAt");

-- CreateIndex
CREATE INDEX "Donation_donorSponsorId_idx" ON "Donation"("donorSponsorId");

-- CreateIndex
CREATE INDEX "Donation_serviceId_idx" ON "Donation"("serviceId");

-- CreateIndex
CREATE INDEX "idx_donations_responsible_id" ON "Donation"("responsible_id");

-- CreateIndex
CREATE INDEX "DonationTransaction_donationId_createdAt_idx" ON "DonationTransaction"("donationId", "createdAt");

-- CreateIndex
CREATE INDEX "DonationFile_donationId_idx" ON "DonationFile"("donationId");

-- CreateIndex
CREATE INDEX "groups_teacherId_idx" ON "groups"("teacherId");

-- CreateIndex
CREATE INDEX "groups_status_idx" ON "groups"("status");

-- CreateIndex
CREATE INDEX "group_memberships_groupId_idx" ON "group_memberships"("groupId");

-- CreateIndex
CREATE INDEX "group_memberships_athleteId_idx" ON "group_memberships"("athleteId");

-- CreateIndex
CREATE INDEX "group_memberships_status_idx" ON "group_memberships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "group_memberships_groupId_athleteId_status_key" ON "group_memberships"("groupId", "athleteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_invitations_token_key" ON "event_invitations"("token");

-- CreateIndex
CREATE INDEX "event_invitations_token_idx" ON "event_invitations"("token");

-- CreateIndex
CREATE INDEX "event_invitations_status_idx" ON "event_invitations"("status");

-- CreateIndex
CREATE INDEX "event_invitations_expiresAt_idx" ON "event_invitations"("expiresAt");

-- CreateIndex
CREATE INDEX "event_invitations_participantId_idx" ON "event_invitations"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nombre_key" ON "material_categories"("nombre");

-- CreateIndex
CREATE INDEX "idx_category_estado" ON "material_categories"("estado");

-- CreateIndex
CREATE INDEX "idx_category_nombre" ON "material_categories"("nombre");

-- CreateIndex
CREATE INDEX "materials_categoria_id_idx" ON "materials"("categoria_id");

-- CreateIndex
CREATE INDEX "idx_material_categoria" ON "materials"("categoria_id");

-- CreateIndex
CREATE INDEX "idx_material_estado" ON "materials"("estado");

-- CreateIndex
CREATE INDEX "idx_material_nombre" ON "materials"("nombre");

-- CreateIndex
CREATE INDEX "materials_unidad_medida_idx" ON "materials"("unidad_medida");

-- CreateIndex
CREATE INDEX "materials_stock_fundacion_idx" ON "materials"("stock_fundacion");

-- CreateIndex
CREATE INDEX "materials_stock_eventos_idx" ON "materials"("stock_eventos");

-- CreateIndex
CREATE INDEX "materials_es_reutilizable_idx" ON "materials"("es_reutilizable");

-- CreateIndex
CREATE INDEX "idx_materials_stock_eventos_reservado" ON "materials"("stock_eventos_reservado");

-- CreateIndex
CREATE UNIQUE INDEX "unique_material_per_category" ON "materials"("nombre", "categoria_id");

-- CreateIndex
CREATE INDEX "material_movements_material_id_idx" ON "material_movements"("material_id");

-- CreateIndex
CREATE INDEX "material_movements_tipo_movimiento_idx" ON "material_movements"("tipo_movimiento");

-- CreateIndex
CREATE INDEX "material_movements_evento_id_idx" ON "material_movements"("evento_id");

-- CreateIndex
CREATE INDEX "material_movements_proveedor_id_idx" ON "material_movements"("proveedor_id");

-- CreateIndex
CREATE INDEX "idx_movement_fecha" ON "material_movements"("fecha");

-- CreateIndex
CREATE INDEX "idx_movement_material" ON "material_movements"("material_id");

-- CreateIndex
CREATE INDEX "idx_movement_tipo" ON "material_movements"("tipo_movimiento");

-- CreateIndex
CREATE INDEX "material_movements_destino_stock_idx" ON "material_movements"("destino_stock");

-- CreateIndex
CREATE INDEX "material_movements_donacion_id_idx" ON "material_movements"("donacion_id");

-- CreateIndex
CREATE INDEX "material_movements_fecha_ingreso_idx" ON "material_movements"("fecha_ingreso");

-- CreateIndex
CREATE INDEX "material_movements_reservation_id_idx" ON "material_movements"("reservation_id");

-- CreateIndex
CREATE INDEX "material_movements_tipo_baja_idx" ON "material_movements"("tipo_baja");

-- CreateIndex
CREATE INDEX "material_movements_inventario_origen_idx" ON "material_movements"("inventario_origen");

-- CreateIndex
CREATE INDEX "material_movements_inventario_destino_idx" ON "material_movements"("inventario_destino");

-- CreateIndex
CREATE INDEX "event_materials_donacion_id_idx" ON "event_materials"("donacion_id");

-- CreateIndex
CREATE INDEX "event_materials_tipo_idx" ON "event_materials"("tipo");

-- CreateIndex
CREATE INDEX "event_material_assignments_evento_id_idx" ON "event_materials"("evento_id");

-- CreateIndex
CREATE INDEX "event_material_assignments_fecha_asignacion_idx" ON "event_materials"("fecha_asignacion");

-- CreateIndex
CREATE INDEX "event_material_assignments_material_id_idx" ON "event_materials"("material_id");

-- CreateIndex
CREATE INDEX "event_materials_reusable_material_id_idx" ON "event_materials_reusable"("material_id");

-- CreateIndex
CREATE INDEX "event_materials_reusable_evento_id_idx" ON "event_materials_reusable"("evento_id");

-- CreateIndex
CREATE INDEX "event_materials_reusable_fecha_asignacion_idx" ON "event_materials_reusable"("fecha_asignacion");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_purchaseNumber_key" ON "purchases"("purchaseNumber");

-- CreateIndex
CREATE INDEX "purchases_employeeId_idx" ON "purchases"("employeeId");

-- CreateIndex
CREATE INDEX "purchases_providerId_idx" ON "purchases"("providerId");

-- CreateIndex
CREATE INDEX "purchases_purchaseDate_idx" ON "purchases"("purchaseDate");

-- CreateIndex
CREATE INDEX "email_verification_attempts_blocked_until_idx" ON "email_verification_attempts"("blocked_until");

-- CreateIndex
CREATE INDEX "email_verification_attempts_created_at_idx" ON "email_verification_attempts"("created_at");

-- CreateIndex
CREATE INDEX "email_verification_attempts_email_idx" ON "email_verification_attempts"("email");

-- CreateIndex
CREATE INDEX "email_verification_attempts_ip_address_idx" ON "email_verification_attempts"("ip_address");

-- CreateIndex
CREATE INDEX "payment_obligations_athleteId_idx" ON "payment_obligations"("athleteId");

-- CreateIndex
CREATE INDEX "payment_obligations_type_idx" ON "payment_obligations"("type");

-- CreateIndex
CREATE INDEX "payment_obligations_period_idx" ON "payment_obligations"("period");

-- CreateIndex
CREATE INDEX "payment_obligations_dueEnd_idx" ON "payment_obligations"("dueEnd");

-- CreateIndex
CREATE UNIQUE INDEX "payment_obligations_athleteId_type_period_key" ON "payment_obligations"("athleteId", "type", "period");

-- CreateIndex
CREATE INDEX "payments_obligationId_idx" ON "payments"("obligationId");

-- CreateIndex
CREATE INDEX "payments_athleteId_idx" ON "payments"("athleteId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_uploadedAt_idx" ON "payments"("uploadedAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privileges" ADD CONSTRAINT "privileges_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_permissions" ADD CONSTRAINT "employee_permissions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_permissions" ADD CONSTRAINT "employee_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_schedules" ADD CONSTRAINT "employee_schedules_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_schedule_novelties" ADD CONSTRAINT "employee_schedule_novelties_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "employee_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_attendances" ADD CONSTRAINT "athlete_attendances_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_sportsCategoryId_fkey" FOREIGN KEY ("sportsCategoryId") REFERENCES "sports_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_persons" ADD CONSTRAINT "temporary_persons_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_temporaryPersonId_fkey" FOREIGN KEY ("temporaryPersonId") REFERENCES "temporary_persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_sportsCategoryId_fkey" FOREIGN KEY ("sportsCategoryId") REFERENCES "sports_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ServiceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSponsor" ADD CONSTRAINT "ServiceSponsor_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSponsor" ADD CONSTRAINT "ServiceSponsor_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sports_categories" ADD CONSTRAINT "service_sports_categories_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sports_categories" ADD CONSTRAINT "service_sports_categories_sportsCategoryId_fkey" FOREIGN KEY ("sportsCategoryId") REFERENCES "sports_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorSponsorId_fkey" FOREIGN KEY ("donorSponsorId") REFERENCES "Sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationDetail" ADD CONSTRAINT "DonationDetail_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationTransaction" ADD CONSTRAINT "DonationTransaction_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationFile" ADD CONSTRAINT "DonationFile_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "DonationDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationFile" ADD CONSTRAINT "DonationFile_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoriaId_fkey" FOREIGN KEY ("categoria_id") REFERENCES "material_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_movements" ADD CONSTRAINT "material_movements_materialId_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_movements" ADD CONSTRAINT "material_movements_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_materials" ADD CONSTRAINT "event_material_assignments_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_materials" ADD CONSTRAINT "event_materials_donacion_id_fkey" FOREIGN KEY ("donacion_id") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_materials" ADD CONSTRAINT "event_materials_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_materials_reusable" ADD CONSTRAINT "event_materials_reusable_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_materials_reusable" ADD CONSTRAINT "event_materials_reusable_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_obligations" ADD CONSTRAINT "payment_obligations_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "payment_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

