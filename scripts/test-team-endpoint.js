import fetch from "node-fetch";

const teamId = 3;
const baseUrl = "http://localhost:4000";

console.log(`\n🧪 Probando endpoint GET /api/teams/${teamId}\n`);

try {
  const response = await fetch(`${baseUrl}/api/teams/${teamId}`);

  if (!response.ok) {
    console.error(`❌ Error: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const data = await response.json();

  console.log("📊 Respuesta del servidor:\n");
  console.log("Equipo:", data.data.nombre);
  console.log("Entrenador (campo coach):", data.data.coach || "Sin asignar");
  console.log("\nEntrenadorData:", data.data.entrenadorData);

  if (data.data.entrenadorData) {
    console.log("\n✅ El endpoint SÍ devuelve el entrenador:");
    console.log("   Nombre:", data.data.entrenadorData.name);
    console.log("   Tipo:", data.data.entrenadorData.type);
  } else {
    console.log("\n❌ El endpoint NO devuelve entrenadorData");
    console.log("\nMiembros del equipo:", data.data.members?.length || 0);
  }
} catch (error) {
  console.error("❌ Error:", error.message);
}
