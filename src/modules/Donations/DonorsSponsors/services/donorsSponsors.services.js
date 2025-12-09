import { DonorsSponsorsRepository } from "../repository/donorsSponsors.repository.js";

export class DonorsSponsorsService {
  constructor() {
    this.donorsSponsorsRepository = new DonorsSponsorsRepository();
  }

  getIdentificationValue(payload = {}) {
    return (
      payload.identificacion ||
      payload.nit ||
      payload.numeroDocumento ||
      ""
    ).trim();
  }

  async getAll(params) {
    try {
      const result = await this.donorsSponsorsRepository.findAll(params);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in DonorsSponsorsService.getAll:", error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const record = await this.donorsSponsorsRepository.findById(id);
      if (!record) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontr\u00f3 el registro con ID ${id}.`,
        };
      }

      return { success: true, data: record };
    } catch (error) {
      console.error("Error in DonorsSponsorsService.getById:", error);
      throw error;
    }
  }

  async ensureUnique(payload, excludeId = null) {
    const identification = this.getIdentificationValue(payload);

    if (identification) {
      const existingById =
        await this.donorsSponsorsRepository.findByIdentification(
          identification,
          excludeId
        );
      if (existingById) {
        throw new Error(
          `La identificaci\u00f3n "${identification}" ya est\u00e1 registrada.`
        );
      }
    }

    if (payload.correo) {
      const existingByEmail = await this.donorsSponsorsRepository.findByEmail(
        payload.correo,
        excludeId
      );
      if (existingByEmail) {
        throw new Error(`El correo "${payload.correo}" ya est\u00e1 registrado.`);
      }
    }
  }

  async create(payload) {
    try {
      await this.ensureUnique(payload);
      const created = await this.donorsSponsorsRepository.create(payload);

      return {
        success: true,
        data: created,
        message: `${created.tipo} "${created.nombre}" creado exitosamente.`,
      };
    } catch (error) {
      console.error("Error in DonorsSponsorsService.create:", error);
      throw error;
    }
  }

  async update(id, payload) {
    try {
      const existing = await this.donorsSponsorsRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontr\u00f3 el registro con ID ${id}.`,
        };
      }

      await this.ensureUnique(payload, id);
      const updated = await this.donorsSponsorsRepository.update(id, payload);

      return {
        success: true,
        data: updated,
        message: `${updated.tipo} "${updated.nombre}" actualizado exitosamente.`,
      };
    } catch (error) {
      console.error("Error in DonorsSponsorsService.update:", error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const existing = await this.donorsSponsorsRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontr\u00f3 el registro con ID ${id}.`,
        };
      }

      const deleted = await this.donorsSponsorsRepository.delete(id);
      return {
        success: true,
        message: `${deleted.tipo} "${deleted.nombre}" eliminado exitosamente.`,
      };
    } catch (error) {
      console.error("Error in DonorsSponsorsService.delete:", error);

      if (error.message?.includes("asociado a eventos")) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }

      throw error;
    }
  }

  async changeStatus(id, status) {
    try {
      const existing = await this.donorsSponsorsRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontr\u00f3 el registro con ID ${id}.`,
        };
      }

      const updated = await this.donorsSponsorsRepository.changeStatus(
        id,
        status
      );

      return {
        success: true,
        data: updated,
        message: `Estado actualizado a "${status}".`,
      };
    } catch (error) {
      console.error("Error in DonorsSponsorsService.changeStatus:", error);
      throw error;
    }
  }

  async checkIdentificationAvailability(identification, excludeId = null) {
    try {
      const existing =
        await this.donorsSponsorsRepository.findByIdentification(
          identification,
          excludeId
        );

      if (!existing) return { available: true };

      return {
        available: false,
        message: `La identificaci\u00f3n "${identification}" ya est\u00e1 registrada.`,
      };
    } catch (error) {
      console.error(
        "Error in DonorsSponsorsService.checkIdentificationAvailability:",
        error
      );
      throw error;
    }
  }

  async checkEmailAvailability(email, excludeId = null) {
    try {
      const existing = await this.donorsSponsorsRepository.findByEmail(
        email,
        excludeId
      );

      if (!existing) return { available: true };

      return {
        available: false,
        message: `El correo "${email}" ya est\u00e1 registrado.`,
      };
    } catch (error) {
      console.error(
        "Error in DonorsSponsorsService.checkEmailAvailability:",
        error
      );
      throw error;
    }
  }

  async getStats() {
    try {
      const stats = await this.donorsSponsorsRepository.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error("Error in DonorsSponsorsService.getStats:", error);
      throw error;
    }
  }

  async getReferenceData() {
    try {
      const data = await this.donorsSponsorsRepository.getReferenceData();
      return { success: true, data };
    } catch (error) {
      console.error(
        "Error in DonorsSponsorsService.getReferenceData:",
        error
      );
      throw error;
    }
  }
}

export default new DonorsSponsorsService();
