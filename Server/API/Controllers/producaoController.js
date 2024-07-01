import Maquina from "../Models/maquinaModel.js";
import Item from "../Models/itemModel.js";
import Item_Maquina from "../Models/item_maquinaModel.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class ProducaoController {
  constructor() {}

  async getAllMachines() {
    const maquinas = await Maquina.findMany({
      select: {
        nome: true,
      },
    });
    return maquinas;
  }

  async getChapasInItemsInMaquinas(name) {
    console.log("name", name);

    // Fetch the machine details
    const maquina = await prisma.maquina.findFirst({
      where: { nome: name },
      select: {
        id_maquina: true,
        nome: true,
        items: {
          select: {
            id_item_maquina: true,
            ordem: true,
            prazo: true,
            medida: true,
            finalizado: true,
            op: true, //adicionado V
            sistema: true,
            cliente: true,
            quantidade: true,
            colaborador: true, // adicionado A
            itemId: true,
            Item: {
              select: {
                id_item: true,
                part_number: true,
                status: true,
                chapas: {
                  select: {
                    quantidade: true,
                    terminado: true,
                    chapa: {
                      select: {
                        qualidade: true,
                        numero_cliente: true,
                        medida: true,
                        largura: true,
                        comprimento: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!maquina) {
      return null;
    }

    // Fetch all items' processes
    const allItemsMaquinas = await prisma.item_Maquina.findMany({
      select: {
        ordem: true,
        finalizado: true,
        itemId: true,
        maquinaId: true,
      },
    });

    // Group processes by itemId and calculate ordemTotal
    const groupedItems = allItemsMaquinas.reduce((groups, item) => {
      if (!groups[item.itemId]) {
        groups[item.itemId] = [];
      }
      groups[item.itemId].push(item);
      return groups;
    }, {});

    // Calculate ordemTotal and determine estado for each process
    Object.values(groupedItems).forEach((items) => {
      items.sort((a, b) => a.ordem - b.ordem);
      const ordemTotal = items.length;
      let currentItem = items.find((item) => !item.finalizado);

      items.forEach((item) => {
        item.ordemTotal = ordemTotal;
        if (item.finalizado) {
          item.estado = "FEITO";
        } else if (item === currentItem) {
          item.estado = "ATUAL";
          currentItem = null; // Mark current item so no future items are marked as current
        } else {
          item.estado = "PROXIMAS";
        }
      });
    });

    // Assign estado to maquina items
    maquina.items.forEach((item) => {
      const itemProcesses = groupedItems[item.itemId];
      if (itemProcesses) {
        const currentItemProcess = itemProcesses.find((proc) => proc.ordem === item.ordem);
        if (currentItemProcess) {
          item.estado = currentItemProcess.estado;
          item.ordemTotal = currentItemProcess.ordemTotal;
        }
      }
    });

    console.log("maquina ", maquina);
    return maquina;
  }

  async markItemAsFinalizado(itemId, maquinaName, executor) {
    const maquina = await Maquina.findFirst({
      where: {
        nome: maquinaName,
      },
    });

    if (!maquina) {
      throw new Error(`Maquina com nome ${maquinaName} não encontrada.`);
    }

    const itemMaquina = await Item_Maquina.findFirst({
      where: {
        itemId: itemId,
        maquinaId: maquina.id_maquina,
      },
    });
    if (!itemMaquina) {
      throw new Error("Esse item não está associado a essa máquina.");
    }

    const previousOrders = await Item_Maquina.findMany({
      where: {
        itemId: itemId,
        ordem: {
          lt: itemMaquina.ordem,
        },
        finalizado: false,
      },
    });

    if (previousOrders.length > 0) {
      throw new Error("Não é possível marcar um processo como finalizado antes de finalizar os processos anteriores.");
    }

    await Item_Maquina.update({
      where: {
        id_item_maquina: itemMaquina.id_item_maquina,
      },
      data: {
        finalizado: true,
        executor: executor,
      },
    });

    const remainingOrders = await Item_Maquina.findMany({
      where: {
        itemId: itemId,
        finalizado: false,
      },
    });

    if (remainingOrders.length === 0) {
      await Item.update({
        where: {
          id_item: itemId,
        },
        data: {
          status: "FINALIZADO", //TODO talvez mudar para AGUARDANDO futuramente? para confirmar que foi a última ordem mesmo.
        },
      });
    }

    return {
      message: `Processo do item ${itemId} na máquina ${maquina.id_maquina} marcado como finalizado`,
    };
  }
}

export default ProducaoController;
