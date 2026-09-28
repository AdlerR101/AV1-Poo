import { Validador } from './Validador.js';

const LIMITE_DIAS_RETROATIVO = 90;

/**
 * Valida a data de entrada de um lote:
 *  - não pode ser futura;
 *  - não pode ser anterior a mais de 90 dias.
 */
export class ValidadorDataEntrada extends Validador {
  validar(data: Date): boolean {
    if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
      this.definirMensagemErro('Data de entrada inválida.');
      return false;
    }

    const agora = new Date();
    if (data.getTime() > agora.getTime()) {
      this.definirMensagemErro('A data de entrada não pode ser futura.');
      return false;
    }

    const limite = new Date(agora.getTime());
    limite.setDate(limite.getDate() - LIMITE_DIAS_RETROATIVO);
    if (data.getTime() < limite.getTime()) {
      this.definirMensagemErro(
        `A data de entrada não pode ser anterior a ${LIMITE_DIAS_RETROATIVO} dias.`,
      );
      return false;
    }

    this.definirMensagemErro('');
    return true;
  }
}
