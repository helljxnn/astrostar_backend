-- CreateTable
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "newEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
