import { promises as fs } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Grava o conteúdo em um arquivo temporário no mesmo diretório do destino
 * e então renomeia para o caminho final. A renomeação é atômica no mesmo
 * sistema de arquivos, evitando corrupção em caso de interrupção brusca.
 */
export async function escreverArquivoAtomico(caminho: string, conteudo: string): Promise<void> {
  const diretorio = dirname(caminho);
  await fs.mkdir(diretorio, { recursive: true });
  const temporario = join(
    diretorio,
    `.${basename(caminho)}.tmp.${process.pid}.${randomBytes(4).toString('hex')}`,
  );
  await fs.writeFile(temporario, conteudo, 'utf8');
  try {
    await fs.rename(temporario, caminho);
  } catch (erro) {
    await fs.unlink(temporario).catch(() => undefined);
    throw erro;
  }
}

/**
 * Lê um arquivo de texto. Retorna `null` quando o arquivo não existe.
 */
export async function lerArquivoTexto(caminho: string): Promise<string | null> {
  try {
    return await fs.readFile(caminho, 'utf8');
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw erro;
  }
}
