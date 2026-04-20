/* global FormHandler, GalleryManager, ReportGenerator */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const appState = {
    fotos: [],
    assinatura1: null,
    assinatura2: null,
  };

  const elements = {
    // Form
    formVistoria: document.getElementById('form-vistoria'),
    inputLocalVistoria: document.getElementById('localVistoria'),
    inputDataVistoria: document.getElementById('dataVistoria'),
    inputHoraVistoria: document.getElementById('horaVistoria'),
    inputNomeFiscal: document.getElementById('nomeFiscal'),
    selectCargo: document.getElementById('cargoFiscal'),
    inputCargoOutros: document.getElementById('cargoFiscalOutros'),
    selectDepartamento: document.getElementById('departamentoFiscal'),
    inputDepartamentoOutros: document.getElementById('departamentoFiscalOutros'),
    checkboxIncluirFiscal2: document.getElementById('incluirFiscal2'),
    blocoFiscal2: document.getElementById('blocoFiscal2'),
    inputNomeFiscal2: document.getElementById('nomeFiscal2'),
    selectCargo2: document.getElementById('cargoFiscal2'),
    inputCargoOutros2: document.getElementById('cargoFiscalOutros2'),
    selectDepartamento2: document.getElementById('departamentoFiscal2'),
    inputDepartamentoOutros2: document.getElementById('departamentoFiscalOutros2'),
    checkboxAssinatura: document.getElementById('incluirAssinatura'),
    dicaAssinatura: document.getElementById('dicaAssinatura'),
    inputImagemAssinatura: document.getElementById('imagemAssinatura'),
    btnAssinaturaLabel: document.getElementById('btnAssinaturaLabel'),
    assinaturaStatus: document.getElementById('assinaturaStatus'),
    btnRemoverAssinatura: document.getElementById('btnRemoverAssinatura'),
    inputImagemAssinatura2: document.getElementById('imagemAssinatura2'),
    btnAssinaturaLabel2: document.getElementById('btnAssinaturaLabel2'),
    assinaturaStatus2: document.getElementById('assinaturaStatus2'),
    btnRemoverAssinatura2: document.getElementById('btnRemoverAssinatura2'),
    inputObservacoes: document.getElementById('observacoesGerais'),
    btnSalvarProjeto: document.getElementById('btnSalvarProjeto'),
    inputCarregarProjeto: document.getElementById('inputCarregarProjeto'),
    autoSaveStatus: document.getElementById('autoSaveStatus'),

    // Gallery
    galeriaPreview: document.getElementById('galeria-fotos-legenda'),
    inputSelecionarFotos: document.getElementById('selecionarFotos'),
    checkboxMarca: document.getElementById('usarMarcaDagua'),
    divOpcoesMarca: document.getElementById('opcoesMarcaDagua'),
    selectPosicaoMarca: document.getElementById('posicaoMarcaDagua'),
    selectTamanhoMarca: document.getElementById('tamanhoMarcaDagua'),
    rangeOpacidadeMarca: document.getElementById('opacidadeMarcaDagua'),
    spanValorOpacidade: document.getElementById('valorOpacidade'),
    checkboxMetadados: document.getElementById('usarMetadados'),
    modalEditor: document.getElementById('modalEditor'),
    canvasEditor: document.getElementById('canvasEditor'),
    btnSalvarEdicao: document.getElementById('btnSalvarEdicao'),
    btnDesfazerSeta: document.getElementById('btnDesfazerSeta'),
    btnFecharModal: document.getElementById('btnFecharModal'),
    radiosFerramenta: document.querySelectorAll('input[name="ferramentaEdicao"]'),
    inputTextoEdicao: document.getElementById('textoEdicao'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    zoomLabel: document.getElementById('zoomLabel'),
    modalCrop: document.getElementById('modalCrop'),
    imgCrop: document.getElementById('imgCrop'),
    btnAplicarCrop: document.getElementById('btnAplicarCrop'),
    btnFecharCrop: document.getElementById('btnFecharCrop'),
    btnCropLivre: document.getElementById('btnCropLivre'),
    btnCrop43: document.getElementById('btnCrop43'),
    btnCrop34: document.getElementById('btnCrop34'),
    inputSelecionarVideo: document.getElementById('selecionarVideo'),
    modalVideo: document.getElementById('modalVideo'),
    videoPlayer: document.getElementById('videoPlayer'),
    videoSlider: document.getElementById('videoSlider'),
    btnVideoRewind: document.getElementById('btnVideoRewind'),
    btnVideoForward: document.getElementById('btnVideoForward'),
    btnCapturarFrame: document.getElementById('btnCapturarFrame'),
    btnFecharModalVideo: document.getElementById('btnFecharModalVideo'),
    msgFrameCapturado: document.getElementById('msgFrameCapturado'),

    // Report
    btnGerarRelatorio: document.getElementById('btnGerarRelatorio'),
    btnGerarPDF: document.getElementById('btnGerarPDF'),
    btnAlternarPreview: document.getElementById('btnAlternarPreview'),
    areaRelatorio: document.getElementById('area-relatorio'),
    cabecalhoRelatorioDiv: document.getElementById('cabecalho-relatorio'),
    corpoRelatorioDiv: document.getElementById('corpo-relatorio'),
    observacoesFinaisRelatorioDiv: document.getElementById('observacoes-finais-relatorio'),
    selectFonte: document.getElementById('fonteRelatorio'),
    selectTamanhoFonte: document.getElementById('tamanhoFonteRelatorio'),
    radiosLayout: document.querySelectorAll('input[name="layoutColunas"]'),
    radiosQualidade: document.querySelectorAll('input[name="qualidadeImagens"]'),
    radiosMargens: document.querySelectorAll('input[name="margensImpressao"]'),
  };

  GalleryManager.init(appState, elements, {
    salvarRascunhoLocal: () => FormHandler.salvarRascunhoLocal(),
  });

  FormHandler.init(appState, elements, {
    onEstadoCarregado: () => GalleryManager.renderizarGaleria(),
  });

  ReportGenerator.init(appState, elements, {
    validarFormulario: () => FormHandler.validarFormulario(),
    redimensionarImagem: (dataUrl, maxWidth, quality) =>
      GalleryManager.redimensionarImagem(dataUrl, maxWidth, quality),
  });

  FormHandler.inicializarAutoSave();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      reg.update();
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const toast = document.getElementById('toast-atualizacao');
    if (toast) toast.hidden = false;
  });

  const btnRecarregar = document.getElementById('btn-recarregar');
  if (btnRecarregar) {
    btnRecarregar.addEventListener('click', () => window.location.reload());
  }
}
