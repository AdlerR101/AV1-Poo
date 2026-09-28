import type { RepositorioArquivo } from '../persistencia/RepositorioArquivo.js';
import type { Journal } from '../persistencia/Journal.js';
import type { ServicoAutenticacao } from '../servicos/ServicoAutenticacao.js';
import type { ServicoOrganizacao } from '../servicos/ServicoOrganizacao.js';
import type { ServicoLote } from '../servicos/ServicoLote.js';
import type { ServicoEquipamento } from '../servicos/ServicoEquipamento.js';
import type { Sessao } from '../dominio/Sessao.js';
import type { Organizacao } from '../dominio/Organizacao.js';
import type { Lote } from '../dominio/Lote.js';
import type { HistoricoCompleto } from '../dominio/HistoricoCompleto.js';
import { PapelUsuario } from '../dominio/PapelUsuario.js';
import { StatusRastreamento } from '../dominio/StatusRastreamento.js';
import { EstadoFisico } from '../dominio/EstadoFisico.js';
import { TipoEquipamento } from '../dominio/TipoEquipamento.js';
import type { Comando } from './parserComandos.js';

export type Severidade = 'sucesso' | 'info' | 'aviso' | 'erro';

export interface ResultadoComando {
  sucesso: boolean;
  severidade: Severidade;
  mensagem: string;
  sair: boolean;
}

interface DependenciasExecutor {
  repositorio: RepositorioArquivo;
  servicoOrganizacao: ServicoOrganizacao;
  servicoLote: ServicoLote;
  servicoEquipamento: ServicoEquipamento;
  servicoAutenticacao: ServicoAutenticacao;
  journal: Journal;
}

interface MetadadosComando {
  dominio: string | null;
  acao: string;
  sintaxe: string;
  descricao: string;
  // `null` significa que o comando não exige sessão (ajuda/sair) ou é tratado
  // à parte (logout). Para os demais, lista os papéis autorizados.
  papeis: PapelUsuario[] | null;
}

const TODOS_PAPEIS = [
  PapelUsuario.ADMINISTRADOR,
  PapelUsuario.OPERADOR_CADASTRO,
  PapelUsuario.GESTOR_ALMOXARIFADO,
  PapelUsuario.AUDITOR,
];

