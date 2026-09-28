import { randomUUID } from 'node:crypto';
import type { Autenticavel } from './Autenticavel.js';
import { PapelUsuario } from './PapelUsuario.js';

export const TEMPO_INATIVIDADE_MS = 30 * 60 * 1000;

export class Sessao implements Autenticavel {
  token: string;
  usuario: string;
  papel: PapelUsuario;
  criacao: Date;
  expiracao: Date;

  constructor(dados: {
    token: string;
    usuario: string;
    papel: PapelUsuario;
    criacao: Date;
    expiracao: Date;
  }) {
    this.token = dados.token;
    this.usuario = dados.usuario;
    this.papel = dados.papel;
    this.criacao = dados.criacao;
    this.expiracao = dados.expiracao;
  }

  static criar(usuario: string, papel: PapelUsuario): Sessao {
    const agora = new Date();
    return new Sessao({
      token: randomUUID(),
      usuario,
      papel,
      criacao: agora,
      expiracao: new Date(agora.getTime() + TEMPO_INATIVIDADE_MS),
    });
  }

  isValida(): boolean {
    return new Date() <= this.expiracao;
  }

  renovar(): void {
    this.expiracao = new Date(Date.now() + TEMPO_INATIVIDADE_MS);
  }

  autenticar(usuario: string, _senha: string): boolean {
    // Uma sessão já representa um usuário autenticado; a senha não se aplica.
    return this.usuario === usuario && this.isValida();
  }

  renovarToken(): string {
    this.token = randomUUID();
    this.expiracao = new Date(Date.now() + TEMPO_INATIVIDADE_MS);
    return this.token;
  }
}
