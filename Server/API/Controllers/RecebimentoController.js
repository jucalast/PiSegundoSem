import { getRepository } from 'typeorm';
import Chapas from '../Models/Chapas.js';

class RecebimentoController {
  constructor() {}

  async updateRecebimento(data) {
  
    const chapasRepository = getRepository(Chapas);
  
    const promises = data.info_prod_recebidos.map(async item => {
      if (!item.id_compra) {
        throw new Error('id_compra is undefined');
      }
  
      const id_compra = item.id_compra;
  
      const chapa = await chapasRepository.findOne({ where: { id_compra } });
      if (!chapa) {
        throw new Error(`Chapa with id ${item.id_compra} not found`);
      }
  
      chapa.data_recebimento = item.data_recebimento;
      chapa.quantidade_recebida += item.quantidade_recebida;
      chapa.quantidade_estoque += item.quantidade_recebida; 
      chapa.status = item.status;
  
      return chapasRepository.save(chapa);
    });
  
    return await Promise.all(promises);
  }

  async getChapasByIdCompra(id_compra) {
    if (!id_compra) {
      throw new Error('id_compra is undefined');
    }
  
    const chapasRepository = getRepository(Chapas);
  
    const chapas = await chapasRepository.find({ 
      where: { id_compra },
      select: [
        'id_grupo_chapas',
        'id_compra',
        'fornecedor',
        'qualidade',
        'medida',
        'onda',
        'vincos',
        'status',
        'data_compra',
        'data_prevista',
        'data_recebimento',
        'quantidade_comprada',
        'quantidade_recebida'
      ],

    });
  
    if (!chapas.length) {
      throw new Error(`No chapas found with id_compra ${id_compra}`);
    }
  
    return chapas;
  }
}

export default RecebimentoController;