import { PrismaClient } from "../../generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Deportistas organizados por categoría (cada uno en UNA sola categoría)
const athletesData = [
  // CATEGORÍA INFANTIL (10-12 años) - 5 deportistas
  { firstName: "Laura", middleName: "Valentina", lastName: "Hernández", secondLastName: "García", identification: "1001234570", email: "laura.hernandez@email.com", phoneNumber: "+57 313 5678901", address: "Calle 80 #50-30, Barranquilla", birthDate: new Date("2012-01-30"), age: 12 },
  { firstName: "Valentina", middleName: "Andrea", lastName: "Jiménez", secondLastName: "Rojas", identification: "1001234574", email: "valentina.jimenez@email.com", phoneNumber: "+57 317 9012345", address: "Carrera 50 #40-20, Pereira", birthDate: new Date("2013-04-25"), age: 11 },
  { firstName: "Mariana", middleName: "Alejandra", lastName: "Ruiz", secondLastName: "Parra", identification: "1001234578", email: "mariana.ruiz@email.com", phoneNumber: "+57 321 3456789", address: "Calle 55 #18-25, Santa Marta", birthDate: new Date("2014-10-07"), age: 10 },
  { firstName: "Camilo", middleName: "Andrés", lastName: "Vargas", secondLastName: "Soto", identification: "1001234582", email: "camilo.vargas@email.com", phoneNumber: "+57 325 1234567", address: "Avenida 12 #34-56, Armenia", birthDate: new Date("2012-06-15"), age: 12 },
  { firstName: "Daniela", middleName: "María", lastName: "Ospina", secondLastName: "Cruz", identification: "1001234583", email: "daniela.ospina@email.com", phoneNumber: "+57 326 2345678", address: "Calle 23 #45-67, Popayán", birthDate: new Date("2013-09-20"), age: 11 },
  
  // CATEGORÍA PREJUVENIL (13-15 años) - 5 deportistas
  { firstName: "María", middleName: "Camila", lastName: "González", secondLastName: "López", identification: "1001234568", email: "maria.gonzalez@email.com", phoneNumber: "+57 311 3456789", address: "Carrera 30 #12-45, Medellín", birthDate: new Date("2010-07-22"), age: 14 },
  { firstName: "Sofía", middleName: "Isabella", lastName: "Torres", secondLastName: "Vargas", identification: "1001234572", email: "sofia.torres@email.com", phoneNumber: "+57 315 7890123", address: "Calle 100 #15-25, Bogotá", birthDate: new Date("2010-05-18"), age: 14 },
  { firstName: "Isabella", middleName: "Lucía", lastName: "Sánchez", secondLastName: "Mendoza", identification: "1001234576", email: "isabella.sanchez@email.com", phoneNumber: "+57 319 1234567", address: "Avenida 5 #20-30, Cúcuta", birthDate: new Date("2010-02-28"), age: 14 },
  { firstName: "Gabriela", middleName: "Natalia", lastName: "Vega", secondLastName: "Salazar", identification: "1001234580", email: "gabriela.vega@email.com", phoneNumber: "+57 323 5678901", address: "Carrera 40 #22-35, Pasto", birthDate: new Date("2009-12-16"), age: 15 },
  { firstName: "Alejandro", middleName: "José", lastName: "Morales", secondLastName: "Ríos", identification: "1001234584", email: "alejandro.morales@email.com", phoneNumber: "+57 327 3456789", address: "Calle 67 #89-12, Tunja", birthDate: new Date("2011-03-10"), age: 13 },
  
  // CATEGORÍA JUVENIL (16-18 años) - 5 deportistas
  { firstName: "Carlos", middleName: "Andrés", lastName: "Rodríguez", secondLastName: "Martínez", identification: "1001234567", email: "carlos.rodriguez@email.com", phoneNumber: "+57 310 2345678", address: "Calle 45 #23-15, Bogotá", birthDate: new Date("2008-03-15"), age: 16 },
  { firstName: "Juan", middleName: "Sebastián", lastName: "Pérez", secondLastName: "Ramírez", identification: "1001234569", email: "juan.perez@email.com", phoneNumber: "+57 312 4567890", address: "Avenida 6 #8-20, Cali", birthDate: new Date("2007-11-08"), age: 17 },
  { firstName: "Andrés", middleName: "Felipe", lastName: "Moreno", secondLastName: "Silva", identification: "1001234571", email: "andres.moreno@email.com", phoneNumber: "+57 314 6789012", address: "Carrera 15 #25-40, Cartagena", birthDate: new Date("2008-09-12"), age: 16 },
  { firstName: "Diego", middleName: "Alejandro", lastName: "Ramírez", secondLastName: "Castro", identification: "1001234573", email: "diego.ramirez@email.com", phoneNumber: "+57 316 8901234", address: "Avenida 19 #30-50, Bucaramanga", birthDate: new Date("2007-12-05"), age: 17 },
  { firstName: "Santiago", middleName: "David", lastName: "Muñoz", secondLastName: "Ortiz", identification: "1001234575", email: "santiago.munoz@email.com", phoneNumber: "+57 318 0123456", address: "Calle 70 #35-15, Manizales", birthDate: new Date("2008-08-14"), age: 16 }
];

