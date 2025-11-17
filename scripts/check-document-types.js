import prisma from '../src/config/database.js';

async function checkDocumentTypes() {
  try {
    const documentTypes = await prisma.documentType.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`\n📄 Tipos de documento en la base de datos: ${documentTypes.length}\n`);
    
    if (documentTypes.length === 0) {
      console.log('⚠️  No hay tipos de documento en la base de datos.');
      console.log('   Ejecute: npm run prisma:seed\n');
    } else {
      documentTypes.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.name}`);
        if (doc.description) {
          console.log(`   ${doc.description}`);
        }
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentTypes();
