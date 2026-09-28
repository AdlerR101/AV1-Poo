import { randomUUID } from 'node:crypto';
import { verificarSenha } from '../seguranca/hashSenha.js';
import type { Autenticavel } from './Autenticavel.js';
import { PapelUsuario } from './PapelUsuario.js';

/**
 * Formato da credencial como aparece no arquivo de persistência (JSON plano).
 * Datas são armazenadas como string ISO; `ultimoAcesso` é `null` até o 1º login.
 */
export interface RegistroCredencial {
  id: string;
  usuario: string;
  salt: string;
  hashSenha: string;
  papel: string;
  ultimoAcesso: string | null;
}

export class Credencial implements Autenticavel {
  id: string;
  usuario: string;
  hashSenha: string;
  salt: string;
  ultimoAcesso: Date | null;
  papel: PapelUsuario;

  constructor(dados: {
    id: string;
    usuario: string;
    hashSenha: string;
    salt: string;
    ultimoAcesso: Date | null;
    papel: PapelUsuario;
  }) {
    this.id = dados.id;
    this.usuario = dados.usuario;
    this.hashSenha = dados.hashSenha;
    this.salt = dados.salt;
    this.ultimoAcesso = dados.ultimoAcesso;
    this.papel = dados.papel;
  }

  verificarSenha(senhaPlana: string): boolean {
    return verificarSenha(senhaPlana, this.salt, this.hashSenha);
  }

  atualizarUltimoAcesso(): void {
    this.ultimoAcesso = new Date();
  }

  autenticar(usuario: string, senha: string): boolean {
    return this.usuario === usuario && this.verificarSenha(senha);
  }

  renovarToken(): string {
    // A credencial emite o token que será usado em uma nova sessão.
    return randomUUID();
  }

  static fromRecord(registro: RegistroCredencial): Credencial {
    return new Credencial({
      id: registro.id,
      usuario: registro.usuario,
      hashSenha: registro.hashSenha,
      salt: registro.salt,
      ultimoAcesso: registro.ultimoAcesso ? new Date(registro.ultimoAcesso) : null,
      papel: registro.papel as PapelUsuario,
    });
  }
}
