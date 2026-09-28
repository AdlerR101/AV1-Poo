import { randomUUID } from 'node:crypto';
import { RepositorioArquivo } from '../persistencia/RepositorioArquivo.js';
import { Organizacao, type RegistroOrganizacao } from '../dominio/Organizacao.js';
import { Contrato, type RegistroContrato } from '../dominio/Contrato.js';
import { ValidadorCNPJ } from '../validadores/ValidadorCNPJ.js';

const ARQUIVO_ORGANIZACOES = 'organizacoes.json.enc';
const ARQUIVO_CONTRATOS = 'contratos.json.enc';

export interface DadosOrganizacao {
  id?: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
}

export interface DadosContrato {
  id?: string;
  organizacaoId: string;
  dataAssinatura: Date;
  dataVencimento: Date;
  clausulas: string[];
  valorMensal: number;
  renovacaoAutomatica: boolean;
}

/**
 * Gerencia organizações e seus contratos: cadastro, consulta, desativação e
 * renovação, com validação de CNPJ e unicidade.
 */
export class ServicoOrganizacao {
  repositorio: RepositorioArquivo;
  validadorCNPJ: ValidadorCNPJ;

  constructor(repositorio: RepositorioArquivo) {
    this.repositorio = repositorio;
    this.validadorCNPJ = new ValidadorCNPJ();
  }

  async cadastrarOrganizacao(dados: DadosOrganizacao): Promise<Organizacao> {
    const cnpj = dados.cnpj.replace(/\D/g, '');
    if (!this.validadorCNPJ.validar(cnpj)) {
      throw new Error(this.validadorCNPJ.obterMensagemErro());
    }

    const existentes = await this.repositorio.listarEntidades<RegistroOrganizacao>(ARQUIVO_ORGANIZACOES);
    if (existentes.some((r) => r.cnpj === cnpj)) {
      throw new Error(`Já existe organização com o CNPJ ${cnpj}.`);
    }

    const organizacao = new Organizacao({
      id: dados.id ?? randomUUID(),
      razaoSocial: dados.razaoSocial,
      cnpj,
      inscricaoEstadual: dados.inscricaoEstadual,
      enderecoCompleto: dados.enderecoCompleto,
      telefone: dados.telefone,
      email: dados.email,
      dataCadastro: new Date(),
      ativo: true,
    });
    await this.repositorio.salvarEntidade(ARQUIVO_ORGANIZACOES, organizacao);
    return organizacao;
  }

  async buscarOrganizacao(id: string): Promise<Organizacao | null> {
    const registro = await this.repositorio.carregarEntidade<RegistroOrganizacao>(ARQUIVO_ORGANIZACOES, id);
    if (!registro) {
      return null;
    }
    const organizacao = Organizacao.fromRecord(registro);
    organizacao.contratoVigente = await this.buscarContratoVigente(id);
    return organizacao;
  }

  async listarOrganizacoesAtivas(): Promise<Organizacao[]> {
    const registros = await this.repositorio.listarEntidades<RegistroOrganizacao>(ARQUIVO_ORGANIZACOES);
    const organizacoes = registros.map((r) => Organizacao.fromRecord(r)).filter((o) => o.ativo);
    const contratos = await this.listarContratos();
    for (const organizacao of organizacoes) {
      organizacao.contratoVigente =
        contratos.find((c) => c.organizacaoId === organizacao.id && c.estaVigente()) ?? null;
    }
    return organizacoes;
  }

  async desativarOrganizacao(id: string): Promise<void> {
    const registro = await this.repositorio.carregarEntidade<RegistroOrganizacao>(ARQUIVO_ORGANIZACOES, id);
    if (!registro) {
      throw new Error(`Organização ${id} não encontrada.`);
    }
    const organizacao = Organizacao.fromRecord(registro);
    organizacao.desativar();
    await this.repositorio.salvarEntidade(ARQUIVO_ORGANIZACOES, organizacao);
  }

  async cadastrarContrato(dados: DadosContrato): Promise<Contrato> {
    const organizacao = await this.repositorio.carregarEntidade<RegistroOrganizacao>(
      ARQUIVO_ORGANIZACOES,
      dados.organizacaoId,
    );
    if (!organizacao) {
      throw new Error(`Organização ${dados.organizacaoId} não encontrada.`);
    }

    const contrato = new Contrato({
      id: dados.id ?? randomUUID(),
      organizacaoId: dados.organizacaoId,
      dataAssinatura: dados.dataAssinatura,
      dataVencimento: dados.dataVencimento,
      clausulas: dados.clausulas,
      valorMensal: dados.valorMensal,
      renovacaoAutomatica: dados.renovacaoAutomatica,
    });
    await this.repositorio.salvarEntidade(ARQUIVO_CONTRATOS, contrato);
    return contrato;
  }

  async renovarContrato(organizacaoId: string, novoVencimento: Date): Promise<void> {
    const contratos = await this.listarContratos();
    const contrato = contratos
      .filter((c) => c.organizacaoId === organizacaoId)
      .sort((a, b) => b.dataVencimento.getTime() - a.dataVencimento.getTime())[0];
    if (!contrato) {
      throw new Error(`Nenhum contrato encontrado para a organização ${organizacaoId}.`);
    }
    contrato.renovar(novoVencimento);
    await this.repositorio.salvarEntidade(ARQUIVO_CONTRATOS, contrato);
  }

  private async listarContratos(): Promise<Contrato[]> {
    const registros = await this.repositorio.listarEntidades<RegistroContrato>(ARQUIVO_CONTRATOS);
    return registros.map((r) => Contrato.fromRecord(r));
  }

  private async buscarContratoVigente(organizacaoId: string): Promise<Contrato | null> {
    const contratos = await this.listarContratos();
    const vigentes = contratos
      .filter((c) => c.organizacaoId === organizacaoId && c.estaVigente())
      .sort((a, b) => b.dataVencimento.getTime() - a.dataVencimento.getTime());
    return vigentes[0] ?? null;
  }
}
