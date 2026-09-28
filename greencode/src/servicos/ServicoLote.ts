import { randomUUID } from 'node:crypto';
import { RepositorioArquivo } from '../persistencia/RepositorioArquivo.js';
import { Lote, type RegistroLote } from '../dominio/Lote.js';
import { Equipamento, type RegistroEquipamento } from '../dominio/Equipamento.js';
import { StatusLote } from '../dominio/StatusLote.js';
import { StatusRastreamento } from '../dominio/StatusRastreamento.js';
import { TipoEquipamento } from '../dominio/TipoEquipamento.js';
import { EstadoFisico } from '../dominio/EstadoFisico.js';
import { ValidadorDataEntrada } from '../validadores/ValidadorDataEntrada.js';
import { gerarCodigoBarras } from '../util/codigoBarras.js';

const ARQUIVO_LOTES = 'lotes.json.enc';
const ARQUIVO_EQUIPAMENTOS = 'equipamentos.json.enc';
const ARQUIVO_ORGANIZACOES = 'organizacoes.json.enc';

export interface DadosLote {
  id?: string;
  dataEntrada: Date;
  organizacaoId: string;
  notaFiscal: string;
  transportadora: string;
  observacoes?: string;
}

export interface DadosEquipamentoLote {
  id?: string;
  tipo: TipoEquipamento;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  estadoFisico: EstadoFisico;
  pesoQuilogramas: number;
  codigoBarrasInterno?: string;
  posicaoNoLote?: number;
}

/**
 * Gerencia lotes e a entrada de equipamentos: criação com validação de data,
 * adição de equipamentos, processamento de triagem e consulta por período.
 */
export class ServicoLote {
  repositorio: RepositorioArquivo;
  validadorDataEntrada: ValidadorDataEntrada;

  constructor(repositorio: RepositorioArquivo) {
    this.repositorio = repositorio;
    this.validadorDataEntrada = new ValidadorDataEntrada();
  }

  async criarLote(dados: DadosLote): Promise<Lote> {
    if (!this.validadorDataEntrada.validar(dados.dataEntrada)) {
      throw new Error(this.validadorDataEntrada.obterMensagemErro());
    }

    const organizacao = await this.repositorio.carregarEntidade<{ id: string }>(
      ARQUIVO_ORGANIZACOES,
      dados.organizacaoId,
    );
    if (!organizacao) {
      throw new Error(`Organização ${dados.organizacaoId} não encontrada.`);
    }

    const lote = new Lote({
      id: dados.id ?? randomUUID(),
      dataEntrada: dados.dataEntrada,
      organizacaoId: dados.organizacaoId,
      notaFiscal: dados.notaFiscal,
      transportadora: dados.transportadora,
      statusProcessamento: StatusLote.RECEBIDO,
      observacoes: dados.observacoes ?? '',
    });
    await this.repositorio.salvarEntidade(ARQUIVO_LOTES, lote);
    return lote;
  }

  async adicionarEquipamentoLote(loteId: string, dados: DadosEquipamentoLote): Promise<Equipamento> {
    const loteRegistro = await this.repositorio.carregarEntidade<RegistroLote>(ARQUIVO_LOTES, loteId);
    if (!loteRegistro) {
      throw new Error(`Lote ${loteId} não encontrado.`);
    }

    const existentes = await this.listarEquipamentosDoLote(loteId);
    const posicao = dados.posicaoNoLote ?? existentes.length + 1;

    const equipamento = new Equipamento({
      id: dados.id ?? randomUUID(),
      codigoBarrasInterno: dados.codigoBarrasInterno ?? gerarCodigoBarras(dados.tipo, posicao),
      tipo: dados.tipo,
      marca: dados.marca,
      modelo: dados.modelo,
      anoFabricacao: dados.anoFabricacao,
      estadoFisico: dados.estadoFisico,
      pesoQuilogramas: dados.pesoQuilogramas,
      loteId,
      posicaoNoLote: posicao,
      statusRastreamento: StatusRastreamento.AGUARDANDO_TRIAGEM,
    });
    await this.repositorio.salvarEntidade(ARQUIVO_EQUIPAMENTOS, equipamento);

    // O lote sai de RECEBIDO para EM_TRIAGEM ao receber o primeiro equipamento.
    if (loteRegistro.statusProcessamento === StatusLote.RECEBIDO) {
      const lote = Lote.fromRecord(loteRegistro);
      lote.statusProcessamento = StatusLote.EM_TRIAGEM;
      await this.repositorio.salvarEntidade(ARQUIVO_LOTES, lote);
    }

    return equipamento;
  }

  async processarTriagem(loteId: string): Promise<Lote> {
    const registro = await this.repositorio.carregarEntidade<RegistroLote>(ARQUIVO_LOTES, loteId);
    if (!registro) {
      throw new Error(`Lote ${loteId} não encontrado.`);
    }
    const lote = Lote.fromRecord(registro);
    if (lote.statusProcessamento !== StatusLote.RECEBIDO && lote.statusProcessamento !== StatusLote.EM_TRIAGEM) {
      throw new Error(`Lote ${loteId} não está em triagem (status atual: ${lote.statusProcessamento}).`);
    }
    lote.statusProcessamento = StatusLote.TRIAGEM_CONCLUIDA;
    await this.repositorio.salvarEntidade(ARQUIVO_LOTES, lote);
    return lote;
  }

  async consultarLotePorPeriodo(inicio: Date, fim: Date): Promise<Lote[]> {
    const registros = await this.repositorio.listarEntidades<RegistroLote>(ARQUIVO_LOTES);
    const lotes = registros
      .map((r) => Lote.fromRecord(r))
      .filter((l) => l.dataEntrada.getTime() >= inicio.getTime() && l.dataEntrada.getTime() <= fim.getTime());
    for (const lote of lotes) {
      lote.equipamentos = await this.listarEquipamentosDoLote(lote.id);
    }
    return lotes;
  }

  private async listarEquipamentosDoLote(loteId: string): Promise<Equipamento[]> {
    const registros = await this.repositorio.listarEntidades<RegistroEquipamento>(ARQUIVO_EQUIPAMENTOS);
    return registros.filter((r) => r.loteId === loteId).map((r) => Equipamento.fromRecord(r));
  }
}
