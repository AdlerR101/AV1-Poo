import { createInterface, type Interface } from 'node:readline';
import { Writable } from 'node:stream';

/**
 * Fonte de entrada abstrata, para permitir testar o provisionamento sem TTY.
 */
export interface FonteEntrada {
  perguntar(texto: string): Promise<string>;
  perguntarSenha(texto: string): Promise<string>;
  fechar(): void;
}

/**
 * Implementação real com `readline`, com mascaramento de senha (sem eco).
 */
export class EntradaReadline implements FonteEntrada {
  private rl: Interface;

  constructor() {
    this.rl = createInterface({ input: process.stdin, output: process.stdout });
  }

  perguntar(texto: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(texto, (resposta) => resolve(resposta.trim()));
    });
  }

  perguntarSenha(texto: string): Promise<string> {
    return new Promise((resolve) => {
      // `output` existe em tempo de execução, mas não é exposto na tipagem pública.
      const rl = this.rl as unknown as { output: NodeJS.WritableStream };
      const saida = rl.output;
      // Stream que descarta a escrita, usado para silenciar o eco da senha.
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

  fechar(): void {
    this.rl.close();
  }
}

export function criarEntradaReal(): FonteEntrada {
  return new EntradaReadline();
}