const TABELA: MetadadosComando[] = [
  { dominio: null, acao: 'ajuda', sintaxe: 'ajuda', descricao: 'Exibe esta ajuda.', papeis: null },
  { dominio: null, acao: 'sair', sintaxe: 'sair', descricao: 'Encerra o greencode.', papeis: null },
  { dominio: null, acao: 'logout', sintaxe: 'logout', descricao: 'Encerra a sessão atual.', papeis: null },
  {
    dominio: 'org', acao: 'criar',
    sintaxe: 'org criar "<razaoSocial>" "<cnpj>" "<inscricaoEstadual>" "<endereco>" "<telefone>" "<email>"',
    descricao: 'Cadastra uma organização.',
    papeis: [PapelUsuario.ADMINISTRADOR, PapelUsuario.OPERADOR_CADASTRO],
  },
  { dominio: 'org', acao: 'consultar', sintaxe: 'org consultar <id>', descricao: 'Consulta uma organização por id.', papeis: TODOS_PAPEIS },
  { dominio: 'org', acao: 'listar', sintaxe: 'org listar', descricao: 'Lista organizações ativas.', papeis: TODOS_PAPEIS },
  { dominio: 'org', acao: 'desativar', sintaxe: 'org desativar <id>', descricao: 'Desativa uma organização.', papeis: [PapelUsuario.ADMINISTRADOR] },
  {
    dominio: 'contrato', acao: 'criar',
    sintaxe: 'contrato criar <orgId> <assinatura> <vencimento> <valorMensal> ["clausula1;clausula2"]',
    descricao: 'Cria um contrato para a organização (datas AAAA-MM-DD).',
    papeis: [PapelUsuario.ADMINISTRADOR, PapelUsuario.OPERADOR_CADASTRO],
  },
  {
    dominio: 'contrato', acao: 'renovar',
    sintaxe: 'contrato renovar <orgId> <novoVencimento>',
    descricao: 'Renova o contrato vigente da organização (data AAAA-MM-DD).',
    papeis: [PapelUsuario.ADMINISTRADOR, PapelUsuario.OPERADOR_CADASTRO],
  },
  {
    dominio: 'lote', acao: 'criar',
    sintaxe: 'lote criar <orgId> <dataEntrada> <notaFiscal> <transportadora>',
    descricao: 'Cria um lote de recebimento (data AAAA-MM-DD).',
    papeis: [PapelUsuario.ADMINISTRADOR, PapelUsuario.OPERADOR_CADASTRO],
  },
  {
    dominio: 'lote', acao: 'adicionar',
    sintaxe: 'lote adicionar <loteId> <tipo> <marca> <modelo> <ano> <estadoFisico> <pesoKg>',
    descricao: 'Adiciona um equipamento ao lote.',
    papeis: [PapelUsuario.ADMINISTRADOR, PapelUsuario.OPERADOR_CADASTRO],
  },
  {
    dominio: 'lote', acao: 'triagem',
    sintaxe: 'lote triagem <loteId>',
    descricao: 'Conclui a triagem do lote.',
    papeis: [PapelUsuario.ADMINISTRADOR, PapelUsuario.GESTOR_ALMOXARIFADO],
  },
  {
    dominio: 'lote', acao: 'consultar',
    sintaxe: 'lote consultar <dataInicio> <dataFim>',
    descricao: 'Consulta lotes por período de entrada.',
    papeis: TODOS_PAPEIS,
  },
  { dominio: 'equipamento', acao: 'rastrear', sintaxe: 'equipamento rastrear <id>', descricao: 'Rastreia um equipamento e seu histórico.', papeis: TODOS_PAPEIS },
  {
    dominio: 'equipamento', acao: 'status',
    sintaxe: 'equipamento status <id> <novoStatus> [justificativa]',
    descricao: 'Atualiza o status de rastreamento.',
    papeis: [PapelUsuario.ADMINISTRADOR, PapelUsuario.GESTOR_ALMOXARIFADO],
  },
  {
    dominio: 'equipamento', acao: 'estado',
    sintaxe: 'equipamento estado <id> <novoEstado> [justificativa]',
    descricao: 'Atualiza o estado físico.',
    papeis: [PapelUsuario.ADMINISTRADOR, PapelUsuario.GESTOR_ALMOXARIFADO],
  },
  {
    dominio: 'equipamento', acao: 'movimentar',
    sintaxe: 'equipamento movimentar <id> <destino>',
    descricao: 'Registra uma movimentação do equipamento.',
    papeis: [PapelUsuario.ADMINISTRADOR, PapelUsuario.GESTOR_ALMOXARIFADO],
  },
];

function resultado(severidade: Severidade, mensagem: string, sair = false): ResultadoComando {
  return { sucesso: severidade !== 'erro', severidade, mensagem, sair };
}

function sucesso(mensagem: string): ResultadoComando {
  return resultado('sucesso', mensagem);
}

function info(mensagem: string): ResultadoComando {
  return resultado('info', mensagem);
}

function erro(mensagem: string): ResultadoComando {
  return resultado('erro', mensagem);
}

function exigirArgs(args: string[], minimo: number, nome: string): string[] {
  if (args.length < minimo) {
    throw new Error(`Argumentos insuficientes para "${nome}" (esperado ${minimo}, recebido ${args.length}).`);
  }
  return args;
}

