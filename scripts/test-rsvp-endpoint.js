import fetch from "node-fetch";

const token =
  "7608050af6462079b26e95b49bd71caa4c462bec7dd8befc245bcb1ef9e092e1";
const action = "confirm"; // o "decline"

const url = `http://localhost:4000/api/rsvp?token=${token}&action=${action}`;

console.log("\n🧪 Probando endpoint RSVP");
console.log("URL:", url);
console.log("");

try {
  const response = await fetch(url);

  console.log("Status:", response.status, response.statusText);
  console.log("Content-Type:", response.headers.get("content-type"));
  console.log("");

  const html = await response.text();

  // Extraer el título de la página
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : "Sin título";

  const h1Match = html.match(/<h1>(.*?)<\/h1>/);
  const h1 = h1Match ? h1Match[1] : "Sin h1";

  // Buscar el mensaje principal
  const messageMatch = html.match(/<p>(.*?)<\/p>/);
  const message = messageMatch ? messageMatch[1] : "Sin mensaje";

  console.log("📄 Respuesta HTML:");
  console.log("Título:", title);
  console.log("Encabezado:", h1);
  console.log("Mensaje:", message);

  if (response.status === 200) {
    console.log("\n✅ La respuesta fue exitosa");
  } else {
    console.log("\n⚠️ La respuesta indica un problema");
  }
} catch (error) {
  console.error("\n❌ Error:", error.message);
}
