import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { escreverArquivoAtomico, lerArquivoTexto } from '../persistencia/escritaAtomica.js';

const NOME_ARQUIVO = 'config.json';
const VERSAO = '1';

export interface AdminInicial {
  usuario: string;
  papel: string;
  criadoEm: string;
}

export interface ConfigMestre {
  versao: string;
  chaveMestra: string;
  adminInicial: AdminInicial;
  criadoEm: string;
}

/**
 * Lê o arquivo de configuração mestre. Retorna `null` se ainda não existir
 * (indicando que o sistema deve entrar em modo de provisionamento).
 */
export async function carregarConfigMestre(diretorio: string): Promise<ConfigMestre | null> {
  const conteudo = await lerArquivoTexto(join(diretorio, NOME_ARQUIVO));
  if (conteudo === null || conteudo.length === 0) {
    return null;
  }
  return JSON.parse(conteudo) as ConfigMestre;
}

/**
 * Grava o arquivo de configuração mestre de forma atômica e com permissão
 * restritiva (0600) no Linux. No Windows o `chmod` tem efeito limitado.
 */
export async function salvarConfigMestre(diretorio: string, config: ConfigMestre): Promise<void> {
  const caminho = join(diretorio, NOME_ARQUIVO);
  await escreverArquivoAtomico(caminho, JSON.stringify(config, null, 2));
  await fs.chmod(caminho, 0o600).catch(() => undefined);
}

export { VERSAO };