function parseData(texto: string, nome: string): Date {
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto.trim());
  if (correspondencia) {
    const ano = Number(correspondencia[1]);
    const mes = Number(correspondencia[2]);
    const dia = Number(correspondencia[3]);
    const data = new Date(ano, mes - 1, dia);
    if (Number.isNaN(data.getTime())) {
      throw new Error(`${nome} inválida: "${texto}".`);
    }
    return data;
  }
  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) {
    throw new Error(`${nome} inválida: "${texto}". Use o formato AAAA-MM-DD.`);
  }
  return data;
}

function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function parseNumero(texto: string, nome: string): number {
  const valor = Number(texto.replace(',', '.'));
  if (!Number.isFinite(valor)) {
    throw new Error(`${nome} inválido: "${texto}".`);
  }
  return valor;
}

function parseInteiro(texto: string, nome: string): number {
  const valor = Number.parseInt(texto, 10);
  if (!Number.isFinite(valor)) {
    throw new Error(`${nome} inválido: "${texto}".`);
  }
  return valor;
}

function parseEnum<T extends string>(texto: string, enumObj: Record<string, string>, nome: string): T {
  const normalizado = texto.trim().toUpperCase();
  const valores = Object.values(enumObj);
  if (!valores.includes(normalizado)) {
    throw new Error(`${nome} inválido: "${texto}". Valores aceitos: ${valores.join(', ')}.`);
  }
  return normalizado as T;
}

/**
 * Executa comandos interpretados pelo parser, com verificação de sessão e de
 * permissões por papel, e registro das mutações no journal.
 */
export class ExecutorComandos {
  private repositorio: RepositorioArquivo;
  private servicoOrganizacao: ServicoOrganizacao;
  private servicoLote: ServicoLote;
  private servicoEquipamento: ServicoEquipamento;
  private servicoAutenticacao: ServicoAutenticacao;
  private journal: Journal;
  private sessao: Sessao | null = null;

  constructor(dependencias: DependenciasExecutor) {
    this.repositorio = dependencias.repositorio;
    this.servicoOrganizacao = dependencias.servicoOrganizacao;
    this.servicoLote = dependencias.servicoLote;
    this.servicoEquipamento = dependencias.servicoEquipamento;
    this.servicoAutenticacao = dependencias.servicoAutenticacao;
    this.journal = dependencias.journal;
  }

  async autenticar(usuario: string, senha: string): Promise<Sessao> {
    this.sessao = await this.servicoAutenticacao.login(usuario, senha);
    return this.sessao;
  }

  encerrarSessao(): void {
    if (this.sessao) {
      this.servicoAutenticacao.logout(this.sessao.token);
      this.sessao = null;
    }
  }

  sessaoAtiva(): boolean {
    return this.sessao !== null;
  }

  usuarioAtual(): string | null {
    return this.sessao?.usuario ?? null;
  }

  /**
   * Renova a sessão em caso de atividade e informa se ela continua válida.
   */
  manterSessao(): boolean {
    if (!this.sessao) {
      return false;
    }
    if (!this.servicoAutenticacao.validarToken(this.sessao.token)) {
      this.sessao = null;
      return false;
    }
    return true;
  }

  async executar(comando: Comando): Promise<ResultadoComando> {
    try {
      const meta = this.buscarMetadados(comando);
      if (!meta) {
        return erro('Comando desconhecido. Digite "ajuda" para ver os comandos disponíveis.');
      }
      if (meta.acao === 'sair') {
        return { sucesso: true, severidade: 'info', mensagem: 'Até logo.', sair: true };
      }
      if (meta.acao === 'ajuda') {
        return this.comandoAjuda();
      }
      if (meta.acao === 'logout') {
        return this.comandoLogout();
      }

      this.exigirSessao();
      this.exigirPermissao(meta);
      return await this.despachar(comando);
    } catch (e) {
      return erro(e instanceof Error ? e.message : String(e));
    }
  }

