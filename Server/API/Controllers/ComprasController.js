import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class ComprasController {
  constructor() {}

  extractDimensions(chapa) {
    if (chapa.medida) {
      const dimensions = chapa.medida
        .toLowerCase()
        .replace(/\s/g, "")
        .split("x")
        .map((dim) => parseFloat(dim.replace(",", ".").replace(".", "")));
      if (dimensions.length === 2) {
        chapa.largura = dimensions[0];
        chapa.comprimento = dimensions[1];
      }
    }
    return chapa;
  }

  async createCompra(orderData) {
    const promises = orderData.info_prod_comprados.map(async (chapa) => {
      chapa.quantidade_disponivel = chapa.quantidade_comprada;

      chapa = this.extractDimensions(chapa);

      return prisma.chapas.create({ data: chapa });
    });

    return await Promise.all(promises);
  }
}

export default ComprasController;
