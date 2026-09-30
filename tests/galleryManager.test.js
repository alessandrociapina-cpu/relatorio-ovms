/**
 * @jest-environment jsdom
 */
'use strict';

// Mock globals que galleryManager.js depende
global.mostrarAlerta = jest.fn(() => Promise.resolve());
global.confirmar = jest.fn(() => Promise.resolve(false));
Object.assign(global, require('../modules/gps'));
global.lerMetadadosExif = jest.fn(() => Promise.resolve(''));
global.obterPosicaoAparelho = jest.fn(() => Promise.resolve(null));

// Mock Canvas API (não disponível no jsdom)
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray() })),
  putImageData: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  ellipse: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  font: '',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  lineCap: '',
  textBaseline: '',
}));
HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/jpeg;base64,mock');

const { GalleryManager } = require('../galleryManager');

function criarElementos() {
  document.body.innerHTML = '';

  function add(tag, id) {
    const el = document.createElement(tag);
    if (id) el.id = id;
    document.body.appendChild(el);
    return el;
  }

  const galeriaPreview = add('div', 'galeria-preview');
  const canvasEditor = add('canvas', 'canvasEditor');

  const checkboxMarca = add('input', 'checkboxMarca');
  checkboxMarca.type = 'checkbox';

  const checkboxMetadados = add('input', 'checkboxMetadados');
  checkboxMetadados.type = 'checkbox';

  const rangeOpacidade = add('input', 'rangeOpacidade');
  rangeOpacidade.type = 'range';
  rangeOpacidade.value = '50';

  return {
    galeriaPreview,
    inputSelecionarFotos: add('input', 'inputSelecionarFotos'),
    inputCapturarFoto: add('input', 'inputCapturarFoto'),
    checkboxMarca,
    divOpcoesMarca: add('div', 'divOpcoesMarca'),
    selectPosicaoMarca: add('select', 'selectPosicaoMarca'),
    selectTamanhoMarca: add('select', 'selectTamanhoMarca'),
    rangeOpacidadeMarca: rangeOpacidade,
    spanValorOpacidade: add('span', 'spanValorOpacidade'),
    checkboxMetadados,
    modalEditor: add('div', 'modalEditor'),
    canvasEditor,
    btnSalvarEdicao: add('button', 'btnSalvarEdicao'),
    btnDesfazerSeta: add('button', 'btnDesfazerSeta'),
    btnFecharModal: add('button', 'btnFecharModal'),
    radiosFerramenta: [],
    inputTextoEdicao: add('input', 'inputTextoEdicao'),
    btnZoomIn: add('button', 'btnZoomIn'),
    btnZoomOut: add('button', 'btnZoomOut'),
    zoomLabel: add('span', 'zoomLabel'),
    modalCrop: add('div', 'modalCrop'),
    imgCrop: add('img', 'imgCrop'),
    btnAplicarCrop: add('button', 'btnAplicarCrop'),
    btnFecharCrop: add('button', 'btnFecharCrop'),
    btnCropLivre: add('button', 'btnCropLivre'),
    btnCrop43: add('button', 'btnCrop43'),
    btnCrop34: add('button', 'btnCrop34'),
    inputSelecionarVideo: add('input', 'inputSelecionarVideo'),
    modalVideo: add('div', 'modalVideo'),
    videoPlayer: add('video', 'videoPlayer'),
    videoSlider: add('input', 'videoSlider'),
    btnVideoRewind: add('button', 'btnVideoRewind'),
    btnVideoForward: add('button', 'btnVideoForward'),
    btnCapturarFrame: add('button', 'btnCapturarFrame'),
    btnFecharModalVideo: add('button', 'btnFecharModalVideo'),
    msgFrameCapturado: add('div', 'msgFrameCapturado'),
  };
}

