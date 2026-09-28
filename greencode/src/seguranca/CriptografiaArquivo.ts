import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const ALGORITMO = 'aes-256-gcm';
const TAMANHO_IV = 12; // Recomendação do GCM: IV de 12 bytes.
const TAMANHO_CHAVE = 32; // 256 bits.

/**
 * Criptografia simétrica AES-256-GCM para arquivos de persistência.
 *
 * O modo GCM é autenticado: além de confidencialidade, garante integridade
 * (detecta qualquer adulteração do conteúdo cifrado).
 *
 * Formato do envelope gerado:
 *   v1:<iv base64>:<tag base64>:<ciphertext base64>
 */
export class CriptografiaArquivo {
  gerarChave(): string {
    return randomBytes(TAMANHO_CHAVE).toString('base64');
  }

  cifrar(dados: string, chave: string): string {
    const chaveBytes = this.converterChave(chave);
    const iv = randomBytes(TAMANHO_IV);
    const cipher = createCipheriv(ALGORITMO, chaveBytes, iv);
    const cifrado = Buffer.concat([cipher.update(dados, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      'v1',
      iv.toString('base64'),
      tag.toString('base64'),
      cifrado.toString('base64'),
    ].join(':');
  }

  decifrar(dadosCifrados: string, chave: string): string {
    const chaveBytes = this.converterChave(chave);
    const partes = dadosCifrados.split(':');
    if (partes.length !== 4 || partes[0] !== 'v1') {
      throw new Error('Formato de dados cifrados inválido ou não suportado.');
    }
    const iv = Buffer.from(partes[1], 'base64');
    const tag = Buffer.from(partes[2], 'base64');
    const cifrado = Buffer.from(partes[3], 'base64');
    const decipher = createDecipheriv(ALGORITMO, chaveBytes, iv);
    decipher.setAuthTag(tag);
    const claro = Buffer.concat([decipher.update(cifrado), decipher.final()]);
    return claro.toString('utf8');
  }

  private converterChave(chave: string): Buffer {
    const chaveBytes = Buffer.from(chave, 'base64');
    if (chaveBytes.length !== TAMANHO_CHAVE) {
      throw new Error('Chave inválida: esperado 32 bytes codificados em base64.');
    }
    return chaveBytes;
  }
}
