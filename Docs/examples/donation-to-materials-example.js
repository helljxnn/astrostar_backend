/**
 * Ejemplo de uso: Convertir Donación a Materiales
 * 
 * Este script muestra cómo usar los endpoints para vincular
 * donaciones con el inventario de materiales.
 */

// ============================================
// 1. CREAR UNA DONACIÓN DE TIPO ESPECIE
// ============================================

const createDonation = async () => {
  const response = await fetch('http://localhost:3000/api/donations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      donorSponsorId: 1,
      type: 'ESPECIE',
      status: 'Recibida',
      program: 'Alimentación',
      donationAt: new Date().toISOString(),
      notes: 'Donación de alimentos no perecederos',
      details: [
        {
          kind: 'ESPECIE',
          recordType: 'Material',
          description: 'Arroz',
          quantity: 50
        },
        {
          kind: 'ESPECIE',
          recordType: 'Material',
          description: 'Frijoles',
          quantity: 30
        }
      ]
    })
  });

  const donation = await response.json();
  console.log('Donación creada:', donation);
  return donation.data.id;
};

// ============================================
// 2. CONVERTIR DONACIÓN A MATERIALES
// ============================================

const convertToMaterials = async (donationId) => {
  const response = await fetch(`http://localhost:3000/api/donations/${donationId}/convert-to-materials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      items: [
        {
          materialId: 1, // ID del material "Arroz" en el inventario
          cantidad: 50,
          inventarioDestino: 'FUNDACION',
          observaciones: 'Donación de arroz - 50kg'
        },
        {
          materialId: 2, // ID del material "Frijoles" en el inventario
          cantidad: 30,
          inventarioDestino: 'FUNDACION',
          observaciones: 'Donación de frijoles - 30kg'
        }
      ]
    })
  });

  const result = await response.json();
  console.log('Conversión completada:', result);
  
  if (result.data.failed > 0) {
    console.warn('Algunos items fallaron:', result.data.errors);
  }
  
  return result;
};

// ============================================
// 3. CONSULTAR MATERIALES DE LA DONACIÓN
// ============================================

const getMaterialsByDonation = async (donationId) => {
  const response = await fetch(`http://localhost:3000/api/donations/${donationId}/materials`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });

  const result = await response.json();
  console.log('Materiales vinculados:', result);
  
  // Mostrar resumen
  if (result.success) {
    console.log('\n=== RESUMEN ===');
    console.log(`Donación: ${result.data.donation.code}`);
    console.log(`Total de materiales: ${result.data.materials.length}`);
    
    result.data.materials.forEach(m => {
      console.log(`- ${m.materialNombre}: ${m.cantidad} ${m.material.unidadMedida}`);
      console.log(`  Stock anterior: ${m.stockAnterior} → Stock nuevo: ${m.stockNuevo}`);
    });
  }
  
  return result;
};

// ============================================
// 4. FLUJO COMPLETO
// ============================================

const fullExample = async () => {
  try {
    console.log('=== INICIANDO EJEMPLO COMPLETO ===\n');
    
    // Paso 1: Crear donación
    console.log('Paso 1: Creando donación...');
    const donationId = await createDonation();
    console.log(`✓ Donación creada con ID: ${donationId}\n`);
    
    // Paso 2: Convertir a materiales
    console.log('Paso 2: Convirtiendo donación a materiales...');
    const conversion = await convertToMaterials(donationId);
    console.log(`✓ Procesados: ${conversion.data.processed}, Fallidos: ${conversion.data.failed}\n`);
    
    // Paso 3: Consultar materiales
    console.log('Paso 3: Consultando materiales vinculados...');
    await getMaterialsByDonation(donationId);
    console.log('✓ Consulta completada\n');
    
    console.log('=== EJEMPLO COMPLETADO EXITOSAMENTE ===');
  } catch (error) {
    console.error('Error en el ejemplo:', error);
  }
};

// ============================================
// 5. EJEMPLO CON MANEJO DE ERRORES
// ============================================

const exampleWithErrorHandling = async () => {
  const donationId = 123;
  
  try {
    const response = await fetch(`http://localhost:3000/api/donations/${donationId}/convert-to-materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify({
        items: [
          {
            materialId: 1,
            cantidad: 50,
            inventarioDestino: 'FUNDACION'
          },
          {
            materialId: 999, // Material que no existe
            cantidad: 30,
            inventarioDestino: 'FUNDACION'
          }
        ]
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✓ Procesados exitosamente: ${result.data.processed}`);
      
      if (result.data.failed > 0) {
        console.warn(`⚠ Items con errores: ${result.data.failed}`);
        result.data.errors.forEach(err => {
          console.error(`  - Material ID ${err.item.materialId}: ${err.error}`);
        });
      }
      
      // Mostrar resultados exitosos
      result.data.results.forEach(r => {
        console.log(`  ✓ ${r.materialNombre}: ${r.cantidad} unidades (Movimiento #${r.movementId})`);
      });
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// ============================================
// EJECUTAR EJEMPLOS
// ============================================

// Descomentar para ejecutar:
// fullExample();
// exampleWithErrorHandling();

export {
  createDonation,
  convertToMaterials,
  getMaterialsByDonation,
  fullExample,
  exampleWithErrorHandling
};