function criarFoto(overrides = {}) {
  return {
    id: `foto-${Math.random()}`,
    fileName: 'test.jpg',
    originalDataUrl: 'data:image/jpeg;base64,original',
    previewDataUrl: 'data:image/jpeg;base64,preview',
    editedPreviewDataUrl: null,
    textoLegenda: '',
    metadadosExif: '',
    ocultarLogo: false,
    ocultarMetadados: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
describe('GalleryManager.renderizarGaleria()', () => {
  let el, st, cb;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    el = criarElementos();
    st = { fotos: [], assinatura1: null, assinatura2: null };
    cb = { salvarRascunhoLocal: jest.fn() };
    GalleryManager.init(st, el, cb);
  });

  afterEach(() => jest.useRealTimers());

  test('exibe mensagem quando não há fotos', () => {
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    expect(el.galeriaPreview.innerHTML).toContain('Nenhuma foto');
  });

  test('renderiza um item por foto', () => {
    st.fotos = [criarFoto(), criarFoto()];
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    const items = el.galeriaPreview.querySelectorAll('.foto-legenda-item-preview');
    expect(items).toHaveLength(2);
  });

  test('cada item tem tabindex="0", role="article" e aria-label', () => {
    st.fotos = [criarFoto({ fileName: 'prova.jpg' })];
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    const item = el.galeriaPreview.querySelector('.foto-legenda-item-preview');
    expect(item.getAttribute('tabindex')).toBe('0');
    expect(item.getAttribute('role')).toBe('article');
    expect(item.getAttribute('aria-label')).toContain('Foto 1');
    expect(item.getAttribute('aria-label')).toContain('prova.jpg');
  });

  test('imagens têm loading="lazy"', () => {
    st.fotos = [criarFoto()];
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    const img = el.galeriaPreview.querySelector('img');
    expect(img.loading).toBe('lazy');
  });

  test('barra de ações tem role="toolbar"', () => {
    st.fotos = [criarFoto()];
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    const toolbar = el.galeriaPreview.querySelector('[role="toolbar"]');
    expect(toolbar).not.toBeNull();
    expect(toolbar.getAttribute('aria-label')).toContain('Ações da foto 1');
  });

  test('debounce colapsa múltiplas chamadas em uma renderização', () => {
    st.fotos = [criarFoto()];
    GalleryManager.renderizarGaleria();
    GalleryManager.renderizarGaleria();
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    const items = el.galeriaPreview.querySelectorAll('.foto-legenda-item-preview');
    expect(items).toHaveLength(1);
  });

  test('botão subir está desabilitado para a primeira foto', () => {
    st.fotos = [criarFoto(), criarFoto()];
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    const primeiroItem = el.galeriaPreview.querySelectorAll('.foto-legenda-item-preview')[0];
    const btnSubir = Array.from(primeiroItem.querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === 'Mover foto para cima'
    );
    expect(btnSubir.disabled).toBe(true);
  });

  test('botão descer está desabilitado para a última foto', () => {
    st.fotos = [criarFoto(), criarFoto()];
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    const itens = el.galeriaPreview.querySelectorAll('.foto-legenda-item-preview');
    const ultimoItem = itens[itens.length - 1];
    const btnDescer = Array.from(ultimoItem.querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === 'Mover foto para baixo'
    );
    expect(btnDescer.disabled).toBe(true);
  });

  test('exibe metadados quando checkboxMetadados ativo e foto tem dados', () => {
    el.checkboxMetadados.checked = true;
    st.fotos = [criarFoto({ metadadosExif: 'GPS: -23.5, -46.6', ocultarMetadados: false })];
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    expect(el.galeriaPreview.innerHTML).toContain('GPS: -23.5, -46.6');
  });

  test('não exibe metadados quando checkboxMetadados inativo', () => {
    el.checkboxMetadados.checked = false;
    st.fotos = [criarFoto({ metadadosExif: 'GPS: -23.5, -46.6' })];
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    expect(el.galeriaPreview.innerHTML).not.toContain('GPS: -23.5, -46.6');
  });

  test('usa editedPreviewDataUrl quando disponível', () => {
    st.fotos = [criarFoto({ editedPreviewDataUrl: 'data:image/jpeg;base64,editada' })];
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    const img = el.galeriaPreview.querySelector('img');
    expect(img.src).toContain('editada');
  });
});

