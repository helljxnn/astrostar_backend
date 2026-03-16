import { EmployeeRepository } from "../repository/employees.repository.js";
import cloudinary from "../../../../services/shared/cloudinary.js";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export class SignatureService {
  constructor() {
    this.employeeRepository = new EmployeeRepository();
  }

  /**
   * Validate signature file
   */
  validateSignatureFile(file) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error("El archivo debe ser PNG o JPG.");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("El archivo no debe superar los 2MB.");
    }
  }

  /**
   * Upload signature for an employee
   */
  async uploadSignature(employeeId, file) {
    try {
      // 1. Validate file
      this.validateSignatureFile(file);

      // 2. Get employee and verify it exists
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el empleado con ID ${employeeId}.`,
        };
      }

      // 3. Verify employee has Administrator role
      const isAdmin = employee.user.role.name === "Administrador";
      if (!isAdmin) {
        return {
          success: false,
          statusCode: 403,
          message:
            "Solo los empleados con rol Administrador pueden tener firma.",
        };
      }

      // 4. Delete old signature if exists
      if (employee.signaturePublicId) {
        try {
          await cloudinary.uploader.destroy(employee.signaturePublicId);
        } catch (error) {
          console.error("Error deleting old signature from Cloudinary:", error);
          // Continue even if deletion fails
        }
      }

      // 5. Upload new signature to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "astrostar/signatures",
            resource_type: "image",
          },
          (error, uploaded) => {
            if (error) return reject(error);
            resolve(uploaded);
          },
        );
        stream.end(file.buffer);
      });

      // 6. Update employee with signature URLs
      const updatedEmployee = await this.employeeRepository.updateSignature(
        employeeId,
        result.secure_url,
        result.public_id,
      );

      return {
        success: true,
        data: {
          id: updatedEmployee.id,
          signatureUrl: updatedEmployee.signatureUrl,
          signaturePublicId: updatedEmployee.signaturePublicId,
        },
      };
    } catch (error) {
      console.error("Error in uploadSignature service:", error);
      throw error;
    }
  }

  /**
   * Delete signature for an employee
   */
  async deleteSignature(employeeId) {
    try {
      // 1. Get employee
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el empleado con ID ${employeeId}.`,
        };
      }

      // 2. Check if employee has signature
      if (!employee.signaturePublicId) {
        return {
          success: false,
          statusCode: 400,
          message: "El empleado no tiene firma registrada.",
        };
      }

      // 3. Delete from Cloudinary
      try {
        await cloudinary.uploader.destroy(employee.signaturePublicId);
      } catch (error) {
        console.error("Error deleting signature from Cloudinary:", error);
        // Continue even if deletion fails
      }

      // 4. Update employee (remove signature URLs)
      await this.employeeRepository.updateSignature(employeeId, null, null);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in deleteSignature service:", error);
      throw error;
    }
  }

  /**
   * Get all administrators with signatures (for donation responsible selection)
   */
  async getAdministratorsWithSignature() {
    try {
      const administrators =
        await this.employeeRepository.findAdministratorsWithSignature();

      return {
        success: true,
        data: administrators,
      };
    } catch (error) {
      console.error("Error in getAdministratorsWithSignature service:", error);
      throw error;
    }
  }
}

