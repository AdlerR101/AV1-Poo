/**
 * Formato do contrato como aparece no arquivo de persistência (JSON plano).
 * Datas são armazenadas como string ISO.
 */
export interface RegistroContrato {
  id: string;
  organizacaoId: string;
  dataAssinatura: string;
  dataVencimento: string;
  clausulas: string[];
  valorMensal: number;
  renovacaoAutomatica: boolean;
}

export class Contrato {
  id: string;
  organizacaoId: string;
  dataAssinatura: Date;
  dataVencimento: Date;
  clausulas: string[];
  valorMensal: number;
  renovacaoAutomatica: boolean;

  constructor(dados: {
    id: string;
    organizacaoId: string;
    dataAssinatura: Date;
    dataVencimento: Date;
    clausulas: string[];
    valorMensal: number;
    renovacaoAutomatica: boolean;
  }) {
    this.id = dados.id;
    this.organizacaoId = dados.organizacaoId;
    this.dataAssinatura = dados.dataAssinatura;
    this.dataVencimento = dados.dataVencimento;
    this.clausulas = [...dados.clausulas];
    this.valorMensal = dados.valorMensal;
    this.renovacaoAutomatica = dados.renovacaoAutomatica;
  }

  estaVigente(): boolean {
    return new Date() <= this.dataVencimento;
  }

  renovar(novoVencimento: Date): void {
    this.dataVencimento = novoVencimento;
  }

  static fromRecord(registro: RegistroContrato): Contrato {
    return new Contrato({
      id: registro.id,
      organizacaoId: registro.organizacaoId,
      dataAssinatura: new Date(registro.dataAssinatura),
      dataVencimento: new Date(registro.dataVencimento),
      clausulas: [...registro.clausulas],
      valorMensal: registro.valorMensal,
      renovacaoAutomatica: registro.renovacaoAutomatica,
    });
  }
}
