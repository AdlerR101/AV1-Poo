import { Equipamento } from './Equipamento.js';
import { Movimentacao } from './Movimentacao.js';

/**
 * DTO de rastreabilidade: agrega o equipamento e todo o seu histórico de
 * movimentações. Retornado por `ServicoEquipamento.rastrearEquipamento`.
 */
export class HistoricoCompleto {
  equipamento: Equipamento;
  movimentacoes: Movimentacao[];

  constructor(equipamento: Equipamento, movimentacoes: Movimentacao[]) {
    this.equipamento = equipamento;
    this.movimentacoes = movimentacoes;
  }
}
