import { Validador } from './Validador.js';

const PESOS_PRIMEIRO = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_SEGUNDO = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Valida CNPJ conforme a legislação brasileira: 14 dígitos, rejeita
 * sequências repetidas (ex.: 00000000000000) e confere os dois dígitos
 * verificadores pelos pesos oficiais.
 */
export class ValidadorCNPJ extends Validador {
  validar(cnpj: string): boolean {
    const digitos = cnpj.replace(/\D/g, '');
    if (digitos.length !== 14) {
      this.definirMensagemErro('CNPJ deve conter 14 dígitos.');
      return false;
    }
    if (/^(\d)\1{13}$/.test(digitos)) {
      this.definirMensagemErro('CNPJ inválido: todos os dígitos são iguais.');
      return false;
    }

    const base = digitos.slice(0, 12);
    const digito1 = this.calcularDigitoVerificador(base, PESOS_PRIMEIRO);
    const digito2 = this.calcularDigitoVerificador(base + digito1, PESOS_SEGUNDO);

    if (digitos !== base + digito1 + digito2) {
      this.definirMensagemErro('CNPJ inválido: dígitos verificadores não conferem.');
      return false;
    }

    this.definirMensagemErro('');
    return true;
  }

  private calcularDigitoVerificador(base: string, pesos: number[]): string {
    const soma = pesos.reduce(
      (acumulador, peso, indice) => acumulador + Number(base[indice]) * peso,
      0,
    );
    const resto = soma % 11;
    return resto < 2 ? '0' : String(11 - resto);
  }
}
