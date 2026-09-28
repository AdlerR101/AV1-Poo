import { RepositorioArquivo } from '../persistencia/RepositorioArquivo.js';
import { Equipamento, type RegistroEquipamento } from '../dominio/Equipamento.js';
import { Movimentacao, type RegistroMovimentacao } from '../dominio/Movimentacao.js';
import { HistoricoCompleto } from '../dominio/HistoricoCompleto.js';
import { EstadoFisico, rebaixouDuasCategorias } from '../dominio/EstadoFisico.js';
import { StatusRastreamento } from '../dominio/StatusRastreamento.js';
import { TipoEquipamento } from '../dominio/TipoEquipamento.js';
import { gerarCodigoBarras } from '../util/codigoBarras.js';

const ARQUIVO_EQUIPAMENTOS = 'equipamentos.json.enc';
const ARQUIVO_MOVIMENTACOES = 'movimentacoes.json.enc';

/**
 * Gerencia equipamentos: rastreamento, triagem/status, estado físico,
 * movimentações e geração de código de barras.
 */
export class ServicoEquipamento {
  repositorio: RepositorioArquivo;

  constructor(repositorio: RepositorioArquivo) {
    this.repositorio = repositorio;
  }

  async rastrearEquipamento(id: string): Promise<HistoricoCompleto> {
    const equipamento = await this.carregar(id);
    const registros = await this.repositorio.listarEntidades<RegistroMovimentacao>(ARQUIVO_MOVIMENTACOES);
    const movimentacoes = registros
      .filter((r) => r.equipamentoId === id)
      .map((r) => Movimentacao.fromRecord(r));
    return new HistoricoCompleto(equipamento, movimentacoes);
  }

  async atualizarStatusEquipamento(
    id: string,
    novoStatus: StatusRastreamento,
    justificativa: string,
  ): Promise<Equipamento> {
    const equipamento = await this.carregar(id);
    equipamento.atualizarStatus(novoStatus, justificativa);
    await this.repositorio.salvarEntidade(ARQUIVO_EQUIPAMENTOS, equipamento);
    return equipamento;
  }

  async atualizarEstadoFisico(
    id: string,
    novoEstado: EstadoFisico,
    justificativa: string,
  ): Promise<Equipamento> {
    const equipamento = await this.carregar(id);
    if (
      rebaixouDuasCategorias(equipamento.estadoFisico, novoEstado) &&
      justificativa.trim().length === 0
    ) {
      throw new Error(
        'Justificativa é obrigatória ao rebaixar o estado físico em duas categorias ou mais.',
      );
    }
    equipamento.estadoFisico = novoEstado;
    await this.repositorio.salvarEntidade(ARQUIVO_EQUIPAMENTOS, equipamento);
    return equipamento;
  }

  async registrarMovimentacao(id: string, destino: string, responsavel: string): Promise<Movimentacao> {
    const equipamento = await this.carregar(id);
    equipamento.registrarMovimentacao(destino, responsavel);
    const movimentacao = equipamento.historicoMovimentacao[equipamento.historicoMovimentacao.length - 1];
    await this.repositorio.salvarEntidade(ARQUIVO_MOVIMENTACOES, movimentacao);
    return movimentacao;
  }

  gerarCodigoBarras(tipo: TipoEquipamento, sequencia: number): string {
    return gerarCodigoBarras(tipo, sequencia);
  }

  private async carregar(id: string): Promise<Equipamento> {
    const registro = await this.repositorio.carregarEntidade<RegistroEquipamento>(ARQUIVO_EQUIPAMENTOS, id);
    if (!registro) {
      throw new Error(`Equipamento ${id} não encontrado.`);
    }
    return Equipamento.fromRecord(registro);
  }
}
