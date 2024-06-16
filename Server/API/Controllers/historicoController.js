import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class HistoricoController {
  constructor() {}

  async getChapas() {
    const chapas = await prisma.Chapas.findMany();
    return chapas;
  }

  async getItems() {
  const items = await prisma.Item.findMany({
    select: {
      id_item: true,
      part_number: true,
      status: true,
      reservado_por: true,
      chapas: {
        select: {
          chapa: {
            select: {
              id_compra: true,
              numero_cliente: true
            }
          }
        }
      },
      maquinas: {
        select: {
          executor: true,
          maquina: {
            select: {
              nome: true
            }
          }
        }
      }
    }
  });
  return items;
}
}

export default HistoricoController;
