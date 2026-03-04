import fetch from "node-fetch";

const token =
  "7608050af6462079b26e95b49bd71caa4c462bec7dd8befc245bcb1ef9e092e1";
const baseUrl = "http://localhost:4000";

console.log("🧪 Probando endpoint RSVP...\n");
console.log(`URL: ${baseUrl}/api/rsvp?token=${token}&action=confirm\n`);

try {
  const response = await fetch(
    `${baseUrl}/api/rsvp?token=${token}&action=confirm`,
  );

  console.log("📊 Status:", response.status);
  console.log("📋 Headers:", response.headers.get("content-type"));

  const html = await response.text();

  if (html.includes("¡Asistencia Confirmada!")) {
    console.log("\n✅ Página de confirmación cargada correctamente");
    console.log("   Contiene el título esperado");
  } else if (html.includes("Ya Respondiste")) {
    console.log("\n✅ Ya habías confirmado anteriormente");
  } else {
    console.log("\n❌ Respuesta inesperada");
    console.log("Primeros 500 caracteres:", html.substring(0, 500));
  }
} catch (error) {
  console.error("❌ Error:", error.message);
}
