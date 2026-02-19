/**
 * Formatea una fecha para mostrar en emails
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "Sábado, 15 de Marzo de 2025")
 */
export function formatEventDate(date) {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const d = new Date(date);
  const dayName = days[d.getDay()];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${dayName}, ${day} de ${month} de ${year}`;
}

/**
 * Formatea un rango de horas
 * @param {string} startTime - Hora de inicio (formato HH:MM)
 * @param {string} endTime - Hora de fin (formato HH:MM)
 * @returns {string} Rango formateado (ej: "10:00 AM - 2:00 PM")
 */
export function formatEventTime(startTime, endTime) {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}
