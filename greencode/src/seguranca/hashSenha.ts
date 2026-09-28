import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const TAMANHO_SALT = 16; // 128 bits de aleatoriedade.

/**
 * Gera um salt aleatório (hex) para o hash de senha.
 */
export function gerarSalt(): string {
  return randomBytes(TAMANHO_SALT).toString('hex');
}

/**
 * Calcula o hash SHA-256 da senha com o salt informado.
 * Esquema: SHA-256(salt + senha).
 */
export function hashSenha(senha: string, salt: string): string {
  return createHash('sha256')
    .update(salt, 'utf8')
    .update(senha, 'utf8')
    .digest('hex');
}

/**
 * Verifica se a senha corresponde ao hash armazenado, com comparação
 * em tempo constante (evita vazamento por análise de tempo).
 */
export function verificarSenha(senha: string, salt: string, hashEsperado: string): boolean {
  const hashCalculado = hashSenha(senha, salt);
  const a = Buffer.from(hashCalculado, 'hex');
  const b = Buffer.from(hashEsperado, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