// ---------------------------------------------------------------------------
describe('Navegação por teclado na galeria', () => {
  let el, st, cb;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    el = criarElementos();
    st = { fotos: [], assinatura1: null, assinatura2: null };
    cb = { salvarRascunhoLocal: jest.fn() };
    GalleryManager.init(st, el, cb);
  });

  afterEach(() => jest.useRealTimers());

  function renderEObterItems(fotos) {
    st.fotos = fotos;
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    return el.galeriaPreview.querySelectorAll('.foto-legenda-item-preview');
  }

  test('ArrowDown reordena: primeira foto vai para segunda posição', () => {
    const f1 = criarFoto({ id: 'f1' });
    const f2 = criarFoto({ id: 'f2' });
    const items = renderEObterItems([f1, f2]);

    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    expect(st.fotos[0].id).toBe('f2');
    expect(st.fotos[1].id).toBe('f1');
    expect(cb.salvarRascunhoLocal).toHaveBeenCalled();
  });

  test('ArrowUp reordena: segunda foto vai para primeira posição', () => {
    const f1 = criarFoto({ id: 'f1' });
    const f2 = criarFoto({ id: 'f2' });
    const items = renderEObterItems([f1, f2]);

    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

    expect(st.fotos[0].id).toBe('f2');
    expect(st.fotos[1].id).toBe('f1');
  });

  test('ArrowRight reordena igual ao ArrowDown', () => {
    const f1 = criarFoto({ id: 'f1' });
    const f2 = criarFoto({ id: 'f2' });
    const items = renderEObterItems([f1, f2]);

    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(st.fotos[0].id).toBe('f2');
  });

  test('ArrowLeft reordena igual ao ArrowUp', () => {
    const f1 = criarFoto({ id: 'f1' });
    const f2 = criarFoto({ id: 'f2' });
    const items = renderEObterItems([f1, f2]);

    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

    expect(st.fotos[0].id).toBe('f2');
  });

  test('ArrowDown na última foto não altera a ordem', () => {
    const f1 = criarFoto({ id: 'f1' });
    const f2 = criarFoto({ id: 'f2' });
    const items = renderEObterItems([f1, f2]);

    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    expect(st.fotos[0].id).toBe('f1');
    expect(st.fotos[1].id).toBe('f2');
  });

  test('ArrowUp na primeira foto não altera a ordem', () => {
    const f1 = criarFoto({ id: 'f1' });
    const f2 = criarFoto({ id: 'f2' });
    const items = renderEObterItems([f1, f2]);

    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

    expect(st.fotos[0].id).toBe('f1');
    expect(st.fotos[1].id).toBe('f2');
  });

  test('Delete chama confirmar e remove foto se confirmado', async () => {
    global.confirmar.mockResolvedValue(true);
    const items = renderEObterItems([criarFoto({ id: 'f1' })]);

    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    await Promise.resolve();
    jest.runAllTimers();

    expect(st.fotos).toHaveLength(0);
    expect(cb.salvarRascunhoLocal).toHaveBeenCalled();
  });

  test('Delete não remove foto quando confirmação é cancelada', async () => {
    global.confirmar.mockResolvedValue(false);
    const items = renderEObterItems([criarFoto()]);

    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    await Promise.resolve();
    jest.runAllTimers();

    expect(st.fotos).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
describe('Botões de ação na galeria', () => {
  let el, st, cb;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    el = criarElementos();
    st = { fotos: [], assinatura1: null, assinatura2: null };
    cb = { salvarRascunhoLocal: jest.fn() };
    GalleryManager.init(st, el, cb);
  });

  afterEach(() => jest.useRealTimers());

  function renderEObterItems(fotos) {
    st.fotos = fotos;
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
    return el.galeriaPreview.querySelectorAll('.foto-legenda-item-preview');
  }

  function btnPor(item, ariaLabel) {
    return Array.from(item.querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === ariaLabel
    );
  }

  test('clique em excluir pede confirmação e remove a foto correta', async () => {
    global.confirmar.mockResolvedValue(true);
    const f1 = criarFoto({ id: 'f1' });
    const f2 = criarFoto({ id: 'f2' });
    const items = renderEObterItems([f1, f2]);

    btnPor(items[0], 'Excluir esta foto').click();
    await Promise.resolve();
    jest.runAllTimers();

    expect(global.confirmar).toHaveBeenCalled();
    expect(st.fotos).toHaveLength(1);
    expect(st.fotos[0].id).toBe('f2');
    expect(cb.salvarRascunhoLocal).toHaveBeenCalled();
  });

  test('clique em excluir mantém a foto quando a confirmação é cancelada', async () => {
    global.confirmar.mockResolvedValue(false);
    const items = renderEObterItems([criarFoto({ id: 'f1' })]);

    btnPor(items[0], 'Excluir esta foto').click();
    await Promise.resolve();
    jest.runAllTimers();

    expect(st.fotos).toHaveLength(1);
  });

  test('clique em subir move a foto para cima', () => {
    const f1 = criarFoto({ id: 'f1' });
    const f2 = criarFoto({ id: 'f2' });
    const items = renderEObterItems([f1, f2]);

    btnPor(items[1], 'Mover foto para cima').click();
    jest.runAllTimers();

    expect(st.fotos[0].id).toBe('f2');
    expect(st.fotos[1].id).toBe('f1');
  });

  test('clique em descer move a foto para baixo', () => {
    const f1 = criarFoto({ id: 'f1' });
    const f2 = criarFoto({ id: 'f2' });
    const items = renderEObterItems([f1, f2]);

    btnPor(items[0], 'Mover foto para baixo').click();
    jest.runAllTimers();

    expect(st.fotos[0].id).toBe('f2');
    expect(st.fotos[1].id).toBe('f1');
  });

  test('alteração na textarea de legenda atualiza textoLegenda da foto', () => {
    const foto = criarFoto();
    renderEObterItems([foto]);

    const textarea = el.galeriaPreview.querySelector('textarea');
    textarea.value = 'Legenda nova';
    textarea.dispatchEvent(new Event('input'));

    expect(foto.textoLegenda).toBe('Legenda nova');
    expect(cb.salvarRascunhoLocal).toHaveBeenCalled();
  });

  test('textarea de legenda tem aria-label correto', () => {
    renderEObterItems([criarFoto()]);
    const textarea = el.galeriaPreview.querySelector('textarea');
    expect(textarea.getAttribute('aria-label')).toContain('Legenda da foto 1');
  });

  test('todos os botões de ação têm aria-label', () => {
    renderEObterItems([criarFoto(), criarFoto()]);
    const buttons = el.galeriaPreview.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
describe('Seleção múltipla e movimentação em lote', () => {
  let el, st, cb;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    el = criarElementos();
    st = { fotos: [], assinatura1: null, assinatura2: null };
    cb = { salvarRascunhoLocal: jest.fn() };
    GalleryManager.init(st, el, cb);
  });

  afterEach(() => jest.useRealTimers());

  function render(fotos) {
    if (fotos) st.fotos = fotos;
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
  }

  function marcar(...posicoes) {
    posicoes.forEach((p) => {
      const cb = el.galeriaPreview.querySelectorAll('.selecao-foto input')[p];
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    });
  }

  function acao(nome) {
    el.galeriaPreview.querySelector(`.barra-selecao button[data-acao="${nome}"]`).click();
    jest.runAllTimers();
  }

  const ids = () => st.fotos.map((f) => f.id).join(',');
  const fotos = (...nomes) => nomes.map((id) => criarFoto({ id }));

  test('cada foto tem caixa de seleção com aria-label', () => {
    render(fotos('a', 'b'));
    const caixas = el.galeriaPreview.querySelectorAll('.selecao-foto input[type="checkbox"]');
    expect(caixas).toHaveLength(2);
    expect(caixas[1].getAttribute('aria-label')).toBe('Selecionar foto 2');
  });

  test('barra de seleção não aparece sem fotos', () => {
    render([]);
    expect(el.galeriaPreview.querySelector('.barra-selecao')).toBeNull();
  });

  test('botões de lote ficam desabilitados sem seleção', () => {
    render(fotos('a', 'b'));
    const subir = el.galeriaPreview.querySelector('button[data-acao="subir"]');
    const todas = el.galeriaPreview.querySelector('button[data-acao="todas"]');
    expect(subir.disabled).toBe(true);
    expect(todas.disabled).toBe(false);
    marcar(1);
    expect(subir.disabled).toBe(false);
    expect(el.galeriaPreview.querySelector('.contador-selecao').textContent).toContain('1 de 2');
  });

  test('marcar a foto destaca o item', () => {
    render(fotos('a', 'b'));
    marcar(0);
    const item = el.galeriaPreview.querySelectorAll('.foto-legenda-item-preview')[0];
    expect(item.classList.contains('foto-selecionada')).toBe(true);
  });

  test('subir move um bloco de selecionadas mantendo a ordem entre elas', () => {
    render(fotos('a', 'b', 'c', 'd'));
    marcar(2, 3);
    acao('subir');
    expect(ids()).toBe('a,c,d,b');
    expect(cb.salvarRascunhoLocal).toHaveBeenCalled();
  });

  test('subir com selecionadas não contíguas move cada uma uma posição', () => {
    render(fotos('a', 'b', 'c', 'd', 'e'));
    marcar(1, 3);
    acao('subir');
    expect(ids()).toBe('b,a,d,c,e');
  });

  test('descer move as selecionadas e para no fim da lista', () => {
    render(fotos('a', 'b', 'c', 'd'));
    marcar(0, 3);
    acao('descer');
    expect(ids()).toBe('b,a,c,d');
  });

  test('seleção acompanha as fotos após mover (subir duas vezes)', () => {
    render(fotos('a', 'b', 'c'));
    marcar(2);
    acao('subir');
    acao('subir');
    expect(ids()).toBe('c,a,b');
    const caixas = el.galeriaPreview.querySelectorAll('.selecao-foto input');
    expect(caixas[0].checked).toBe(true);
  });

  test('início e fim levam as selecionadas para os extremos', () => {
    render(fotos('a', 'b', 'c', 'd'));
    marcar(1, 3);
    acao('inicio');
    expect(ids()).toBe('b,d,a,c');
    acao('fim');
    expect(ids()).toBe('a,c,b,d');
  });

  test('todas e limpar controlam a seleção', () => {
    render(fotos('a', 'b', 'c'));
    acao('todas');
    let caixas = el.galeriaPreview.querySelectorAll('.selecao-foto input');
    expect(Array.from(caixas).every((c) => c.checked)).toBe(true);
    acao('limpar');
    caixas = el.galeriaPreview.querySelectorAll('.selecao-foto input');
    expect(Array.from(caixas).some((c) => c.checked)).toBe(false);
  });

  test('excluir selecionadas remove apenas as marcadas após confirmação', async () => {
    global.confirmar.mockResolvedValue(true);
    render(fotos('a', 'b', 'c'));
    marcar(0, 2);
    el.galeriaPreview.querySelector('button[data-acao="excluir"]').click();
    await Promise.resolve();
    jest.runAllTimers();
    expect(ids()).toBe('b');
  });

  test('marcar a caixa não dispara a movimentação por teclado', () => {
    render(fotos('a', 'b'));
    const caixa = el.galeriaPreview.querySelectorAll('.selecao-foto input')[0];
    caixa.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(ids()).toBe('a,b');
  });
});

// ---------------------------------------------------------------------------
describe('Metadados e GPS na galeria', () => {
  let el, st, cb;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    el = criarElementos();
    st = { fotos: [], assinatura1: null, assinatura2: null };
    cb = { salvarRascunhoLocal: jest.fn() };
    GalleryManager.init(st, el, cb);
  });

  afterEach(() => jest.useRealTimers());

  function render(fotos) {
    st.fotos = fotos;
    GalleryManager.renderizarGaleria();
    jest.runAllTimers();
  }

  const btnGps = () =>
    Array.from(el.galeriaPreview.querySelectorAll('button')).find((b) =>
      b.classList.contains('btn-gps')
    );

  test('botão de GPS fica oculto quando a exibição de metadados está desligada', () => {
    el.checkboxMetadados.checked = false;
    render([criarFoto()]);
    expect(btnGps()).toBeUndefined();
  });

  test('botão de GPS aparece quando a exibição de metadados está ligada', () => {
    el.checkboxMetadados.checked = true;
    render([criarFoto()]);
    expect(btnGps()).toBeDefined();
  });

  test('prévia avisa quando a foto não tem GPS', () => {
    el.checkboxMetadados.checked = true;
    render([criarFoto({ metadadosExif: '🗓️ 01/09/2026 às 10:00' })]);
    expect(el.galeriaPreview.querySelector('.meta-preview').textContent).toContain(
      'Sem GPS na foto'
    );
  });

  test('mensagem antiga "Não encontrado na foto" não é exibida', () => {
    el.checkboxMetadados.checked = true;
    render([
      criarFoto({
        metadadosExif:
          '🗓️ 01/09/2026 às 10:00  📍 GPS: Não encontrado na foto (use o botão abaixo)',
      }),
    ]);
    const texto = el.galeriaPreview.querySelector('.meta-preview').textContent;
    expect(texto).not.toContain('Não encontrado');
    expect(texto).toContain('01/09/2026');
  });

  test('atualizar GPS pelo celular grava coordenada com origem e mantém a data', async () => {
    el.checkboxMetadados.checked = true;
    global.obterPosicaoAparelho.mockResolvedValue({ lat: -23.2, lng: -45.9, precisao: 8.4 });
    const foto = criarFoto({ metadadosExif: '🗓️ 01/09/2026 às 10:00' });
    render([foto]);

    btnGps().click();
    await Promise.resolve();
    await Promise.resolve();

    expect(foto.metadadosExif).toBe(
      '🗓️ 01/09/2026 às 10:00  📍 GPS: -23.200000, -45.900000 (celular, ±8 m)'
    );
    expect(cb.salvarRascunhoLocal).toHaveBeenCalled();
  });

  test('falha ao obter GPS avisa o usuário e não altera a foto', async () => {
    el.checkboxMetadados.checked = true;
    global.obterPosicaoAparelho.mockResolvedValue(null);
    const foto = criarFoto({ metadadosExif: '🗓️ 01/09/2026 às 10:00' });
    render([foto]);

    btnGps().click();
    await Promise.resolve();
    await Promise.resolve();

    expect(global.mostrarAlerta).toHaveBeenCalled();
    expect(foto.metadadosExif).toBe('🗓️ 01/09/2026 às 10:00');
  });
});
