import type { Contrato } from './Contrato.js';

/**
 * Formato da organização como aparece no arquivo de persistência (JSON plano).
 * Datas são armazenadas como string ISO; o contrato vigente é resolvido pelo
 * serviço (Fase 6) a partir do `organizacaoId`, não persistido aqui.
 */
export interface RegistroOrganizacao {
  id: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
  dataCadastro: string;
  ativo: boolean;
}

export class Organizacao {
  id: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
  dataCadastro: Date;
  ativo: boolean;
  contratoVigente: Contrato | null;

  constructor(dados: {
    id: string;
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual: string;
    enderecoCompleto: string;
    telefone: string;
    email: string;
    dataCadastro: Date;
    ativo: boolean;
  }) {
    this.id = dados.id;
    this.razaoSocial = dados.razaoSocial;
    this.cnpj = dados.cnpj;
    this.inscricaoEstadual = dados.inscricaoEstadual;
    this.enderecoCompleto = dados.enderecoCompleto;
    this.telefone = dados.telefone;
    this.email = dados.email;
    this.dataCadastro = dados.dataCadastro;
    this.ativo = dados.ativo;
    this.contratoVigente = null;
  }

  alterarEndereco(novoEndereco: string): void {
    this.enderecoCompleto = novoEndereco;
  }

  desativar(): void {
    this.ativo = false;
  }

  static fromRecord(registro: RegistroOrganizacao): Organizacao {
    return new Organizacao({
      id: registro.id,
      razaoSocial: registro.razaoSocial,
      cnpj: registro.cnpj,
      inscricaoEstadual: registro.inscricaoEstadual,
      enderecoCompleto: registro.enderecoCompleto,
      telefone: registro.telefone,
      email: registro.email,
      dataCadastro: new Date(registro.dataCadastro),
      ativo: registro.ativo,
    });
  }
}
