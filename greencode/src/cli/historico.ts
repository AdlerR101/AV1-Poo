import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

const MAXIMO_PADRAO = 500;

/**
 * Histórico de comandos em texto plano (uma linha por comando), persistido em
 * disco para permitir navegação com as setas entre sessões. Mantém apenas as
 * últimas `maximo` linhas.
 */
export class Historico {
  private caminho: string;
  private maximo: number;
  private linhas: string[] = [];

  constructor(caminho: string, maximo: number = MAXIMO_PADRAO) {
    this.caminho = caminho;
    this.maximo = maximo;
  }

  async carregar(): Promise<string[]> {
    try {
      const conteudo = await fs.readFile(this.caminho, 'utf8');
      this.linhas = conteudo
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    } catch {
      this.linhas = [];
    }
    return [...this.linhas];
  }

  obterLinhas(): string[] {
    return [...this.linhas];
  }

  adicionar(linha: string): void {
    const limpa = linha.trim();
    if (limpa.length === 0) {
      return;
    }
    if (this.linhas[this.linhas.length - 1] === limpa) {
      return;
    }
    this.linhas.push(limpa);
    if (this.linhas.length > this.maximo) {
      this.linhas = this.linhas.slice(-this.maximo);
    }
  }

  async salvar(): Promise<void> {
    await fs.mkdir(dirname(this.caminho), { recursive: true });
    await fs.writeFile(this.caminho, `${this.linhas.join('\n')}\n`, 'utf8');
  }
}
