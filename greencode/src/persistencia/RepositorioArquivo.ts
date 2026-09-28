import { join } from 'node:path';
import { CriptografiaArquivo } from '../seguranca/CriptografiaArquivo.js';
import { escreverArquivoAtomico, lerArquivoTexto } from './escritaAtomica.js';

export interface Entidade {
  id: string;
}

/**
 * Repositório de persistência em arquivos texto cifrados.
 *
 * Cada coleção é armazenada em um único arquivo (array JSON de entidades),
 * cifrado com AES-256. Todas as escritas são atômicas (temp + rename).
 */
export class RepositorioArquivo {
  diretorioBase: string;
  criptografia: CriptografiaArquivo;
  private chave: string;

  constructor(diretorioBase: string, criptografia: CriptografiaArquivo, chave: string) {
    this.diretorioBase = diretorioBase;
    this.criptografia = criptografia;
    this.chave = chave;
  }

  private caminhoArquivo(nomeArquivo: string): string {
    return join(this.diretorioBase, nomeArquivo);
  }

  private async lerColecao<T extends Entidade>(nomeArquivo: string): Promise<T[]> {
    const cifrado = await lerArquivoTexto(this.caminhoArquivo(nomeArquivo));
    if (cifrado === null || cifrado.length === 0) {
      return [];
    }
    const claro = this.criptografia.decifrar(cifrado, this.chave);
    return JSON.parse(claro) as T[];
  }

  private async gravarColecao<T extends Entidade>(nomeArquivo: string, entidades: T[]): Promise<void> {
    const claro = JSON.stringify(entidades, null, 2);
    const cifrado = this.criptografia.cifrar(claro, this.chave);
    await escreverArquivoAtomico(this.caminhoArquivo(nomeArquivo), cifrado);
  }

  async salvarEntidade<T extends Entidade>(nomeArquivo: string, entidade: T): Promise<void> {
    const entidades = await this.lerColecao<T>(nomeArquivo);
    const indice = entidades.findIndex((e) => e.id === entidade.id);
    if (indice >= 0) {
      entidades[indice] = entidade;
    } else {
      entidades.push(entidade);
    }
    await this.gravarColecao(nomeArquivo, entidades);
  }

  async carregarEntidade<T extends Entidade>(nomeArquivo: string, id: string): Promise<T | undefined> {
    const entidades = await this.lerColecao<T>(nomeArquivo);
    return entidades.find((e) => e.id === id);
  }

  async listarEntidades<T extends Entidade>(nomeArquivo: string): Promise<T[]> {
    return this.lerColecao<T>(nomeArquivo);
  }

  async excluirEntidade(nomeArquivo: string, id: string): Promise<void> {
    const entidades = await this.lerColecao<Entidade>(nomeArquivo);
    await this.gravarColecao(
      nomeArquivo,
      entidades.filter((e) => e.id !== id),
    );
  }

  /**
   * Substitui o conteúdo integral de uma coleção. Usado, por exemplo, na
   * retenção do journal (para descartar registros expirados em lote).
   */
  async substituirEntidades<T extends Entidade>(nomeArquivo: string, entidades: T[]): Promise<void> {
    await this.gravarColecao(nomeArquivo, entidades);
  }
}
