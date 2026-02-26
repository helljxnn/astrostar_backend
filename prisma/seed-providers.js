import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

async function seedProviders() {
  console.log("🌱 Iniciando seed de proveedores...");

  try {
    const providers = [
      // Empresas de alimentos y bebidas
      {
        entityType: "legal",
        businessName: "Productos Alimenticios Doria S.A.",
        nit: "890900608-1",
        mainContact: "Departamento Comercial",
        email: "comercial@doria.com.co",
        phone: "+57 1 4227000",
        address: "Calle 17 No. 69-46",
        city: "Bogotá",
        description:
          "Empresa colombiana líder en producción de pastas, galletas y alimentos",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Colombina S.A.",
        nit: "890399011-2",
        mainContact: "Gerencia Comercial",
        email: "ventas@colombina.com",
        phone: "+57 2 6640000",
        address: "Carrera 29 No. 2N-52",
        city: "Cali",
        description: "Fabricante de confites, dulces y alimentos",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Postobón S.A.",
        nit: "890903939-9",
        mainContact: "Área de Ventas",
        email: "contacto@postobon.com.co",
        phone: "+57 4 3605555",
        address: "Calle 50 No. 46-23",
        city: "Medellín",
        description: "Empresa de bebidas no alcohólicas",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Alpina Productos Alimenticios S.A.",
        nit: "860034120-9",
        mainContact: "Servicio al Cliente",
        email: "servicioalcliente@alpina.com.co",
        phone: "+57 1 4232222",
        address: "Km 3 Vía Briceño",
        city: "Sopó",
        description: "Empresa de productos lácteos y alimentos",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Pony Malta - Bavaria S.A.",
        nit: "860005224-4",
        mainContact: "Departamento Comercial",
        email: "contacto@ponymalta.com.co",
        phone: "+57 1 4136000",
        address: "Carrera 53A No. 127-35",
        city: "Bogotá",
        description: "Bebida de malta nutritiva",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Bimbo de Colombia S.A.",
        nit: "860028470-6",
        mainContact: "Ventas Institucionales",
        email: "ventascolombia@grupobimbo.com",
        phone: "+57 1 4237777",
        address: "Autopista Medellín Km 2.5",
        city: "Bogotá",
        description: "Productos de panadería y pastelería",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Meals de Colombia S.A.S.",
        nit: "900339906-3",
        mainContact: "Gerencia Comercial",
        email: "ventas@meals.com.co",
        phone: "+57 1 7441800",
        address: "Calle 93B No. 17-25",
        city: "Bogotá",
        description: "Alimentos y bebidas para eventos",
        status: "Active",
      },

      // Empresas de ropa deportiva y calzado
      {
        entityType: "legal",
        businessName: "Adidas Colombia S.A.S.",
        nit: "900123456-7",
        mainContact: "Ventas Corporativas",
        email: "colombia@adidas.com",
        phone: "+57 1 7449000",
        address: "Carrera 7 No. 71-21",
        city: "Bogotá",
        description: "Ropa y calzado deportivo",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Nike Colombia S.A.S.",
        nit: "900234567-8",
        mainContact: "Departamento B2B",
        email: "ventascolombia@nike.com",
        phone: "+57 1 6587000",
        address: "Calle 100 No. 19A-91",
        city: "Bogotá",
        description: "Equipamiento deportivo y calzado",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Puma Colombia S.A.S.",
        nit: "900345678-9",
        mainContact: "Ventas Institucionales",
        email: "colombia@puma.com",
        phone: "+57 1 7442200",
        address: "Carrera 15 No. 93-77",
        city: "Bogotá",
        description: "Ropa y accesorios deportivos",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Arturo Calle S.A.",
        nit: "890903407-9",
        mainContact: "Ventas Corporativas",
        email: "corporativo@arturocalle.com",
        phone: "+57 4 4448888",
        address: "Carrera 52 No. 47-42",
        city: "Medellín",
        description: "Confección de ropa deportiva y casual",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Deportes Regol S.A.S.",
        nit: "900456789-0",
        mainContact: "Gerencia Comercial",
        email: "ventas@deportesregol.com",
        phone: "+57 1 7443300",
        address: "Calle 53 No. 24-35",
        city: "Bogotá",
        description: "Distribución de artículos deportivos",
        status: "Active",
      },

      // Empresas de equipamiento deportivo
      {
        entityType: "legal",
        businessName: "Golty S.A.",
        nit: "860007538-5",
        mainContact: "Ventas Institucionales",
        email: "ventas@golty.com",
        phone: "+57 1 4227100",
        address: "Carrera 68D No. 17-11",
        city: "Bogotá",
        description: "Fabricante de balones y equipamiento deportivo",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Mikasa Colombia S.A.S.",
        nit: "900567890-1",
        mainContact: "Departamento Comercial",
        email: "colombia@mikasa.com",
        phone: "+57 1 6589900",
        address: "Calle 26 No. 69-76",
        city: "Bogotá",
        description: "Balones profesionales de voleibol y otros deportes",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Decathlon Colombia S.A.S.",
        nit: "900678901-2",
        mainContact: "Ventas B2B",
        email: "b2b.colombia@decathlon.com",
        phone: "+57 1 7445500",
        address: "Autopista Norte No. 232-35",
        city: "Bogotá",
        description: "Equipamiento deportivo multideporte",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Deportes Olímpicos S.A.S.",
        nit: "900789012-3",
        mainContact: "Gerencia de Ventas",
        email: "ventas@deportesolimpicos.com",
        phone: "+57 4 4449999",
        address: "Carrera 43A No. 1-50",
        city: "Medellín",
        description: "Distribución de implementos deportivos",
        status: "Active",
      },

      // Empresas de tecnología y sonido
      {
        entityType: "legal",
        businessName: "Alkomprar.com S.A.S.",
        nit: "900890123-4",
        mainContact: "Ventas Corporativas",
        email: "corporativo@alkomprar.com",
        phone: "+57 1 7446600",
        address: "Calle 72 No. 10-07",
        city: "Bogotá",
        description: "Equipos electrónicos y tecnología",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Ktronix S.A.S.",
        nit: "900901234-5",
        mainContact: "Ventas Empresariales",
        email: "empresas@ktronix.com",
        phone: "+57 1 7447700",
        address: "Carrera 30 No. 17-81",
        city: "Bogotá",
        description: "Tecnología y electrodomésticos",
        status: "Active",
      },

      // Empresas de mobiliario
      {
        entityType: "legal",
        businessName: "Muebles Jamar S.A.",
        nit: "890903123-7",
        mainContact: "Ventas Institucionales",
        email: "institucional@jamar.com.co",
        phone: "+57 5 3850000",
        address: "Calle 30 No. 8-49",
        city: "Barranquilla",
        description: "Mobiliario para eventos y oficinas",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Carpas y Toldos Colombia S.A.S.",
        nit: "901012345-6",
        mainContact: "Departamento Comercial",
        email: "ventas@carpascolombia.com",
        phone: "+57 1 7448800",
        address: "Calle 13 No. 68-98",
        city: "Bogotá",
        description: "Carpas, toldos y mobiliario para eventos",
        status: "Active",
      },

      // Empresas de hidratación y agua
      {
        entityType: "legal",
        businessName: "Agua Manantial S.A.",
        nit: "890904567-8",
        mainContact: "Servicio al Cliente",
        email: "ventas@aguamanantial.com.co",
        phone: "+57 1 4228900",
        address: "Km 7 Vía La Calera",
        city: "Bogotá",
        description: "Agua embotellada y dispensadores",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Gatorade Colombia - PepsiCo",
        nit: "860028335-1",
        mainContact: "Ventas Institucionales",
        email: "colombia@gatorade.com",
        phone: "+57 1 4136500",
        address: "Carrera 7 No. 76-35",
        city: "Bogotá",
        description: "Bebidas isotónicas y deportivas",
        status: "Active",
      },

      // Proveedores de servicios
      {
        entityType: "legal",
        businessName: "Eventos y Logística Total S.A.S.",
        nit: "901123456-7",
        mainContact: "Coordinación de Eventos",
        email: "info@eventostotal.com.co",
        phone: "+57 1 7449900",
        address: "Calle 85 No. 15-32",
        city: "Bogotá",
        description: "Logística y organización de eventos deportivos",
        status: "Active",
      },
      {
        entityType: "legal",
        businessName: "Impresiones Deportivas S.A.S.",
        nit: "901234567-8",
        mainContact: "Ventas",
        email: "ventas@impresionesdeportivas.com",
        phone: "+57 1 6580000",
        address: "Carrera 50 No. 12-34",
        city: "Bogotá",
        description: "Personalización de uniformes y material deportivo",
        status: "Active",
      },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const provider of providers) {
      try {
        const result = await prisma.provider.upsert({
          where: { nit: provider.nit },
          update: {
            businessName: provider.businessName,
            mainContact: provider.mainContact,
            email: provider.email,
            phone: provider.phone,
            address: provider.address,
            city: provider.city,
            description: provider.description,
            status: provider.status,
          },
          create: provider,
        });

        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          createdCount++;
          console.log(
            `  ✓ Proveedor creado: ${result.businessName} (${result.city})`,
          );
        } else {
          updatedCount++;
          console.log(`  ↻ Proveedor actualizado: ${result.businessName}`);
        }
      } catch (error) {
        console.error(
          `  ✗ Error con proveedor ${provider.businessName}:`,
          error.message,
        );
      }
    }

    console.log(`\n✅ Seed de proveedores completado!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Proveedores creados: ${createdCount}`);
    console.log(`   - Proveedores actualizados: ${updatedCount}`);
    console.log(`   - Total procesados: ${providers.length}`);
    console.log(
      `\n💡 Los proveedores están listos para registrar compras y movimientos de materiales.`,
    );
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedProviders().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
