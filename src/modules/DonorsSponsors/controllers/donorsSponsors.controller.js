import prisma from "../../../config/database.js";

export class DonorSponsorController {
  /**
   * Method to create a new donor or sponsor.
   */
  Create = async (req, res) => {
    try {
      const { identification, name, type, personType, phone, email, contactPerson, address } = req.body;

      // Validate required fields
      if (!identification || !name || !type || !personType || !phone || !email) {
        return res.status(400).json({
          success: false,
          message: "Fields identification, name, type, personType, phone, and email are required.",
        });
      }

      const newDonorSponsor = await prisma.donorSponsor.create({
        data: {
          identification,
          name,
          type,
          personType,
          phone,
          email,
          contactPerson,
          address,
          // 'status' defaults to 'Active' as per the schema
        },
      });

      res.status(201).json({
        success: true,
        message: "Donor/Sponsor created successfully.",
        data: newDonorSponsor,
      });
    } catch (error) {
      console.error("Error creating donor/sponsor:", error);
      if (error.code === "P2002") {
        const field = error.meta.target.includes('identification') ? 'identification' : 'email';
        return res.status(400).json({
          success: false,
          message: `A record with this ${field} already exists.`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again.",
      });
    }
  };

  /**
   * Method to get all records with pagination and search.
   */
  GetAll = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { identification: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [records, total] = await prisma.$transaction([
        prisma.donorSponsor.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { id: "desc" },
        }),
        prisma.donorSponsor.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        message: `Found ${records.length} of ${total} records.`,
        data: records,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching records:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  /**
   * Method to get a single record by its ID.
   */
  GetById = async (req, res) => {
    try {
      const { id } = req.params;
      const record = await prisma.donorSponsor.findUnique({
        where: { id: parseInt(id) },
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: `Record with ID ${id} not found.`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Record found.",
        data: record,
      });
    } catch (error) {
      console.error("Error fetching record by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  /**
   * Method to update an existing record.
   */
  Update = async (req, res) => {
    try {
      const { id } = req.params;
      const dataToUpdate = req.body;

      const updatedRecord = await prisma.donorSponsor.update({
        where: { id: parseInt(id) },
        data: dataToUpdate,
      });

      res.status(200).json({
        success: true,
        message: "Record updated successfully.",
        data: updatedRecord,
      });
    } catch (error) {
      console.error("Error updating record:", error);
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: `Record with ID ${req.params.id} not found.`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  /**
   * Method to delete a record.
   */
  Delete = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the record has associated donations
      const record = await prisma.donorSponsor.findUnique({
        where: { id: parseInt(id) },
        include: { donations: true },
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: `Record with ID ${id} not found.`,
        });
      }

      if (record.donations && record.donations.length > 0) {
        return res.status(400).json({
          success: false,
          message: "This record cannot be deleted because it has associated donations. Please remove those associations first.",
        });
      }

      await prisma.donorSponsor.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({
        success: true,
        message: "Record deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting record:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };
}
