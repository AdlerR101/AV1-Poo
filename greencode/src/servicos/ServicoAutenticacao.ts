import { RepositorioArquivo } from '../persistencia/RepositorioArquivo.js';
import { Credencial, type RegistroCredencial } from '../dominio/Credencial.js';
import { Sessao } from '../dominio/Sessao.js';
import { gerarSalt, hashSenha } from '../seguranca/hashSenha.js';

const ARQUIVO_CREDENCIAIS = 'credenciais.json.enc';

export class ServicoAutenticacao {
  credenciais: Credencial[] = [];
  sessoesAtivas: Sessao[] = [];
  private repositorio: RepositorioArquivo;

  constructor(repositorio: RepositorioArquivo) {
    this.repositorio = repositorio;
  }

  /**
   * Carrega as credenciais persistidas (cifradas) para memória.
   * Deve ser chamado uma vez antes de `login`/`alterarSenha`.
   */
  async inicializar(): Promise<void> {
    const registros = await this.repositorio.listarEntidades<RegistroCredencial>(ARQUIVO_CREDENCIAIS);
    this.credenciais = registros.map((r) => Credencial.fromRecord(r));
  }

  async login(usuario: string, senha: string): Promise<Sessao> {
    const credencial = this.credenciais.find((c) => c.usuario === usuario);
    if (!credencial || !credencial.autenticar(usuario, senha)) {
      throw new Error('Credenciais inválidas.');
    }
    credencial.atualizarUltimoAcesso();
    await this.repositorio.salvarEntidade(ARQUIVO_CREDENCIAIS, credencial);

    const sessao = Sessao.criar(credencial.usuario, credencial.papel);
    this.sessoesAtivas.push(sessao);
    return sessao;
  }

  logout(token: string): void {
    this.sessoesAtivas = this.sessoesAtivas.filter((s) => s.token !== token);
  }

  validarToken(token: string): boolean {
    const sessao = this.sessoesAtivas.find((s) => s.token === token);
    if (!sessao) {
      return false;
    }
    if (!sessao.isValida()) {
      this.sessoesAtivas = this.sessoesAtivas.filter((s) => s.token !== token);
      return false;
    }
    sessao.renovar();
    return true;
  }

  async alterarSenha(usuario: string, senhaAntiga: string, senhaNova: string): Promise<boolean> {
    const credencial = this.credenciais.find((c) => c.usuario === usuario);
    if (!credencial || !credencial.verificarSenha(senhaAntiga)) {
      return false;
    }
    const novoSalt = gerarSalt();
    credencial.salt = novoSalt;
    credencial.hashSenha = hashSenha(senhaNova, novoSalt);
    await this.repositorio.salvarEntidade(ARQUIVO_CREDENCIAIS, credencial);
    return true;
  }
}
