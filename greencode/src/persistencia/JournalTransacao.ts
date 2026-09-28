/**
 * Formato do registro de journal como aparece no arquivo de persistência
 * (JSON plano). O timestamp é armazenado como string ISO.
 */
export interface RegistroJournalTransacao {
  id: string;
  timestamp: string;
  operacao: string;
  entidade: string;
  dadosAntes: unknown;
  dadosDepois: unknown;
  usuarioResponsavel: string;
}

/**
 * Registro imutável de uma transação no journal.
 *
 * Representa uma operação realizada sobre uma entidade, com os dados antes
 * e depois da operação. A imutabilidade é garantida pelo escritor de journal
 * (append-only) — ver `Journal`.
 */
export class JournalTransacao {
  id: string;
  timestamp: Date;
  operacao: string;
  entidade: string;
  dadosAntes: unknown;
  dadosDepois: unknown;
  usuarioResponsavel: string;

  constructor(dados: {
    id: string;
    timestamp: Date;
    operacao: string;
    entidade: string;
    dadosAntes: unknown;
    dadosDepois: unknown;
    usuarioResponsavel: string;
  }) {
    this.id = dados.id;
    this.timestamp = dados.timestamp;
    this.operacao = dados.operacao;
    this.entidade = dados.entidade;
    this.dadosAntes = dados.dadosAntes;
    this.dadosDepois = dados.dadosDepois;
    this.usuarioResponsavel = dados.usuarioResponsavel;
  }

  /**
   * A gravação física é responsabilidade do escritor `Journal` (append-only).
   * Este método existe para honrar o modelo UML e é chamado pelo escritor.
   */
  registrar(): void {
    // A persistência é feita pelo `Journal.registrar()`.
  }

  /**
   * A reversão real é orquestrada pelos serviços de negócio a partir dos
   * dadosAntes/dadosDepois registrados. Retorna false por padrão.
   */
  reverter(): boolean {
    return false;
  }

  static fromRecord(registro: RegistroJournalTransacao): JournalTransacao {
    return new JournalTransacao({
      id: registro.id,
      timestamp: new Date(registro.timestamp),
      operacao: registro.operacao,
      entidade: registro.entidade,
      dadosAntes: registro.dadosAntes,
      dadosDepois: registro.dadosDepois,
      usuarioResponsavel: registro.usuarioResponsavel,
    });
  }
}
