/**
 * SEED DE DATOS DE PRUEBA - MÓDULO DE INSCRIPCIONES
 * 
 * Este script inserta datos de prueba para el módulo de inscripciones:
 * - Categorías de eventos (Deportivo, Recreativo)
 * - Tipos de eventos (Torneo, Festival)
 * - 3 eventos de prueba
 * - 5 equipos de la fundación
 * - 4 equipos temporales
 * 
 * Ejecutar: node src/modules/Events/Registrations/run-seed.js
 */

import prisma from '../../../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  try {
    console.log('🌱 Iniciando seed de inscripciones...\n');

    // 1. Insertar categorías de eventos
    console.log('📁 Insertando categorías de eventos...');
    await prisma.eventCategory.upsert({
      where: { name: 'Deportivo' },
      update: {},
      create: {
        name: 'Deportivo',
        description: 'Eventos relacionados con deportes',
      },
    });

    await prisma.eventCategory.upsert({
      where: { name: 'Recreativo' },
      update: {},
      create: {
        name: 'Recreativo',
        description: 'Eventos recreativos y de integración',
      },
    });
    console.log('✅ Categorías de eventos insertadas\n');

    // 2. Insertar tipos de eventos
    console.log('📁 Insertando tipos de eventos...');
    
    let torneoType = await prisma.serviceType.findFirst({
      where: { name: 'Torneo' },
    });
    if (!torneoType) {
      torneoType = await prisma.serviceType.create({
        data: {
          name: 'Torneo',
          description: 'Competencia deportiva',
        },
      });
    }

    let festivalType = await prisma.serviceType.findFirst({
      where: { name: 'Festival' },
    });
    if (!festivalType) {
      festivalType = await prisma.serviceType.create({
        data: {
          name: 'Festival',
          description: 'Festival deportivo con múltiples actividades',
        },
      });
    }
    
    console.log('✅ Tipos de eventos insertados\n');

    // 3. Obtener categoría deportiva
    const deportivoCategory = await prisma.eventCategory.findUnique({
      where: { name: 'Deportivo' },
    });

    // 4. Insertar eventos
    console.log('📅 Insertando eventos de prueba...');
    
    const events = [
      {
        name: 'Torneo de Fútbol Juvenil 2025',
        description: 'Torneo de fútbol para categorías juveniles',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-15'),
        startTime: '08:00',
        endTime: '18:00',
        location: 'Estadio Municipal',
        phone: '+57 300 1234567',
        status: 'Programado',
        publish: true,
        categoryId: deportivoCategory.id,
        typeId: torneoType.id,
      },
      {
        name: 'Festival Deportivo Astrostar 2025',
        description: 'Festival anual con múltiples disciplinas deportivas',
        startDate: new Date('2025-12-20'),
        endDate: new Date('2025-12-22'),
        startTime: '09:00',
        endTime: '19:00',
        location: 'Complejo Deportivo Central',
        phone: '+57 300 7654321',
        status: 'Programado',
        publish: true,
        categoryId: deportivoCategory.id,
        typeId: festivalType.id,
      },
      {
        name: 'Copa Navideña 2025',
        description: 'Torneo especial de fin de año',
        startDate: new Date('2025-12-26'),
        endDate: new Date('2025-12-30'),
        startTime: '10:00',
        endTime: '17:00',
        location: 'Polideportivo Norte',
        phone: '+57 300 9876543',
        status: 'Programado',
        publish: true,
        categoryId: deportivoCategory.id,
        typeId: torneoType.id,
      },
    ];

    for (const event of events) {
      const existing = await prisma.service.findFirst({
        where: { name: event.name },
      });
      if (!existing) {
        await prisma.service.create({ data: event });
      }
    }

    console.log('✅ Eventos insertados\n');

    // 5. Insertar equipos de la fundación
    console.log('👥 Insertando equipos de la fundación...');
    
    const foundationTeams = [
      {
        name: 'Tigres FC',
        description: 'Equipo de fútbol juvenil categoría sub-17',
        coach: 'Carlos Rodríguez',
        category: 'Sub-17',
        teamType: 'Fundacion',
      },
      {
        name: 'Águilas Doradas',
        description: 'Equipo de fútbol categoría sub-15',
        coach: 'María González',
        category: 'Sub-15',
        teamType: 'Fundacion',
      },
      {
        name: 'Leones del Norte',
        description: 'Equipo de fútbol categoría sub-19',
        coach: 'Juan Pérez',
        category: 'Sub-19',
        teamType: 'Fundacion',
      },
      {
        name: 'Halcones FC',
        description: 'Equipo de fútbol categoría sub-13',
        coach: 'Ana Martínez',
        category: 'Sub-13',
        teamType: 'Fundacion',
      },
      {
        name: 'Pumas Astrostar',
        description: 'Equipo de fútbol categoría sub-17',
        coach: 'Luis Hernández',
        category: 'Sub-17',
        teamType: 'Fundacion',
      },
    ];

    for (const team of foundationTeams) {
      const existing = await prisma.team.findFirst({
        where: { name: team.name },
      });
      if (!existing) {
        await prisma.team.create({ data: team });
      }
    }

    console.log('✅ Equipos de la fundación insertados\n');

    // 6. Insertar equipos temporales
    console.log('⏱️  Insertando equipos temporales...');
    
    const temporaryTeams = [
      {
        name: 'Estrellas del Sur',
        description: 'Equipo temporal para torneo navideño',
        coach: 'Roberto Sánchez',
        category: 'Sub-15',
        teamType: 'Temporal',
      },
      {
        name: 'Relámpagos FC',
        description: 'Equipo temporal formado para festival deportivo',
        coach: 'Diana Torres',
        category: 'Sub-17',
        teamType: 'Temporal',
      },
      {
        name: 'Cóndores Unidos',
        description: 'Equipo temporal categoría sub-19',
        coach: 'Miguel Ángel Castro',
        category: 'Sub-19',
        teamType: 'Temporal',
      },
      {
        name: 'Dragones FC',
        description: 'Equipo temporal para copa de verano',
        coach: 'Patricia Ramírez',
        category: 'Sub-13',
        teamType: 'Temporal',
      },
    ];

    for (const team of temporaryTeams) {
      const existing = await prisma.team.findFirst({
        where: { name: team.name },
      });
      if (!existing) {
        await prisma.team.create({ data: team });
      }
    }

    console.log('✅ Equipos temporales insertados\n');

    // 7. Mostrar resumen
    console.log('📊 Resumen de datos insertados:');
    
    const totalEvents = await prisma.service.count({
      where: { status: 'Programado' },
    });
    
    const totalFoundationTeams = await prisma.team.count({
      where: { teamType: 'Fundacion', status: 'Active' },
    });
    
    const totalTemporaryTeams = await prisma.team.count({
      where: { teamType: 'Temporal', status: 'Active' },
    });

    console.log(`   - Eventos programados: ${totalEvents}`);
    console.log(`   - Equipos de la fundación: ${totalFoundationTeams}`);
    console.log(`   - Equipos temporales: ${totalTemporaryTeams}`);
    console.log(`   - Total de equipos: ${totalFoundationTeams + totalTemporaryTeams}\n`);

    console.log('✅ Seed completado exitosamente!');
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();
