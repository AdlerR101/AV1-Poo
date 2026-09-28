import { join } from 'node:path';
import { obterDiretorioDados } from './util/diretorioDados.js';
import { Provisionamento } from './provisionamento/Provisionamento.js';
import { criarEntradaReal } from './cli/entrada.js';
import { carregarConfigMestre } from './config/ConfigMestre.js';
import { CriptografiaArquivo } from './seguranca/CriptografiaArquivo.js';
import { RepositorioArquivo } from './persistencia/RepositorioArquivo.js';
import { Journal } from './persistencia/Journal.js';
import { ServicoAutenticacao } from './servicos/ServicoAutenticacao.js';
import { ServicoOrganizacao } from './servicos/ServicoOrganizacao.js';
import { ServicoLote } from './servicos/ServicoLote.js';
import { ServicoEquipamento } from './servicos/ServicoEquipamento.js';
import { ExecutorComandos } from './cli/ExecutorComandos.js';
import { CLInterface } from './cli/CLInterface.js';
import { Historico } from './cli/historico.js';

const BANNER = 'greencode v0.1.0';

async function main(): Promise<void> {
  console.log(BANNER);

  const diretorio = obterDiretorioDados();

  let config = await carregarConfigMestre(diretorio);
  if (!config) {
    console.log('Nenhuma configuração encontrada. Iniciando provisionamento inicial...');
    const entrada = criarEntradaReal();
    await new Provisionamento(diretorio, entrada).provisionar();
    entrada.fechar();
    console.log('Provisionamento concluído. Administrador criado com sucesso.');
    config = await carregarConfigMestre(diretorio);
  }
  if (!config) {
    throw new Error('Configuração mestre não encontrada após o provisionamento.');
  }

  const cripto = new CriptografiaArquivo();
  const repositorio = new RepositorioArquivo(diretorio, cripto, config.chaveMestra);

  const servicoAutenticacao = new ServicoAutenticacao(repositorio);
  await servicoAutenticacao.inicializar();

  const servicoOrganizacao = new ServicoOrganizacao(repositorio);
  const servicoLote = new ServicoLote(repositorio);
  const servicoEquipamento = new ServicoEquipamento(repositorio);
  const journal = new Journal(repositorio);

  const executor = new ExecutorComandos({
    repositorio,
    servicoOrganizacao,
    servicoLote,
    servicoEquipamento,
    servicoAutenticacao,
    journal,
  });

  const historico = new Historico(join(diretorio, 'historico.txt'));
  const cli = new CLInterface(executor, historico);
  await cli.iniciar();
}

main().catch((erro) => {
  console.error('Erro fatal:', erro instanceof Error ? erro.message : erro);
  process.exitCode = 1;
});
