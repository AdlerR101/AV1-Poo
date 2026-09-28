import { createInterface, type Interface } from 'node:readline';
import { Writable } from 'node:stream';
import { ExecutorComandos, type Severidade } from './ExecutorComandos.js';
import { Historico } from './historico.js';
import { parseComando } from './parserComandos.js';

const PREFIXOS: Record<Severidade, string> = {
  sucesso: '[OK]',
  info: '[..]',
  aviso: '[!]',
  erro: '[ERRO]',
};

/**
 * Interface interativa por linha de comando: login, REPL com histórico
 * persistente, autocomplete e menu adaptativo ao papel do usuário.
 */
export class CLInterface {
  private executor: ExecutorComandos;
  private historico: Historico;
  private rl: Interface;
  private encerrado = false;

  constructor(executor: ExecutorComandos, historico: Historico) {
    this.executor = executor;
    this.historico = historico;
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: (linha) => this.completar(linha),
      historySize: 1000,
    });
  }

  async iniciar(): Promise<void> {
    for (const linha of await this.historico.carregar()) {
      this.rl.history.push(linha);
    }

    if (!this.executor.sessaoAtiva()) {
      await this.fluxoLogin();
    }
    if (this.encerrado) {
      await this.finalizar();
      return;
    }

    this.mostrarMenu();
    await this.loop();
    await this.finalizar();
  }

  private async finalizar(): Promise<void> {
    await this.historico.salvar();
    this.rl.close();
  }

  private async fluxoLogin(): Promise<void> {
    while (!this.encerrado) {
      const usuario = await this.perguntar('Usuário: ');
      if (usuario.length === 0) {
        this.escrever('info', 'Login cancelado.');
        this.encerrado = true;
        return;
      }
      const senha = await this.perguntarSenha('Senha: ');
      try {
        await this.executor.autenticar(usuario, senha);
        this.escrever('sucesso', `Bem-vindo, ${usuario}.`);
        return;
      } catch (e) {
        this.escrever('erro', e instanceof Error ? e.message : String(e));
      }
    }
  }

  private async loop(): Promise<void> {
    while (!this.encerrado) {
      if (this.executor.sessaoAtiva() && !this.executor.manterSessao()) {
        this.escrever('aviso', 'Sessão expirada por inatividade. Faça login novamente.');
        this.executor.encerrarSessao();
        await this.fluxoLogin();
        if (this.encerrado) {
          break;
        }
        this.mostrarMenu();
        continue;
      }

      const linha = await this.perguntarPrompt();
      if (linha.trim().length === 0) {
        continue;
      }
      this.historico.adicionar(linha);
      this.rl.history.push(linha);

      const comando = parseComando(linha);
      if (comando.acao === '') {
        this.escrever('erro', 'Comando vazio.');
        continue;
      }

      const resultado = await this.executor.executar(comando);
      this.escrever(resultado.severidade, resultado.mensagem);
      if (resultado.sair) {
        this.encerrado = true;
        break;
      }
      if (!this.executor.sessaoAtiva()) {
        await this.fluxoLogin();
        if (this.encerrado) {
          break;
        }
        this.mostrarMenu();
      }
    }
  }

  private mostrarMenu(): void {
    console.log(this.executor.descreverMenu());
  }

  private perguntar(texto: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(texto, (resposta) => resolve(resposta.trim()));
    });
  }

  private perguntarPrompt(): Promise<string> {
    const usuario = this.executor.usuarioAtual();
    const prompt = usuario ? `${usuario}@greencode> ` : 'greencode> ';
    return new Promise((resolve) => {
      this.rl.question(prompt, (resposta) => resolve(resposta));
    });
  }

  private perguntarSenha(texto: string): Promise<string> {
    return new Promise((resolve) => {
      const rl = this.rl as unknown as { output: NodeJS.WritableStream };
      const saida = rl.output;
      const silencioso = new Writable({
        write: (_chunk, _encoding, callback) => callback(),
      }) as unknown as NodeJS.WritableStream;

      saida.write(texto);
      rl.output = silencioso;
      this.rl.question('', (resposta) => {
        rl.output = saida;
        saida.write('\n');
        resolve(resposta);
      });
    });
  }

  private completar(linha: string): [string[], string] {
    const sugestoes = this.executor.obterSugestoesAutocomplete();
    const filtradas = sugestoes.filter((s) => s.startsWith(linha) && s !== linha);
    return [filtradas, linha];
  }

  private escrever(severidade: Severidade, mensagem: string): void {
    console.log(`${PREFIXOS[severidade]} ${mensagem}`);
  }
}
