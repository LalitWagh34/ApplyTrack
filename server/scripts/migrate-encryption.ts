/**
 * One-time Migration Script
 * Encrypts any existing legacy plaintext applications in the database
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { cryptoService } from '../src/services/crypto.service.js';

const dbUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

async function migratePlaintextApplications() {
  console.log('[Migration] Checking for legacy plaintext applications...');
  const apps = await prisma.application.findMany();

  let migratedCount = 0;

  for (const app of apps) {
    const isEncrypted = (val: string | null) => {
      if (!val) return true;
      const parts = val.split(':');
      return parts.length === 3 && parts[0].length === 24 && parts[1].length === 32;
    };

    const needsEncryption =
      !isEncrypted(app.companyName) ||
      !isEncrypted(app.roleTitle) ||
      (app.notes && !isEncrypted(app.notes)) ||
      (app.location && !isEncrypted(app.location)) ||
      (app.salaryRange && !isEncrypted(app.salaryRange)) ||
      (app.jobUrl && !isEncrypted(app.jobUrl));

    if (needsEncryption) {
      console.log(`[Migration] Encrypting application ID: ${app.id}...`);

      const updateData: Record<string, any> = {};
      if (!isEncrypted(app.companyName)) {
        updateData.companyName = cryptoService.encrypt(app.companyName);
      }
      if (!isEncrypted(app.roleTitle)) {
        updateData.roleTitle = cryptoService.encrypt(app.roleTitle);
      }
      if (app.notes && !isEncrypted(app.notes)) {
        updateData.notes = cryptoService.encrypt(app.notes);
      }
      if (app.location && !isEncrypted(app.location)) {
        updateData.location = cryptoService.encrypt(app.location);
      }
      if (app.salaryRange && !isEncrypted(app.salaryRange)) {
        updateData.salaryRange = cryptoService.encrypt(app.salaryRange);
      }
      if (app.jobUrl && !isEncrypted(app.jobUrl)) {
        updateData.jobUrl = cryptoService.encrypt(app.jobUrl);
      }

      await prisma.application.update({
        where: { id: app.id },
        data: updateData
      });

      migratedCount++;
    }
  }

  console.log(`[Migration] Completed! Successfully encrypted ${migratedCount} legacy application(s).`);
  await prisma.$disconnect();
}

migratePlaintextApplications().catch((err) => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});
