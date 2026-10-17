-- AlterEnum
ALTER TYPE "FileKind" ADD VALUE 'PHOTO';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "photoFileId" TEXT;

-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "photoId" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "requirePhotoForProfile" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_photoId_key" ON "CandidateProfile"("photoId");

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

