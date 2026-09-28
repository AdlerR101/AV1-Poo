/**
 * Comando já interpretado: domínio opcional (org, contrato, lote, equipamento),
 * ação e argumentos posicionais.
 */
export interface Comando {
  dominio: string | null;
  acao: string;
  argumentos: string[];
}

const COMANDOS_TOPO: Record<string, string> = {
  ajuda: 'ajuda',
  help: 'ajuda',
  sair: 'sair',
  exit: 'sair',
  quit: 'sair',
  logout: 'logout',
};

const DOMINIOS: Record<string, string> = {
  org: 'org',
  organizacao: 'org',
  contrato: 'contrato',
  lote: 'lote',
  equipamento: 'equipamento',
  eq: 'equipamento',
  equip: 'equipamento',
};

/**
 * Divide a linha em tokens, respeitando aspas duplas/simples. Aspas duplas
 * suportam escape com barra invertida (ex.: "texto \"com\" aspas").
 */
export function tokenizar(linha: string): string[] {
  const tokens: string[] = [];
  let atual = '';
  let emAspas: '"' | "'" | null = null;

  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (emAspas) {
      if (ch === emAspas) {
        emAspas = null;
      } else if (ch === '\\' && emAspas === '"' && i + 1 < linha.length) {
        atual += linha[++i];
      } else {
        atual += ch;
      }
    } else if (ch === '"' || ch === "'") {
      emAspas = ch;
    } else if (ch === ' ' || ch === '\t') {
      if (atual.length > 0) {
        tokens.push(atual);
        atual = '';
      }
    } else {
      atual += ch;
    }
  }
  if (atual.length > 0) {
    tokens.push(atual);
  }
  return tokens;
}

/**
 * Converte uma linha digitada em um `Comando`. A primeira palavra é o domínio
 * (ou comando de topo); a segunda, quando aplicável, é a ação.
 */
export function parseComando(linha: string): Comando {
  const tokens = tokenizar(linha);
  if (tokens.length === 0) {
    return { dominio: null, acao: '', argumentos: [] };
  }

  const primeiro = tokens[0].toLowerCase();
  const topo = COMANDOS_TOPO[primeiro];
  if (topo) {
    return { dominio: null, acao: topo, argumentos: tokens.slice(1) };
  }

  const dominio = DOMINIOS[primeiro] ?? null;
  const acao = tokens.length >= 2 ? tokens[1].toLowerCase() : '';
  return { dominio, acao, argumentos: tokens.slice(2) };
}
