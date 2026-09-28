/**
 * Base abstrata dos validadores de negócio.
 *
 * A assinatura `validar(objeto)` usa `any` por fidelidade ao diagrama UML;
 * cada subclasse refina o tipo do parâmetro (`string`, `Date`, etc.).
 */
export abstract class Validador {
  private mensagemErro = '';

  abstract validar(objeto: any): boolean;

  obterMensagemErro(): string {
    return this.mensagemErro;
  }

  protected definirMensagemErro(mensagem: string): void {
    this.mensagemErro = mensagem;
  }
}
