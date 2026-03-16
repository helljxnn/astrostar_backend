import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

async function seedDocumentTypes() {
  console.log('🌱 Iniciando seed de tipos de documento...');

  const documentTypes = [
    {
      name: 'Registro Civil',
      description: 'Registro Civil de Nacimiento - Para menores de 7 años'
    },
    {
      name: 'Tarjeta de Identidad',
      description: 'Tarjeta de Identidad - Para menores entre 7 y 17 años'
    },
    {
      name: 'Cédula de Ciudadanía',
      description: 'Cédula de Ciudadanía - Para mayores de 18 años'
    },
    {
      name: 'Cédula de Extranjería',
      description: 'Cédula de Extranjería - Para extranjeros residentes en Colombia'
    },
    {
      name: 'Permiso Especial de Permanencia',
      description: 'Permiso Especial de Permanencia (PEP) - Para casos especiales'
    },
    {
      name: 'Pasaporte',
      description: 'Pasaporte - Documento internacional de identidad'
    },
    {
      name: 'NIT',
      description: 'Número de Identificación Tributaria - Para empresas'
    }
  ];

  for (const docType of documentTypes) {
    try {
      const existing = await prisma.documentType.findFirst({
        where: { name: docType.name }
      });

      if (!existing) {
        await prisma.documentType.create({
          data: docType
        });
        console.log(`✅ Creado: ${docType.name}`);
      } else {
        console.log(`⏭️  Ya existe: ${docType.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creando ${docType.name}:`, error.message);
    }
  }

  console.log('✅ Seed de tipos de documento completado');
}

seedDocumentTypes()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