async function main() {
  console.log("🏃 Iniciando seed de deportistas...\n");

  // Limpiar inscripciones antiguas primero
  console.log("🧹 Limpiando inscripciones antiguas...");
  await prisma.inscription.deleteMany({});
  
  // Actualizar categorías existentes con rangos correctos
  console.log("✨ Actualizando categorías deportivas...");
  
  // Eliminar duplicados manteniendo solo uno de cada
  const allCategories = await prisma.sportsCategory.findMany({
    where: { nombre: { in: ["Infantil", "PreJuvenil", "Juvenil"] } },
    orderBy: { id: 'asc' }
  });
  
  // Agrupar por nombre y mantener solo el primero
  const categoriesToKeep = {};
  const categoriesToDelete = [];
  
  allCategories.forEach(cat => {
    if (!categoriesToKeep[cat.nombre]) {
      categoriesToKeep[cat.nombre] = cat.id;
    } else {
      categoriesToDelete.push(cat.id);
    }
  });
  
  // Eliminar duplicados
  if (categoriesToDelete.length > 0) {
    await prisma.sportsCategory.deleteMany({
      where: { id: { in: categoriesToDelete } }
    });
  }
  
  // Actualizar las categorías que quedaron con los rangos correctos
  await prisma.sportsCategory.updateMany({
    where: { nombre: "Infantil" },
    data: { edadMinima: 10, edadMaxima: 12, descripcion: "Categoría infantil para niños de 10 a 12 años" }
  });
  
  await prisma.sportsCategory.updateMany({
    where: { nombre: "PreJuvenil" },
    data: { edadMinima: 13, edadMaxima: 15, descripcion: "Categoría prejuvenil para adolescentes de 13 a 15 años" }
  });
  
  await prisma.sportsCategory.updateMany({
    where: { nombre: "Juvenil" },
    data: { edadMinima: 16, edadMaxima: 18, descripcion: "Categoría juvenil para jóvenes de 16 a 18 años" }
  });
  
  console.log("   ✓ Categorías actualizadas correctamente\n");

  const documentType = await prisma.documentType.findFirst({ where: { name: "Tarjeta de Identidad" } });
  if (!documentType) {
    console.error("❌ Error: No se encontró el tipo de documento 'Tarjeta de Identidad'");
    return;
  }

  let athleteRole = await prisma.role.findFirst({ where: { name: "Deportista" } });
  if (!athleteRole) {
    athleteRole = await prisma.role.create({
      data: { name: "Deportista", description: "Rol para deportistas", permissions: { dashboard: { Ver: true }, athletesSection: { Ver: true } } }
    });
  }

  console.log("🧹 Limpiando deportistas de prueba...");
  const testEmails = athletesData.map(a => a.email);
  await prisma.athlete.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  console.log("👥 Creando deportistas...");
  const hashedPassword = await bcrypt.hash("Deportista123*", 10);
  let createdCount = 0;

  for (const athleteData of athletesData) {
    try {
      await prisma.user.create({
        data: {
          ...athleteData,
          documentTypeId: documentType.id,
          passwordHash: hashedPassword,
          roleId: athleteRole.id,
          status: "Active",
          athlete: { create: { status: "Active" } }
        }
      });
      createdCount++;
      console.log(`   ✓ ${athleteData.firstName} ${athleteData.lastName}`);
    } catch (error) {
      console.error(`   ✗ Error: ${athleteData.firstName}`);
    }
  }

  console.log("\n📝 Inscribiendo a categorías (una por deportista)...");
  const categories = await prisma.sportsCategory.findMany({ where: { nombre: { in: ["Infantil", "PreJuvenil", "Juvenil"] } } });
  
  console.log("\n🔍 Categorías encontradas:");
  categories.forEach(cat => {
    console.log(`   • ${cat.nombre}: ${cat.edadMinima}-${cat.edadMaxima} años`);
  });
  console.log("");
  
  const athletes = await prisma.athlete.findMany({ include: { user: true } });
  let inscriptionCount = 0;

  for (const athlete of athletes) {
    // Encontrar la categoría que corresponde a la edad del deportista
    const eligibleCategories = categories.filter(cat => athlete.user.age >= cat.edadMinima && athlete.user.age <= cat.edadMaxima);
    
    // Inscribir solo en UNA categoría (la primera que coincida)
    if (eligibleCategories.length > 0) {
      const category = eligibleCategories[0];
      
      try {
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        
        await prisma.inscription.create({
          data: {
            athleteId: athlete.id,
            sportsCategoryId: category.id,
            type: "initial_inscription",
            status: "Active",
            inscriptionDate: new Date(),
            conceptDate: new Date(),
            expirationDate,
            concept: `Inscripción a ${category.nombre}`
          }
        });
        inscriptionCount++;
        console.log(`   ✓ ${athlete.user.firstName} ${athlete.user.lastName} → ${category.nombre}`);
      } catch (error) {
        if (!error.message.includes('Unique')) {
          console.error(`   ✗ Error inscribiendo ${athlete.user.firstName}`);
        }
      }
    }
  }

  // Contar deportistas por categoría
  const infantilCount = athletes.filter(a => a.user.age >= 10 && a.user.age <= 12).length;
  const prejuvenilCount = athletes.filter(a => a.user.age >= 13 && a.user.age <= 15).length;
  const juvenilCount = athletes.filter(a => a.user.age >= 16 && a.user.age <= 18).length;

  console.log(`\n🎉 Completado!`);
  console.log(`   • Deportistas creados: ${createdCount}/${athletesData.length}`);
  console.log(`   • Inscripciones: ${inscriptionCount}`);
  console.log(`\n📊 Distribución por categoría:`);
  console.log(`   • Infantil (10-12 años): ${infantilCount} deportistas`);
  console.log(`   • PreJuvenil (13-15 años): ${prejuvenilCount} deportistas`);
  console.log(`   • Juvenil (16-18 años): ${juvenilCount} deportistas`);
  console.log(`\n🔑 Contraseña para todos: Deportista123*`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

