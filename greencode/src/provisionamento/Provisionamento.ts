import { CriptografiaArquivo } from '../seguranca/CriptografiaArquivo.js';
import { gerarSalt, hashSenha } from '../seguranca/hashSenha.js';
import { RepositorioArquivo } from '../persistencia/RepositorioArquivo.js';
import { carregarConfigMestre, salvarConfigMestre, type ConfigMestre } from '../config/ConfigMestre.js';
import { Credencial } from '../dominio/Credencial.js';
import { PapelUsuario } from '../dominio/PapelUsuario.js';
import type { FonteEntrada } from '../cli/entrada.js';

const ARQUIVO_CREDENCIAIS = 'credenciais.json.enc';
const USUARIO_PADRAO = 'admin';
const PAPEL_ADMIN = PapelUsuario.ADMINISTRADOR;

/**
 * Responsável pelo provisionamento inicial: gera a chave mestra, cadastra o
 * primeiro administrador e grava a configuração mestre + credencial cifrada.
 */
export class Provisionamento {
  private diretorio: string;
  private entrada: FonteEntrada;

  constructor(diretorio: string, entrada: FonteEntrada) {
    this.diretorio = diretorio;
    this.entrada = entrada;
  }

  async estaProvisionado(): Promise<boolean> {
    return (await carregarConfigMestre(this.diretorio)) !== null;
  }

  async provisionar(): Promise<ConfigMestre> {
    const usuario = await this.perguntarUsuario();
    const senha = await this.perguntarSenha();

    const cripto = new CriptografiaArquivo();
    const chaveMestra = cripto.gerarChave();
    const agora = new Date().toISOString();

    const config: ConfigMestre = {
      versao: '1',
      chaveMestra,
      adminInicial: { usuario, papel: PAPEL_ADMIN, criadoEm: agora },
      criadoEm: agora,
    };
    await salvarConfigMestre(this.diretorio, config);

    const salt = gerarSalt();
    const credencial = new Credencial({
      id: usuario,
      usuario,
      salt,
      hashSenha: hashSenha(senha, salt),
      ultimoAcesso: null,
      papel: PAPEL_ADMIN,
    });
    const repositorio = new RepositorioArquivo(this.diretorio, cripto, chaveMestra);
    await repositorio.salvarEntidade(ARQUIVO_CREDENCIAIS, credencial);

    return config;
  }

  private async perguntarUsuario(): Promise<string> {
    const resposta = await this.entrada.perguntar(`Usuário do administrador [${USUARIO_PADRAO}]: `);
    return resposta.length > 0 ? resposta : USUARIO_PADRAO;
  }

  private async perguntarSenha(): Promise<string> {
    for (;;) {
      const senha = await this.entrada.perguntarSenha('Senha do administrador: ');
      if (senha.length === 0) {
        console.error('A senha não pode ser vazia.');
        continue;
      }
      const confirmacao = await this.entrada.perguntarSenha('Confirme a senha: ');
      if (senha !== confirmacao) {
        console.error('As senhas não coincidem. Tente novamente.');
        continue;
      }
      return senha;
    }
  }
}
