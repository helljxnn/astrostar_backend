import PDFDocument from "pdfkit";
import https from "https";

const FOUNDATION_NAME = "FUNDACIÓN MANUELA VANÉGAS";
const FOUNDATION_NIT = "901744684";

export class CertificateService {
  /**
   * Download image from URL
   */
  async downloadImage(url) {
    return new Promise((resolve, reject) => {
      https
        .get(url, (response) => {
          const chunks = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => resolve(Buffer.concat(chunks)));
          response.on("error", reject);
        })
        .on("error", reject);
    });
  }

  /**
   * Generate donation certificate PDF
   */
  async generateCertificate(donation) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "LETTER",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers = [];
        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        // Header
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("CERTIFICADO DE DONACIÓN", {
            align: "center",
          });
        doc.moveDown(0.5);

        // Donation code
        doc.fontSize(12).font("Helvetica").text(`Código: ${donation.code}`, {
          align: "center",
        });
        doc.moveDown(1.5);

        // Foundation info (required for tax support in Colombia)
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("DATOS DE LA FUNDACIÓN");
        doc.moveDown(0.5);

        doc.fontSize(11).font("Helvetica");
        doc.text(`Fundación: ${FOUNDATION_NAME}`);
        doc.text(`NIT: ${FOUNDATION_NIT}`);
        doc.moveDown(1);

        // Donation info
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("INFORMACIÓN DE LA DONACIÓN");
        doc.moveDown(0.5);

        doc.fontSize(11).font("Helvetica");
        doc.text(`Fecha de Donación: ${this.formatDate(donation.donationAt)}`);
        doc.text(`Tipo: ${this.formatDonationType(donation.type)}`);
        doc.text(`Estado: ${this.formatDonationStatus(donation.status)}`);
        if (donation.program) {
          doc.text(`Programa: ${donation.program}`);
        }
        doc.moveDown(1);

        // Donor info
        doc.fontSize(14).font("Helvetica-Bold").text("DATOS DEL DONANTE");
        doc.moveDown(0.5);

        doc.fontSize(11).font("Helvetica");
        if (donation.anonymous) {
          doc.text("Donante Anónimo");
        } else if (donation.donorSponsor) {
          const donor = donation.donorSponsor;
          doc.text(`Nombre: ${donor.name}`);
          doc.text(`Identificación: ${donor.identification}`);
          doc.text(
            `Tipo: ${donor.personType === "Natural" ? "Persona Natural" : "Persona Jurídica"}`,
          );
          if (donor.contactEmail) {
            doc.text(`Email: ${donor.contactEmail}`);
          }
          if (donor.phone) {
            doc.text(`Teléfono: ${donor.phone}`);
          }
          if (donor.city) {
            doc.text(`Ciudad: ${donor.city}`);
          }
        }
        doc.moveDown(1);

        // Donation details
        if (donation.details && donation.details.length > 0) {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("DETALLE DE LA DONACIÓN");
          doc.moveDown(0.5);

          doc.fontSize(11).font("Helvetica");

          // Table header
          const tableTop = doc.y;
          const col1X = 50;
          const col2X = 250;
          const col3X = 400;
          const col4X = 500;

          doc.font("Helvetica-Bold");
          doc.text("Descripción", col1X, tableTop);
          doc.text("Tipo", col2X, tableTop);
          doc.text("Cantidad", col3X, tableTop);
          doc.text("Monto", col4X, tableTop);

          doc.moveDown(0.3);
          doc.moveTo(col1X, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown(0.3);

          // Table rows
          doc.font("Helvetica");
          let totalAmount = 0;

          for (const detail of donation.details) {
            const rowY = doc.y;

            doc.text(detail.description || "-", col1X, rowY, { width: 180 });
            doc.text(this.formatDetailType(detail), col2X, rowY, {
              width: 130,
            });
            doc.text(
              detail.quantity ? detail.quantity.toString() : "-",
              col3X,
              rowY,
              { width: 80 },
            );
            doc.text(
              detail.amount ? `${this.formatCurrency(detail.amount)}` : "-",
              col4X,
              rowY,
              { width: 80 },
            );

            if (detail.amount) {
              totalAmount += parseFloat(detail.amount);
            }

            doc.moveDown(0.8);
          }

          // Total
          if (totalAmount > 0) {
            doc.moveDown(0.3);
            doc.moveTo(col1X, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
            doc.font("Helvetica-Bold");
            doc.text(
              `TOTAL: ${this.formatCurrency(totalAmount)}`,
              col4X,
              doc.y,
              {
                width: 80,
              },
            );
          }

          doc.moveDown(1.5);
        }

        // Notes
        if (donation.notes) {
          const contentX = doc.page.margins.left;
          const contentWidth =
            doc.page.width - doc.page.margins.left - doc.page.margins.right;

          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Observaciones:", contentX, doc.y, { width: contentWidth });
          doc
            .fontSize(10)
            .font("Helvetica")
            .text(donation.notes, contentX, doc.y, { width: contentWidth });
          doc.moveDown(1.5);
        }

        // Responsible signature section
        if (donation.responsible) {
          const signatureX = 200;
          const signatureHeight = 80;
          const signatureBlockHeight = 150;
          const footerReserve = 70;
          const pageBottomLimit = doc.page.height - doc.page.margins.bottom;

          // Keep signature + responsible data together on the same page
          if (doc.y + signatureBlockHeight + footerReserve > pageBottomLimit) {
            doc.addPage();
            doc.y = doc.page.margins.top + 40;
          } else {
            const minSignatureStartY = 500;
            if (doc.y < minSignatureStartY) {
              doc.y = minSignatureStartY;
            } else {
              doc.moveDown(1);
            }
          }

          const signatureY = doc.y;

          // Download and add signature image if available
          if (donation.responsible.signatureUrl) {
            try {
              const imageBuffer = await this.downloadImage(
                donation.responsible.signatureUrl,
              );

              doc.image(imageBuffer, signatureX, signatureY, {
                width: 200,
                height: signatureHeight,
                align: "center",
              });

              doc.y = signatureY + signatureHeight + 18;
            } catch (error) {
doc.y = signatureY + 58;
            }
          } else {
            doc.y = signatureY + 58;
          }

          // Signature line
          doc
            .moveTo(signatureX, doc.y)
            .lineTo(signatureX + 200, doc.y)
            .stroke();
          doc.moveDown(0.3);

          // Responsible name
          const responsible = donation.responsible.user;
          const fullName =
            `${responsible.firstName} ${responsible.middleName || ""} ${responsible.lastName} ${responsible.secondLastName || ""}`.trim();

          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(fullName, signatureX, doc.y, {
              width: 200,
              align: "center",
            });

          doc
            .fontSize(10)
            .font("Helvetica")
            .text(donation.responsible.user.role.name, signatureX, doc.y, {
              width: 200,
              align: "center",
            });

          doc.text(`ID: ${responsible.identification}`, signatureX, doc.y, {
            width: 200,
            align: "center",
          });
        }

        // Footer
        doc.moveDown(2);
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(`Fecha de emisión: ${this.formatDate(new Date())}`, {
            align: "center",
          });

        doc
          .fontSize(8)
          .text(
            `Código de verificación: ${donation.code}-${Date.now().toString(36).toUpperCase()}`,
            {
              align: "center",
            },
          );

        doc.end();
      } catch (error) {
reject(error);
      }
    });
  }

  formatDate(date) {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatDonationType(type) {
    const types = {
      ECONOMICA: "Monetaria",
      ESPECIE: "En Especie",
      ALIMENTOS: "Alimentos",
    };
    return types[type] || type;
  }

  formatDetailType(detail) {
    const rawType = detail?.kind || detail?.type || detail?.recordType;

    const typeMap = {
      ECONOMICA: "Monetaria",
      ESPECIE: "En Especie",
      ALIMENTOS: "Alimentos",
      payment: "Pago",
      item: "En Especie",
      food: "Alimentos",
    };

    return typeMap[rawType] || rawType || "-";
  }

  formatDonationStatus(status) {
    const statuses = {
      Recibida: "Recibida",
      EnProceso: "En Proceso",
      Verificada: "Verificada",
      Ejecutada: "Ejecutada",
      Anulada: "Anulada",
    };
    return statuses[status] || status;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