  descreverMenu(): string {
    const papel = this.sessao?.papel;
    const linhas = [`Papel: ${papel ?? '—'}`];
    linhas.push('Comandos:');
    for (const meta of TABELA) {
      if (meta.acao === 'sair') {
        continue;
      }
      if (this.podeVer(meta)) {
        linhas.push(`  ${this.chave(meta)}`);
      }
    }
    linhas.push('Digite "ajuda" para ver a sintaxe e as descrições.');
    return linhas.join('\n');
  }

  obterSugestoesAutocomplete(): string[] {
    return TABELA.filter((meta) => this.podeVer(meta)).map((meta) => this.chave(meta));
  }

  private comandoAjuda(): ResultadoComando {
    const linhas = [
      'Use aspas duplas para argumentos que contêm espaços.',
      '',
      'Comandos disponíveis:',
    ];
    for (const meta of TABELA) {
      if (this.podeVer(meta)) {
        linhas.push(`  ${meta.sintaxe}`);
        linhas.push(`      ${meta.descricao}`);
      }
    }
    return info(linhas.join('\n'));
  }

  private comandoLogout(): ResultadoComando {
    if (!this.sessao) {
      return info('Nenhuma sessão ativa.');
    }
    const usuario = this.sessao.usuario;
    this.encerrarSessao();
    return sucesso(`Sessão de ${usuario} encerrada.`);
  }

  private exigirSessao(): void {
    if (!this.manterSessao()) {
      throw new Error('Sessão expirada ou inexistente. Faça login novamente.');
    }
  }

  private exigirPermissao(meta: MetadadosComando): void {
    if (meta.papeis === null) {
      return;
    }
    const papel = this.sessao?.papel;
    if (!papel || !meta.papeis.includes(papel)) {
      throw new Error(`Acesso negado: o papel ${papel ?? 'desconhecido'} não pode executar "${this.chave(meta)}".`);
    }
  }

  private buscarMetadados(comando: Comando): MetadadosComando | undefined {
    return TABELA.find((m) => m.dominio === comando.dominio && m.acao === comando.acao);
  }

  private podeVer(meta: MetadadosComando): boolean {
    if (meta.papeis === null) {
      return true;
    }
    const papel = this.sessao?.papel;
    return papel !== undefined && meta.papeis.includes(papel);
  }

  private chave(meta: MetadadosComando): string {
    return meta.dominio ? `${meta.dominio} ${meta.acao}` : meta.acao;
  }

  private despachar(comando: Comando): Promise<ResultadoComando> {
    const chave = comando.dominio ? `${comando.dominio} ${comando.acao}` : comando.acao;
    switch (chave) {
      case 'org criar': return this.comandoOrgCriar(comando.argumentos);
      case 'org consultar': return this.comandoOrgConsultar(comando.argumentos);
      case 'org listar': return this.comandoOrgListar();
      case 'org desativar': return this.comandoOrgDesativar(comando.argumentos);
      case 'contrato criar': return this.comandoContratoCriar(comando.argumentos);
      case 'contrato renovar': return this.comandoContratoRenovar(comando.argumentos);
      case 'lote criar': return this.comandoLoteCriar(comando.argumentos);
      case 'lote adicionar': return this.comandoLoteAdicionar(comando.argumentos);
      case 'lote triagem': return this.comandoLoteTriagem(comando.argumentos);
      case 'lote consultar': return this.comandoLoteConsultar(comando.argumentos);
      case 'equipamento rastrear': return this.comandoEquipamentoRastrear(comando.argumentos);
      case 'equipamento status': return this.comandoEquipamentoStatus(comando.argumentos);
      case 'equipamento estado': return this.comandoEquipamentoEstado(comando.argumentos);
      case 'equipamento movimentar': return this.comandoEquipamentoMovimentar(comando.argumentos);
      default:
        return Promise.resolve(erro('Comando desconhecido. Digite "ajuda" para ver os comandos disponíveis.'));
    }
  }

  private async registrarJournal(
    operacao: string,
    entidade: string,
    dadosAntes: unknown,
    dadosDepois: unknown,
  ): Promise<void> {
    if (!this.sessao) {
      return;
    }
    await this.journal.registrar({
      operacao,
      entidade,
      dadosAntes,
      dadosDepois,
      usuarioResponsavel: this.sessao.usuario,
    });
  }

