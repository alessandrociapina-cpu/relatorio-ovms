/**
 * @jest-environment jsdom
 */
'use strict';

// Mocks dos três módulos IIFE
const initGallery = jest.fn();
const initForm = jest.fn();
const initReport = jest.fn();
const inicializarAutoSave = jest.fn();
const renderizarGaleria = jest.fn();
const validarFormulario = jest.fn();
const redimensionarImagem = jest.fn();
const salvarRascunhoLocal = jest.fn();

global.GalleryManager = { init: initGallery, renderizarGaleria, redimensionarImagem };
global.FormHandler = {
  init: initForm,
  inicializarAutoSave,
  validarFormulario,
  salvarRascunhoLocal,
};
global.ReportGenerator = { init: initReport };
Element.prototype.scrollIntoView = jest.fn();

function criarDOM() {
  [
    'form-vistoria',
    'localVistoria',
    'dataVistoria',
    'horaVistoria',
    'nomeFiscal',
    'cargoFiscal',
    'cargoFiscalOutros',
    'departamentoFiscal',
    'departamentoFiscalOutros',
    'incluirFiscal2',
    'blocoFiscal2',
    'nomeFiscal2',
    'cargoFiscal2',
    'cargoFiscalOutros2',
    'departamentoFiscal2',
    'departamentoFiscalOutros2',
    'incluirAssinatura',
    'dicaAssinatura',
    'imagemAssinatura',
    'btnAssinaturaLabel',
    'assinaturaStatus',
    'btnRemoverAssinatura',
    'imagemAssinatura2',
    'btnAssinaturaLabel2',
    'assinaturaStatus2',
    'btnRemoverAssinatura2',
    'observacoesGerais',
    'btnSalvarProjeto',
    'inputCarregarProjeto',
    'autoSaveStatus',
    'galeria-fotos-legenda',
    'selecionarFotos',
    'usarMarcaDagua',
    'opcoesMarcaDagua',
    'posicaoMarcaDagua',
    'tamanhoMarcaDagua',
    'opacidadeMarcaDagua',
    'valorOpacidade',
    'usarMetadados',
    'modalEditor',
    'btnSalvarEdicao',
    'btnDesfazerSeta',
    'btnFecharModal',
    'textoEdicao',
    'btnZoomIn',
    'btnZoomOut',
    'zoomLabel',
    'modalCrop',
    'imgCrop',
    'btnAplicarCrop',
    'btnFecharCrop',
    'btnCropLivre',
    'btnCrop43',
    'btnCrop34',
    'selecionarVideo',
    'modalVideo',
    'videoPlayer',
    'videoSlider',
    'btnVideoRewind',
    'btnVideoForward',
    'btnCapturarFrame',
    'btnFecharModalVideo',
    'msgFrameCapturado',
    'btnGerarRelatorio',
    'btnGerarPDF',
    'btnAlternarPreview',
    'area-relatorio',
    'cabecalho-relatorio',
    'corpo-relatorio',
    'observacoes-finais-relatorio',
    'fonteRelatorio',
    'tamanhoFonteRelatorio',
  ].forEach((id) => {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  });

  const canvas = document.createElement('canvas');
  canvas.id = 'canvasEditor';
  document.body.appendChild(canvas);

  ['ferramentaEdicao', 'layoutColunas', 'qualidadeImagens', 'margensImpressao'].forEach((name) => {
    const el = document.createElement('input');
    el.type = 'radio';
    el.name = name;
    document.body.appendChild(el);
  });
}

// Inicializa uma única vez — evita listeners acumulados entre testes
let galleryArgs, formArgs, reportArgs;

beforeAll(() => {
  criarDOM();
  require('../script');
  document.dispatchEvent(new Event('DOMContentLoaded'));
  galleryArgs = initGallery.mock.calls[0];
  formArgs = initForm.mock.calls[0];
  reportArgs = initReport.mock.calls[0];
});

describe('script.js — inicialização dos módulos', () => {
  test('GalleryManager.init é chamado exatamente uma vez', () => {
    expect(initGallery).toHaveBeenCalledTimes(1);
  });

  test('FormHandler.init é chamado exatamente uma vez', () => {
    expect(initForm).toHaveBeenCalledTimes(1);
  });

  test('ReportGenerator.init é chamado exatamente uma vez', () => {
    expect(initReport).toHaveBeenCalledTimes(1);
  });

  test('FormHandler.inicializarAutoSave é chamado', () => {
    expect(inicializarAutoSave).toHaveBeenCalledTimes(1);
  });

  test('appState passado ao GalleryManager tem fotos, assinatura1, assinatura2', () => {
    const [state] = galleryArgs;
    expect(state).toHaveProperty('fotos', []);
    expect(state).toHaveProperty('assinatura1', null);
    expect(state).toHaveProperty('assinatura2', null);
  });

  test('todos os módulos recebem o mesmo objeto appState', () => {
    const stateGallery = galleryArgs[0];
    const stateForm = formArgs[0];
    const stateReport = reportArgs[0];
    expect(stateGallery).toBe(stateForm);
    expect(stateForm).toBe(stateReport);
  });

  test('ReportGenerator recebe callback validarFormulario', () => {
    const callbacks = reportArgs[2];
    expect(typeof callbacks.validarFormulario).toBe('function');
  });

  test('ReportGenerator recebe callback redimensionarImagem', () => {
    const callbacks = reportArgs[2];
    expect(typeof callbacks.redimensionarImagem).toBe('function');
  });

  test('callback validarFormulario delega para FormHandler.validarFormulario', () => {
    const { validarFormulario: cb } = reportArgs[2];
    cb();
    expect(validarFormulario).toHaveBeenCalled();
  });

  test('callback redimensionarImagem delega para GalleryManager.redimensionarImagem', () => {
    const { redimensionarImagem: cb } = reportArgs[2];
    cb('data:url', 800, 0.8);
    expect(redimensionarImagem).toHaveBeenCalledWith('data:url', 800, 0.8);
  });

  test('callback onEstadoCarregado chama GalleryManager.renderizarGaleria', () => {
    const callbacks = formArgs[2];
    callbacks.onEstadoCarregado();
    expect(renderizarGaleria).toHaveBeenCalled();
  });

  test('callback salvarRascunhoLocal chama FormHandler.salvarRascunhoLocal', () => {
    const callbacks = galleryArgs[2];
    callbacks.salvarRascunhoLocal();
    expect(salvarRascunhoLocal).toHaveBeenCalled();
  });
});
