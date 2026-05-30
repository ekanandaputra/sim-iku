// @ts-ignore
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const prodis = [
    { code: 'D2-TPF', name: 'D2 Teknik Pengelasan dan Fabrikasi', level: 'D2' },
    { code: 'D3-TBK', name: 'D3 Teknik Bangunan Kapal', level: 'D3' },
    { code: 'D3-TPKK', name: 'D3 Teknik Perancangan dan Konstruksi Kapal', level: 'D3' },
    { code: 'D4-TPKK', name: 'D4 Teknik Perancangan dan Konstruksi Kapal', level: 'D4' },
    { code: 'D4-TP', name: 'D4 Teknik Pengelasan', level: 'D4' },
    { code: 'D4-MB', name: 'D4 Manajemen Bisnis', level: 'D4' },
    { code: 'D4-TRKP', name: 'D4 Teknologi Rekayasa Konstruksi Perkapalan', level: 'D4' },
    { code: 'D3-TPMK', name: 'D3 Teknik Permesinan Kapal', level: 'D3' },
    { code: 'D4-TPMK', name: 'D4 Teknik Permesinan Kapal', level: 'D4' },
    { code: 'D4-K3', name: 'D4 Teknik Keselamatan dan Kesehatan Kerja', level: 'D4' },
    { code: 'D4-TPP', name: 'D4 Teknik Perpipaan', level: 'D4' },
    { code: 'D4-TDM', name: 'D4 Teknik Desain dan Manufaktur', level: 'D4' },
    { code: 'D4-TPL', name: 'D4 Teknik Pengolahan Limbah', level: 'D4' },
    { code: 'D4-TREB', name: 'D4 Teknologi Rekayasa Energi Berkelanjutan', level: 'D4' },
    { code: 'S2-TKR', name: 'S2 Teknik Keselamatan dan Risiko', level: 'S2' },
    { code: 'D3-TKK', name: 'D3 Teknik Kelistrikan Kapal', level: 'D3' },
    { code: 'D4-TKK', name: 'D4 Teknik Kelistrikan Kapal', level: 'D4' },
    { code: 'D4-TO', name: 'D4 Teknik Otomasi', level: 'D4' },
    { code: 'D4-TRI', name: 'D4 Teknologi Rekayasa Instrumentasi', level: 'D4' },
  ];

  for (const prodi of prodis) {
    await prisma.prodi.upsert({
      where: { code: prodi.code },
      update: { name: prodi.name, level: prodi.level },
      create: prodi,
    });
  }

  console.log('Seeding Prodi completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
