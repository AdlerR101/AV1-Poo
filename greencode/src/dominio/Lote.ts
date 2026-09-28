import type { Equipamento } from './Equipamento.js';
import { StatusLote } from './StatusLote.js';

/**
 * Formato do lote como aparece no arquivo de persistência (JSON plano).
 * Os equipamentos são resolvidos pelo serviço (Fase 6) a partir do `loteId`,
 * não persistidos inline.
 */
export interface RegistroLote {
  id: string;
  dataEntrada: string;
  organizacaoId: string;
  notaFiscal: string;
  transportadora: string;
  statusProcessamento: string;
  observacoes: string;
}

export class Lote {
  id: string;
  dataEntrada: Date;
  organizacaoId: string;
  notaFiscal: string;
  transportadora: string;
  equipamentos: Equipamento[] = [];
  statusProcessamento: StatusLote;
  observacoes: string;

  constructor(dados: {
    id: string;
    dataEntrada: Date;
    organizacaoId: string;
    notaFiscal: string;
    transportadora: string;
    statusProcessamento: StatusLote;
    observacoes: string;
  }) {
    this.id = dados.id;
    this.dataEntrada = dados.dataEntrada;
    this.organizacaoId = dados.organizacaoId;
    this.notaFiscal = dados.notaFiscal;
    this.transportadora = dados.transportadora;
    this.statusProcessamento = dados.statusProcessamento;
    this.observacoes = dados.observacoes;
  }

  adicionarEquipamento(equip: Equipamento): void {
    this.equipamentos.push(equip);
  }

  removerEquipamento(equipId: string): boolean {
    const tamanhoAntes = this.equipamentos.length;
    this.equipamentos = this.equipamentos.filter((e) => e.id !== equipId);
    return this.equipamentos.length < tamanhoAntes;
  }

  calcularPesoTotal(): number {
    return this.equipamentos.reduce((total, e) => total + e.pesoQuilogramas, 0);
  }

  gerarRelatorioTriagem(): string {
    const agrupado = new Map<string, number>();
    for (const e of this.equipamentos) {
      agrupado.set(e.statusRastreamento, (agrupado.get(e.statusRastreamento) ?? 0) + 1);
    }
    const linhas = [`Lote ${this.id} — ${this.equipamentos.length} equipamento(s):`];
    for (const [status, quantidade] of agrupado) {
      linhas.push(`  ${status}: ${quantidade}`);
    }
    return linhas.join('\n');
  }

  static fromRecord(registro: RegistroLote): Lote {
    return new Lote({
      id: registro.id,
      dataEntrada: new Date(registro.dataEntrada),
      organizacaoId: registro.organizacaoId,
      notaFiscal: registro.notaFiscal,
      transportadora: registro.transportadora,
      statusProcessamento: registro.statusProcessamento as StatusLote,
      observacoes: registro.observacoes,
    });
  }
}