  // ---------------- Organizações ----------------

  private async comandoOrgCriar(args: string[]): Promise<ResultadoComando> {
    const [razaoSocial, cnpj, inscricaoEstadual, endereco, telefone, email] = exigirArgs(args, 6, 'org criar');
    const organizacao = await this.servicoOrganizacao.cadastrarOrganizacao({
      razaoSocial,
      cnpj,
      inscricaoEstadual,
      enderecoCompleto: endereco,
      telefone,
      email,
    });
    await this.registrarJournal('CRIAR', 'Organizacao', null, organizacao);
    return sucesso(`Organização cadastrada: ${organizacao.id} — ${organizacao.razaoSocial}`);
  }

  private async comandoOrgConsultar(args: string[]): Promise<ResultadoComando> {
    const [id] = exigirArgs(args, 1, 'org consultar');
    const organizacao = await this.servicoOrganizacao.buscarOrganizacao(id);
    if (!organizacao) {
      return erro(`Organização ${id} não encontrada.`);
    }
    return sucesso(this.formatarOrganizacao(organizacao));
  }

  private async comandoOrgListar(): Promise<ResultadoComando> {
    const organizacoes = await this.servicoOrganizacao.listarOrganizacoesAtivas();
    if (organizacoes.length === 0) {
      return info('Nenhuma organização ativa.');
    }
    return sucesso(
      organizacoes.map((o) => `${o.id} — ${o.razaoSocial} (CNPJ ${o.cnpj})`).join('\n'),
    );
  }

  private async comandoOrgDesativar(args: string[]): Promise<ResultadoComando> {
    const [id] = exigirArgs(args, 1, 'org desativar');
    const antes = await this.servicoOrganizacao.buscarOrganizacao(id);
    await this.servicoOrganizacao.desativarOrganizacao(id);
    await this.registrarJournal('DESATIVAR', 'Organizacao', antes, { id, ativo: false });
    return sucesso(`Organização ${id} desativada.`);
  }

  // ---------------- Contratos ----------------

  private async comandoContratoCriar(args: string[]): Promise<ResultadoComando> {
    const [orgId, assinaturaStr, vencimentoStr, valorStr, ...resto] = exigirArgs(args, 4, 'contrato criar');
    const dataAssinatura = parseData(assinaturaStr, 'data de assinatura');
    const dataVencimento = parseData(vencimentoStr, 'data de vencimento');
    const valorMensal = parseNumero(valorStr, 'valor mensal');
    const clausulas = resto.length > 0
      ? resto.join(' ').split(';').map((s) => s.trim()).filter((s) => s.length > 0)
      : [];
    const contrato = await this.servicoOrganizacao.cadastrarContrato({
      organizacaoId: orgId,
      dataAssinatura,
      dataVencimento,
      clausulas,
      valorMensal,
      renovacaoAutomatica: false,
    });
    await this.registrarJournal('CRIAR', 'Contrato', null, contrato);
    return sucesso(`Contrato ${contrato.id} criado para a organização ${orgId}.`);
  }

  private async comandoContratoRenovar(args: string[]): Promise<ResultadoComando> {
    const [orgId, vencimentoStr] = exigirArgs(args, 2, 'contrato renovar');
    const novoVencimento = parseData(vencimentoStr, 'novo vencimento');
    await this.servicoOrganizacao.renovarContrato(orgId, novoVencimento);
    await this.registrarJournal(
      'RENOVAR',
      'Contrato',
      { organizacaoId: orgId },
      { organizacaoId: orgId, dataVencimento: novoVencimento },
    );
    return sucesso(`Contrato da organização ${orgId} renovado até ${formatarData(novoVencimento)}.`);
  }

  // ---------------- Lotes ----------------

