#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to fix UTF-8 encoding issues and remove duplicate methods in emailService.js
"""

import re

# Read the file
with open('src/services/emailService.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and remove all duplicate generateScheduleNotificationTemplate and generateScheduleNotificationText methods
# Keep only formatScheduleDate, formatScheduleRecurrence, and sendAppointmentNotification

# Pattern to find the problematic section (from after formatScheduleRecurrence to before the next major method)
# We'll look for the pattern and replace it with clean versions

# Find the position after formatScheduleRecurrence
pattern_start = r'(formatScheduleRecurrence\(recurrence = "no"\) \{[^}]+\})\s*\n\s*\n'

# Find where generateAthleteWelcomeEmailTemplate starts
pattern_end = r'\s*/\*\*\s*\n\s*\* Generar template HTML para email de bienvenida de deportista'

# Extract the section between these two patterns
match_start = re.search(pattern_start, content)
match_end = re.search(pattern_end, content)

if match_start and match_end:
    start_pos = match_start.end()
    end_pos = match_end.start()
    
    # Create the clean replacement section
    clean_section = '''
  /**
   * Notificar al deportista que se creó una cita
   */
  async sendAppointmentNotification({ to, athleteName, date, time, specialistName }) {
    if (!to) {
      return { success: false, message: "Correo destinatario no definido" };
    }

    const ready = await this.ensureTransporter();
    if (!ready.ok) {
      console.warn("⚠️  Notificación de cita no enviada:", ready.reason);
      return { success: false, error: ready.reason };
    }

    const subject = "Nueva cita programada";
    const plainText = `Hola ${athleteName || "deportista"}, se programó una cita para el ${date} a las ${time}${
      specialistName ? ` con ${specialistName}` : ""
    }. Ingresa al módulo de citas para más detalles.`;

    const html = `
      <p>Hola ${athleteName || "deportista"},</p>
      <p>Se programó una cita para el <strong>${date}</strong> a las <strong>${time}</strong>${
        specialistName ? ` con <strong>${specialistName}</strong>` : ""
      }.</p>
      <p>Por favor ingresa al módulo de citas para más detalles.</p>
    `;

    const mailOptions = {
      from: {
        name: "AstroStar - Sistema de Gestión",
        address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
      },
      to,
      subject,
      text: plainText,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.warn("⚠️  Error enviando notificación de cita:", error.message);
      return { success: false, error: error.message };
    }
  }

  formatScheduleDate(date) {
    if (!date) return "";
    const parsed = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

'''
    
    # Replace the problematic section
    new_content = content[:start_pos] + clean_section + content[end_pos:]
    
    # Write the fixed content
    with open('src/services/emailService.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ File fixed successfully!")
    print(f"Removed {end_pos - start_pos} characters of duplicate/corrupted code")
else:
    print("❌ Could not find the patterns to fix")
    if not match_start:
        print("  - Could not find formatScheduleRecurrence")
    if not match_end:
        print("  - Could not find generateAthleteWelcomeEmailTemplate")
