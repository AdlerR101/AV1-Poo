import { randomUUID } from 'node:crypto';
import { Movimentacao } from './Movimentacao.js';
import { TipoEquipamento } from './TipoEquipamento.js';
import { EstadoFisico } from './EstadoFisico.js';
import { StatusRastreamento, transicaoPermitida, ehStatusDesmonte } from './StatusRastreamento.js';

/**
 * Formato do equipamento como aparece no arquivo de persistência (JSON plano).
 * O histórico de movimentação é resolvido pelo serviço (Fase 6) a partir do
 * `equipamentoId`, não persistido inline.
 */
export interface RegistroEquipamento {
  id: string;
  codigoBarrasInterno: string;
  tipo: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  estadoFisico: string;
  pesoQuilogramas: number;
  loteId: string;
  posicaoNoLote: number;
  statusRastreamento: string;
}

export class Equipamento {
  id: string;
  codigoBarrasInterno: string;
  tipo: TipoEquipamento;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  estadoFisico: EstadoFisico;
  pesoQuilogramas: number;
  loteId: string;
  posicaoNoLote: number;
  statusRastreamento: StatusRastreamento;
  historicoMovimentacao: Movimentacao[] = [];

  constructor(dados: {
    id: string;
    codigoBarrasInterno: string;
    tipo: TipoEquipamento;
    marca: string;
    modelo: string;
    anoFabricacao: number;
    estadoFisico: EstadoFisico;
    pesoQuilogramas: number;
    loteId: string;
    posicaoNoLote: number;
    statusRastreamento: StatusRastreamento;
  }) {
    this.id = dados.id;
    this.codigoBarrasInterno = dados.codigoBarrasInterno;
    this.tipo = dados.tipo;
    this.marca = dados.marca;
    this.modelo = dados.modelo;
    this.anoFabricacao = dados.anoFabricacao;
    this.estadoFisico = dados.estadoFisico;
    this.pesoQuilogramas = dados.pesoQuilogramas;
    this.loteId = dados.loteId;
    this.posicaoNoLote = dados.posicaoNoLote;
    this.statusRastreamento = dados.statusRastreamento;
  }

  /**
   * Atualiza o status de rastreamento respeitando o fluxo permitido e exigindo
   * justificativa textual ao mover o equipamento para desmonte.
   */
  atualizarStatus(novoStatus: StatusRastreamento, justificativa: string): void {
    if (novoStatus === this.statusRastreamento) {
      return;
    }
    if (!transicaoPermitida(this.statusRastreamento, novoStatus)) {
      throw new Error(`Transição inválida de status: ${this.statusRastreamento} -> ${novoStatus}.`);
    }
    if (ehStatusDesmonte(novoStatus) && justificativa.trim().length === 0) {
      throw new Error('Justificativa é obrigatória para mover o equipamento para desmonte.');
    }
    this.statusRastreamento = novoStatus;
  }

  registrarMovimentacao(destino: string, responsavel: string): void {
    const movimentacao = new Movimentacao({
      id: randomUUID(),
      equipamentoId: this.id,
      dataHora: new Date(),
      origem: this.statusRastreamento,
      destino,
      responsavel,
      observacao: '',
    });
    this.historicoMovimentacao.push(movimentacao);
  }

  /**
   * Heurística provisória de depreciação: 10% ao ano, limitada a 100%.
   * Deverá ser substituída pelos coeficientes configuráveis pelo ADMINISTRADOR.
   */
  calcularDepreciacao(): number {
    const anoAtual = new Date().getFullYear();
    const idade = Math.max(0, anoAtual - this.anoFabricacao);
    return Math.min(1, idade * 0.1);
  }

  static fromRecord(registro: RegistroEquipamento): Equipamento {
    return new Equipamento({
      id: registro.id,
      codigoBarrasInterno: registro.codigoBarrasInterno,
      tipo: registro.tipo as TipoEquipamento,
      marca: registro.marca,
      modelo: registro.modelo,
      anoFabricacao: registro.anoFabricacao,
      estadoFisico: registro.estadoFisico as EstadoFisico,
      pesoQuilogramas: registro.pesoQuilogramas,
      loteId: registro.loteId,
      posicaoNoLote: registro.posicaoNoLote,
      statusRastreamento: registro.statusRastreamento as StatusRastreamento,
    });
  }
}