  private async comandoLoteCriar(args: string[]): Promise<ResultadoComando> {
    const [orgId, dataEntradaStr, notaFiscal, transportadora] = exigirArgs(args, 4, 'lote criar');
    const dataEntrada = parseData(dataEntradaStr, 'data de entrada');
    const lote = await this.servicoLote.criarLote({
      dataEntrada,
      organizacaoId: orgId,
      notaFiscal,
      transportadora,
    });
    await this.registrarJournal('CRIAR', 'Lote', null, lote);
    return sucesso(`Lote ${lote.id} criado (status ${lote.statusProcessamento}).`);
  }

  private async comandoLoteAdicionar(args: string[]): Promise<ResultadoComando> {
    const [loteId, tipoStr, marca, modelo, anoStr, estadoStr, pesoStr] = exigirArgs(args, 7, 'lote adicionar');
    const tipo = parseEnum<TipoEquipamento>(tipoStr, TipoEquipamento, 'tipo de equipamento');
    const anoFabricacao = parseInteiro(anoStr, 'ano de fabricação');
    const estadoFisico = parseEnum<EstadoFisico>(estadoStr, EstadoFisico, 'estado físico');
    const pesoQuilogramas = parseNumero(pesoStr, 'peso');
    const equipamento = await this.servicoLote.adicionarEquipamentoLote(loteId, {
      tipo,
      marca,
      modelo,
      anoFabricacao,
      estadoFisico,
      pesoQuilogramas,
    });
    await this.registrarJournal('CRIAR', 'Equipamento', null, equipamento);
    return sucesso(`Equipamento ${equipamento.id} adicionado (código ${equipamento.codigoBarrasInterno}).`);
  }

  private async comandoLoteTriagem(args: string[]): Promise<ResultadoComando> {
    const [loteId] = exigirArgs(args, 1, 'lote triagem');
    const lote = await this.servicoLote.processarTriagem(loteId);
    await this.registrarJournal('PROCESSAR_TRIAGEM', 'Lote', { id: loteId }, lote);
    return sucesso(`Triagem concluída para o lote ${loteId} (status ${lote.statusProcessamento}).`);
  }

  private async comandoLoteConsultar(args: string[]): Promise<ResultadoComando> {
    const [inicioStr, fimStr] = exigirArgs(args, 2, 'lote consultar');
    const inicio = parseData(inicioStr, 'data inicial');
    const fim = parseData(fimStr, 'data final');
    const lotes = await this.servicoLote.consultarLotePorPeriodo(inicio, fim);
    if (lotes.length === 0) {
      return info('Nenhum lote no período informado.');
    }
    return sucesso(lotes.map((l) => this.formatarLote(l)).join('\n\n'));
  }

  // ---------------- Equipamentos ----------------

  private async comandoEquipamentoRastrear(args: string[]): Promise<ResultadoComando> {
    const [id] = exigirArgs(args, 1, 'equipamento rastrear');
    const historico = await this.servicoEquipamento.rastrearEquipamento(id);
    return sucesso(this.formatarHistorico(historico));
  }

  private async comandoEquipamentoStatus(args: string[]): Promise<ResultadoComando> {
    const [id, statusStr, ...resto] = exigirArgs(args, 2, 'equipamento status');
    const novoStatus = parseEnum<StatusRastreamento>(statusStr, StatusRastreamento, 'status');
    const justificativa = resto.join(' ');
    const equipamento = await this.servicoEquipamento.atualizarStatusEquipamento(id, novoStatus, justificativa);
    await this.registrarJournal('ATUALIZAR_STATUS', 'Equipamento', { id }, equipamento);
    return sucesso(`Status do equipamento ${id} atualizado para ${equipamento.statusRastreamento}.`);
  }

