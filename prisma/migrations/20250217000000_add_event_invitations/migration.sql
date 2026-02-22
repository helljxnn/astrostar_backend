-- CreateEnum
CREATE TYPE "EventInvitationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('INDIVIDUAL', 'TEAM');

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

-- AddForeignKey
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
