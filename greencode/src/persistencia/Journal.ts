import { randomBytes, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { RepositorioArquivo } from './RepositorioArquivo.js';
import { JournalTransacao, type RegistroJournalTransacao } from './JournalTransacao.js';

const ARQUIVO_JOURNAL = 'journal.json.enc';
const PREFIXO_ROTACIONADO = 'journal-';
const SUFIXO_JSON_ENC = '.json.enc';
const TAMANHO_MAXIMO_PADRAO = 10 * 1024 * 1024; // 10 MB
const RETENCAO_PADRAO_DIAS = 180;

export interface DadosTransacao {
  operacao: string;
  entidade: string;
  dadosAntes: unknown;
  dadosDepois: unknown;
  usuarioResponsavel: string;
}

export interface OpcoesJournal {
  tamanhoMaximoBytes?: number;
  retencaoDias?: number;
}

/**
 * Escritor append-only do journal de transações.
 *
 * Como os arquivos de persistência são cifrados por inteiro (AES-256-GCM),
 * a imutabilidade é lógica: registros nunca são alterados/sobrescritos, apenas
 * acrescentados. A rotação arquiva o arquivo ativo ao ultrapassar o limite de
 * tamanho; a retenção descarta registros com mais de 180 dias.
 */
export class Journal {
  private repositorio: RepositorioArquivo;
  private tamanhoMaximoBytes: number;
  private retencaoDias: number;

  constructor(repositorio: RepositorioArquivo, opcoes: OpcoesJournal = {}) {
    this.repositorio = repositorio;
    this.tamanhoMaximoBytes = opcoes.tamanhoMaximoBytes ?? TAMANHO_MAXIMO_PADRAO;
    this.retencaoDias = opcoes.retencaoDias ?? RETENCAO_PADRAO_DIAS;
  }

  async registrar(dados: DadosTransacao): Promise<JournalTransacao> {
    await this.rotacionarSeNecessario();

    const registro = new JournalTransacao({
      id: randomUUID(),
      timestamp: new Date(),
      operacao: dados.operacao,
      entidade: dados.entidade,
      dadosAntes: dados.dadosAntes,
      dadosDepois: dados.dadosDepois,
      usuarioResponsavel: dados.usuarioResponsavel,
    });
    await this.repositorio.salvarEntidade(ARQUIVO_JOURNAL, registro);
    return registro;
  }

  async listar(): Promise<JournalTransacao[]> {
    const registros = await this.listarTodosRegistros();
    return registros
      .map((r) => JournalTransacao.fromRecord(r))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async listarDentroRetencao(): Promise<JournalTransacao[]> {
    const limite = this.limiteRetencao();
    return (await this.listar()).filter((t) => t.timestamp.getTime() >= limite.getTime());
  }

  async aplicarRetencao(): Promise<void> {
    const limite = this.limiteRetencao();
    for (const nome of await this.nomesArquivosJournal()) {
      const registros = await this.repositorio.listarEntidades<RegistroJournalTransacao>(nome);
      const filtrados = registros.filter((r) => new Date(r.timestamp).getTime() >= limite.getTime());
      if (filtrados.length !== registros.length) {
        await this.repositorio.substituirEntidades(nome, filtrados);
      }
    }
  }

  private limiteRetencao(): Date {
    return new Date(Date.now() - this.retencaoDias * 24 * 60 * 60 * 1000);
  }

  private async listarTodosRegistros(): Promise<RegistroJournalTransacao[]> {
    const todos: RegistroJournalTransacao[] = [];
    for (const nome of await this.nomesArquivosJournal()) {
      const registros = await this.repositorio.listarEntidades<RegistroJournalTransacao>(nome);
      todos.push(...registros);
    }
    return todos;
  }

  private async nomesArquivosJournal(): Promise<string[]> {
    const entradas = await fs.readdir(this.repositorio.diretorioBase).catch(() => [] as string[]);
    return entradas
      .filter(
        (n) =>
          n === ARQUIVO_JOURNAL ||
          (n.startsWith(PREFIXO_ROTACIONADO) && n.endsWith(SUFIXO_JSON_ENC)),
      )
      .sort();
  }

  private async rotacionarSeNecessario(): Promise<void> {
    const caminhoAtivo = join(this.repositorio.diretorioBase, ARQUIVO_JOURNAL);
    const tamanho = await this.tamanhoArquivo(caminhoAtivo);
    if (tamanho > this.tamanhoMaximoBytes) {
      const nomeRotacionado =
        `${PREFIXO_ROTACIONADO}${Date.now()}-${randomBytes(4).toString('hex')}${SUFIXO_JSON_ENC}`;
      await fs.rename(caminhoAtivo, join(this.repositorio.diretorioBase, nomeRotacionado));
    }
  }

  private async tamanhoArquivo(caminho: string): Promise<number> {
    try {
      const info = await fs.stat(caminho);
      return info.size;
    } catch {
      return 0;
    }
  }
}