  private async comandoEquipamentoEstado(args: string[]): Promise<ResultadoComando> {
    const [id, estadoStr, ...resto] = exigirArgs(args, 2, 'equipamento estado');
    const novoEstado = parseEnum<EstadoFisico>(estadoStr, EstadoFisico, 'estado físico');
    const justificativa = resto.join(' ');
    const equipamento = await this.servicoEquipamento.atualizarEstadoFisico(id, novoEstado, justificativa);
    await this.registrarJournal('ATUALIZAR_ESTADO_FISICO', 'Equipamento', { id }, equipamento);
    return sucesso(`Estado físico do equipamento ${id} atualizado para ${equipamento.estadoFisico}.`);
  }

  private async comandoEquipamentoMovimentar(args: string[]): Promise<ResultadoComando> {
    const [id, destino] = exigirArgs(args, 2, 'equipamento movimentar');
    const responsavel = this.sessao?.usuario ?? 'sistema';
    const movimentacao = await this.servicoEquipamento.registrarMovimentacao(id, destino, responsavel);
    await this.registrarJournal('MOVIMENTAR', 'Equipamento', { id }, movimentacao);
    return sucesso(`Movimentação registrada: ${id} -> ${destino} (${responsavel}).`);
  }

  // ---------------- Formatação ----------------

  private formatarOrganizacao(organizacao: Organizacao): string {
    const contrato = organizacao.contratoVigente
      ? `Contrato vigente: ${organizacao.contratoVigente.id} (vence em ${formatarData(organizacao.contratoVigente.dataVencimento)})`
      : 'Sem contrato vigente';
    return [
      `ID: ${organizacao.id}`,
      `Razão social: ${organizacao.razaoSocial}`,
      `CNPJ: ${organizacao.cnpj}`,
      `Inscrição estadual: ${organizacao.inscricaoEstadual}`,
      `Endereço: ${organizacao.enderecoCompleto}`,
      `Telefone: ${organizacao.telefone}`,
      `E-mail: ${organizacao.email}`,
      `Cadastro: ${formatarData(organizacao.dataCadastro)}`,
      `Ativa: ${organizacao.ativo ? 'sim' : 'não'}`,
      contrato,
    ].join('\n');
  }

  private formatarLote(lote: Lote): string {
    const equipamentos = lote.equipamentos.length > 0
      ? lote.equipamentos
        .map((e) => `  - ${e.id} (${e.tipo}) ${e.marca} ${e.modelo} — ${e.statusRastreamento}`)
        .join('\n')
      : '  (nenhum)';
    return [
      `Lote ${lote.id}`,
      `  Organização: ${lote.organizacaoId}`,
      `  Entrada: ${formatarData(lote.dataEntrada)}`,
      `  Nota fiscal: ${lote.notaFiscal || '—'}`,
      `  Transportadora: ${lote.transportadora || '—'}`,
      `  Status: ${lote.statusProcessamento}`,
      `  Peso total: ${lote.calcularPesoTotal()} kg`,
      `  Equipamentos (${lote.equipamentos.length}):`,
      equipamentos,
    ].join('\n');
  }

  private formatarHistorico(historico: HistoricoCompleto): string {
    const equipamento = historico.equipamento;
    const movimentacoes = historico.movimentacoes.length > 0
      ? historico.movimentacoes
        .map((m) => `  - ${formatarData(m.dataHora)} ${m.origem} -> ${m.destino} (${m.responsavel})`)
        .join('\n')
      : '  (sem movimentações)';
    return [
      `Equipamento ${equipamento.id}`,
      `  Código: ${equipamento.codigoBarrasInterno}`,
      `  Tipo: ${equipamento.tipo}`,
      `  Marca/modelo: ${equipamento.marca} ${equipamento.modelo}`,
      `  Ano de fabricação: ${equipamento.anoFabricacao}`,
      `  Estado físico: ${equipamento.estadoFisico}`,
      `  Peso: ${equipamento.pesoQuilogramas} kg`,
      `  Status: ${equipamento.statusRastreamento}`,
      `  Histórico de movimentações:`,
      movimentacoes,
    ].join('\n');
  }
}
