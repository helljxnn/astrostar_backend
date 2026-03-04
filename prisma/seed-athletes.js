import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const athletesData = [
  { firstName: "Carlos", middleName: "Andrés", lastName: "Rodríguez", secondLastName: "Martínez", identification: "1001234567", email: "carlos.rodriguez@email.com", phoneNumber: "+57 310 2345678", address: "Calle 45 #23-15, Bogotá", birthDate: new Date("2008-03-15"), age: 16 },
  { firstName: "María", middleName: "Camila", lastName: "González", secondLastName: "López", identification: "1001234568", email: "maria.gonzalez@email.com", phoneNumber: "+57 311 3456789", address: "Carrera 30 #12-45, Medellín", birthDate: new Date("2009-07-22"), age: 15 },
  { firstName: "Juan", middleName: "Sebastián", lastName: "Pérez", secondLastName: "Ramírez", identification: "1001234569", email: "juan.perez@email.com", phoneNumber: "+57 312 4567890", address: "Avenida 6 #8-20, Cali", birthDate: new Date("2007-11-08"), age: 17 },
  { firstName: "Laura", middleName: "Valentina", lastName: "Hernández", secondLastName: "García", identification: "1001234570", email: "laura.hernandez@email.com", phoneNumber: "+57 313 5678901", address: "Calle 80 #50-30, Barranquilla", birthDate: new Date("2010-01-30"), age: 14 },
  { firstName: "Andrés", middleName: "Felipe", lastName: "Moreno", secondLastName: "Silva", identification: "1001234571", email: "andres.moreno@email.com", phoneNumber: "+57 314 6789012", address: "Carrera 15 #25-40, Cartagena", birthDate: new Date("2008-09-12"), age: 16 },
  { firstName: "Sofía", middleName: "Isabella", lastName: "Torres", secondLastName: "Vargas", identification: "1001234572", email: "sofia.torres@email.com", phoneNumber: "+57 315 7890123", address: "Calle 100 #15-25, Bogotá", birthDate: new Date("2009-05-18"), age: 15 },
  { firstName: "Diego", middleName: "Alejandro", lastName: "Ramírez", secondLastName: "Castro", identification: "1001234573", email: "diego.ramirez@email.com", phoneNumber: "+57 316 8901234", address: "Avenida 19 #30-50, Bucaramanga", birthDate: new Date("2007-12-05"), age: 17 },
  { firstName: "Valentina", middleName: "Andrea", lastName: "Jiménez", secondLastName: "Rojas", identification: "1001234574", email: "valentina.jimenez@email.com", phoneNumber: "+57 317 9012345", address: "Carrera 50 #40-20, Pereira", birthDate: new Date("2010-04-25"), age: 14 },
  { firstName: "Santiago", middleName: "David", lastName: "Muñoz", secondLastName: "Ortiz", identification: "1001234575", email: "santiago.munoz@email.com", phoneNumber: "+57 318 0123456", address: "Calle 70 #35-15, Manizales", birthDate: new Date("2008-08-14"), age: 16 },
  { firstName: "Isabella", middleName: "Lucía", lastName: "Sánchez", secondLastName: "Mendoza", identification: "1001234576", email: "isabella.sanchez@email.com", phoneNumber: "+57 319 1234567", address: "Avenida 5 #20-30, Cúcuta", birthDate: new Date("2009-02-28"), age: 15 },
  { firstName: "Mateo", middleName: "Nicolás", lastName: "Díaz", secondLastName: "Herrera", identification: "1001234577", email: "mateo.diaz@email.com", phoneNumber: "+57 320 2345678", address: "Carrera 25 #45-10, Ibagué", birthDate: new Date("2007-06-19"), age: 17 },
  { firstName: "Mariana", middleName: "Alejandra", lastName: "Ruiz", secondLastName: "Parra", identification: "1001234578", email: "mariana.ruiz@email.com", phoneNumber: "+57 321 3456789", address: "Calle 55 #18-25, Santa Marta", birthDate: new Date("2010-10-07"), age: 14 },
  { firstName: "Samuel", middleName: "Esteban", lastName: "Gómez", secondLastName: "Ríos", identification: "1001234579", email: "samuel.gomez@email.com", phoneNumber: "+57 322 4567890", address: "Avenida 10 #30-40, Villavicencio", birthDate: new Date("2008-04-03"), age: 16 },
  { firstName: "Gabriela", middleName: "Natalia", lastName: "Vega", secondLastName: "Salazar", identification: "1001234580", email: "gabriela.vega@email.com", phoneNumber: "+57 323 5678901", address: "Carrera 40 #22-35, Pasto", birthDate: new Date("2009-12-16"), age: 15 },
  { firstName: "Nicolás", middleName: "Matías", lastName: "Castillo", secondLastName: "Mejía", identification: "1001234581", email: "nicolas.castillo@email.com", phoneNumber: "+57 324 6789012", address: "Calle 90 #28-50, Neiva", birthDate: new Date("2007-09-21"), age: 17 }
];

async function main() {
  console.log("🏃 Iniciando seed de deportistas...\n");

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

  console.log("\n📝 Inscribiendo a categorías...");
  const categories = await prisma.sportsCategory.findMany({ where: { nombre: { in: ["Infantil", "PreJuvenil", "Juvenil"] } } });
  const athletes = await prisma.athlete.findMany({ include: { user: true } });
  let inscriptionCount = 0;

  for (const athlete of athletes) {
    const eligibleCategories = categories.filter(cat => athlete.user.age >= cat.edadMinima && athlete.user.age <= cat.edadMaxima);
    
    for (const category of eligibleCategories) {
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

  console.log(`\n🎉 Completado!`);
  console.log(`   • Deportistas: ${createdCount}/${athletesData.length}`);
  console.log(`   • Inscripciones: ${inscriptionCount}`);
  console.log(`   • Contraseña: Deportista123*`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
