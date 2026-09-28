/**
 * Formato da movimentação como aparece no arquivo de persistência (JSON plano).
 */
export interface RegistroMovimentacao {
  id: string;
  equipamentoId: string;
  dataHora: string;
  origem: string;
  destino: string;
  responsavel: string;
  observacao: string;
}

export class Movimentacao {
  id: string;
  equipamentoId: string;
  dataHora: Date;
  origem: string;
  destino: string;
  responsavel: string;
  observacao: string;

  constructor(dados: {
    id: string;
    equipamentoId: string;
    dataHora: Date;
    origem: string;
    destino: string;
    responsavel: string;
    observacao: string;
  }) {
    this.id = dados.id;
    this.equipamentoId = dados.equipamentoId;
    this.dataHora = dados.dataHora;
    this.origem = dados.origem;
    this.destino = dados.destino;
    this.responsavel = dados.responsavel;
    this.observacao = dados.observacao;
  }

  static fromRecord(registro: RegistroMovimentacao): Movimentacao {
    return new Movimentacao({
      id: registro.id,
      equipamentoId: registro.equipamentoId,
      dataHora: new Date(registro.dataHora),
      origem: registro.origem,
      destino: registro.destino,
      responsavel: registro.responsavel,
      observacao: registro.observacao,
    });
  }
}
