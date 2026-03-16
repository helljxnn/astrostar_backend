/**
 * Genera un archivo iCalendar (.ics) para agregar evento al calendario
 * @param {Object} event - Datos del evento
 * @param {Object} invitation - Datos de la invitación
 * @returns {string} Contenido del archivo .ics
 */
export function generateICS(event, invitation) {
  // Combinar fecha y hora para crear Date completo
  const startDate = combineDateAndTime(event.startDate, event.startTime);
  const endDate = combineDateAndTime(event.endDate, event.endTime);

  // Formatear fechas en formato iCalendar (YYYYMMDDTHHMMSS)
  const formatICSDate = (date) => {
    const pad = (n) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AstroStar//Event Registration//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${invitation.token}@astrostar.com`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICSText(event.name)}`,
    `DESCRIPTION:${escapeICSText(event.description || "Evento deportivo")}`,
    `LOCATION:${escapeICSText(event.location)}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    `ORGANIZER;CN=AstroStar:mailto:${process.env.EMAIL_USER || "eventos@astrostar.com"}`,
    `ATTENDEE;CN=${escapeICSText(invitation.recipientName)};RSVP=TRUE:mailto:${invitation.recipientEmail}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio: Evento mañana",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

/**
 * Combina fecha y hora en un objeto Date
 * @param {Date|string} date - Fecha
 * @param {string} time - Hora en formato HH:MM
 * @returns {Date}
 */
function combineDateAndTime(date, time) {
  const d = new Date(date);
  const [hours, minutes] = time.split(":").map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Escapa caracteres especiales para formato iCalendar
 * @param {string} text - Texto a escapar
 * @returns {string}
 */
function escapeICSText(text) {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

