import prisma from "../../../config/database.js";

export const paymentSettingsRepository = {
  /**
   * Obtener configuración de pagos (singleton)
   */
  async getSettings() {
    return await prisma.paymentSettings.findUnique({
      where: { id: 1 }
    });
  },

  /**
   * Actualizar configuración de pagos
   */
  async updateSettings(data) {
    return await prisma.paymentSettings.update({
      where: { id: 1 },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  },

  /**
   * Crear configuración inicial (solo si no existe)
   */
  async createInitialSettings() {
    const existing = await this.getSettings();
    if (existing) return existing;

    return await prisma.paymentSettings.create({
      data: {
        id: 1,
        monthlyAmount: 50000,      // Valor por defecto
        enrollmentAmount: 100000,  // Valor por defecto
        graceDays: 5               // Valor por defecto
      }
    });
  }
};