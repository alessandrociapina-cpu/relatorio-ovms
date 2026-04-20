/* global esc, formatarDataISO, resolverDepartamento, criarBlocoAssinatura */
document.addEventListener('DOMContentLoaded', () => {
  const formVistoria = document.getElementById('form-vistoria');
  const inputLocalVistoria = document.getElementById('localVistoria');
  const inputDataVistoria = document.getElementById('dataVistoria');
  const inputHoraVistoria = document.getElementById('horaVistoria');
  
  const inputNomeFiscal = document.getElementById('nomeFiscal');
  const selectCargo = document.getElementById('cargoFiscal');
  const inputCargoOutros = document.getElementById('cargoFiscalOutros');
  const selectDepartamento = document.getElementById('departamentoFiscal');
  const inputDepartamentoOutros = document.getElementById('departamentoFiscalOutros');

  const checkboxIncluirFiscal2 = document.getElementById('incluirFiscal2');
  const blocoFiscal2 = document.getElementById('blocoFiscal2');
  const inputNomeFiscal2 = document.getElementById('nomeFiscal2');
  const selectCargo2 = document.getElementById('cargoFiscal2');
  const inputCargoOutros2 = document.getElementById('cargoFiscalOutros2');
  const selectDepartamento2 = document.getElementById('departamentoFiscal2');
  const inputDepartamentoOutros2 = document.getElementById('departamentoFiscalOutros2');

  const inputSelecionarFotos = document.getElementById('selecionarFotos');
  const galeriaPreview = document.getElementById('galeria-fotos-legenda');
  const btnGerarRelatorio = document.getElementById('btnGerarRelatorio');
  const btnGerarPDF = document.getElementById('btnGerarPDF');
  const btnAlternarPreview = document.getElementById('btnAlternarPreview');
  const inputObservacoes = document.getElementById('observacoesGerais');
  const areaRelatorio = document.getElementById('area-relatorio');
  const cabecalhoRelatorioDiv = document.getElementById('cabecalho-relatorio');
  const corpoRelatorioDiv = document.getElementById('corpo-relatorio');
  const observacoesFinaisRelatorioDiv = document.getElementById('observacoes-finais-relatorio');

  const imgLogoBase = new Image();
  imgLogoBase.src = 'sabesp-logo.png';

  const btnSalvarProjeto = document.getElementById('btnSalvarProjeto');
  const inputCarregarProjeto = document.getElementById('inputCarregarProjeto');
  const autoSaveStatus = document.getElementById('autoSaveStatus');

  function mostrarErro(input, msg) {
    input.classList.add('input-invalido');
    const id = `erro-${input.id}`;
    let span = document.getElementById(id);
    if (!span) {
      span = document.createElement('span');
      span.id = id;
      span.className = 'msg-erro-campo';
      input.parentNode.insertBefore(span, input.nextSibling);
    }
    span.textContent = msg;
  }

  function limparErro(input) {
    input.classList.remove('input-invalido');
    const span = document.getElementById(`erro-${input.id}`);
    if (span) span.remove();
  }

  function validarFiscal(inputNome, selectCargo, inputCargoOutros, selectDepto, inputDeptoOutros, label) {
    let valido = true;
    let primeiroErro = null;

    const nome = inputNome.value.trim();
    if (!nome) {
      mostrarErro(inputNome, `Informe o nome do ${label}.`);
      primeiroErro = inputNome;
      valido = false;
    } else if (nome.length < 3) {
      mostrarErro(inputNome, 'O nome deve ter pelo menos 3 caracteres.');
      primeiroErro = inputNome;
      valido = false;
    } else {
      limparErro(inputNome);
    }

    if (selectCargo.value === 'Outros') {
      const cargo = inputCargoOutros.value.trim();
      if (!cargo) {
        mostrarErro(inputCargoOutros, `Informe o cargo do ${label}.`);
        primeiroErro = primeiroErro || inputCargoOutros;
        valido = false;
      } else if (cargo.length < 2) {
        mostrarErro(inputCargoOutros, 'Mínimo de 2 caracteres.');
        primeiroErro = primeiroErro || inputCargoOutros;
        valido = false;
      } else {
        limparErro(inputCargoOutros);
      }
    } else {
      limparErro(inputCargoOutros);
    }

    if (selectDepto.value === 'Outros') {
      const depto = inputDeptoOutros.value.trim();
      if (!depto) {
        mostrarErro(inputDeptoOutros, `Informe o departamento do ${label}.`);
        primeiroErro = primeiroErro || inputDeptoOutros;
        valido = false;
      } else if (depto.length < 3) {
        mostrarErro(inputDeptoOutros, 'Mínimo de 3 caracteres.');
        primeiroErro = primeiroErro || inputDeptoOutros;
        valido = false;
      } else {
        limparErro(inputDeptoOutros);
      }
    } else {
      limparErro(inputDeptoOutros);
    }

    return { valido, primeiroErro };
  }

  function validarFormulario() {
    let valido = true;
    let primeiroErro = null;

    const local = inputLocalVistoria.value.trim();
    if (!local) {
      mostrarErro(inputLocalVistoria, 'Informe o local da vistoria.');
      primeiroErro = inputLocalVistoria;
      valido = false;
    } else if (local.length < 3) {
      mostrarErro(inputLocalVistoria, 'O local deve ter pelo menos 3 caracteres.');
      primeiroErro = inputLocalVistoria;
      valido = false;
    } else {
      limparErro(inputLocalVistoria);
    }

    if (!inputDataVistoria.value) {
      mostrarErro(inputDataVistoria, 'Informe a data da vistoria.');
      primeiroErro = primeiroErro || inputDataVistoria;
      valido = false;
    } else {
      limparErro(inputDataVistoria);
    }

    const r1 = validarFiscal(inputNomeFiscal, selectCargo, inputCargoOutros, selectDepartamento, inputDepartamentoOutros, '1º fiscal');
    if (!r1.valido) { valido = false; primeiroErro = primeiroErro || r1.primeiroErro; }

    if (checkboxIncluirFiscal2.checked) {
      const r2 = validarFiscal(inputNomeFiscal2, selectCargo2, inputCargoOutros2, selectDepartamento2, inputDepartamentoOutros2, '2º fiscal');
      if (!r2.valido) { valido = false; primeiroErro = primeiroErro || r2.primeiroErro; }
    } else {
      limparErro(inputNomeFiscal2);
      limparErro(inputCargoOutros2);
      limparErro(inputDepartamentoOutros2);
    }

    if (primeiroErro) {
      primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
      primeiroErro.focus();
    }

    return valido;
  }

  function vincularSelectOutros(selectEl, inputOutros) {
    selectEl.addEventListener('change', (e) => {
      const isOutros = e.target.value === 'Outros';
      inputOutros.style.display = isOutros ? 'inline-block' : 'none';
      if (isOutros) inputOutros.focus();
      else inputOutros.value = '';
      salvarRascunhoLocal();
    });
    inputOutros.addEventListener('input', salvarRascunhoLocal);
  }

  vincularSelectOutros(selectCargo, inputCargoOutros);
  vincularSelectOutros(selectDepartamento, inputDepartamentoOutros);
  vincularSelectOutros(selectCargo2, inputCargoOutros2);
  vincularSelectOutros(selectDepartamento2, inputDepartamentoOutros2);

  const checkboxAssinatura = document.getElementById('incluirAssinatura');
  const dicaAssinatura = document.getElementById('dicaAssinatura');
  
  const inputImagemAssinatura = document.getElementById('imagemAssinatura');
  const btnAssinaturaLabel = document.getElementById('btnAssinaturaLabel');
  const assinaturaStatus = document.getElementById('assinaturaStatus');
  const btnRemoverAssinatura = document.getElementById('btnRemoverAssinatura');
  let assinaturaBase64 = null;

  const inputImagemAssinatura2 = document.getElementById('imagemAssinatura2');
  const btnAssinaturaLabel2 = document.getElementById('btnAssinaturaLabel2');
  const assinaturaStatus2 = document.getElementById('assinaturaStatus2');
  const btnRemoverAssinatura2 = document.getElementById('btnRemoverAssinatura2');
  let assinaturaBase64_2 = null;

  function atualizarVisibilidadeAssinaturas() {
    dicaAssinatura.style.display = checkboxAssinatura.checked ? 'block' : 'none';
    
    if (checkboxAssinatura.checked) {
      btnAssinaturaLabel.style.display = 'inline-block';
      btnAssinaturaLabel2.style.display = checkboxIncluirFiscal2.checked ? 'inline-block' : 'none';
    } else {
      btnAssinaturaLabel.style.display = 'none';
      btnAssinaturaLabel2.style.display = 'none';
    }

    if (!checkboxAssinatura.checked) {
      assinaturaStatus.style.display = 'none';
      btnRemoverAssinatura.style.display = 'none';
      assinaturaStatus2.style.display = 'none';
      btnRemoverAssinatura2.style.display = 'none';
    } else {
      if (assinaturaBase64) {
        assinaturaStatus.style.display = 'inline-block';
        btnRemoverAssinatura.style.display = 'inline-block';
      }
      if (assinaturaBase64_2 && checkboxIncluirFiscal2.checked) {
        assinaturaStatus2.style.display = 'inline-block';
        btnRemoverAssinatura2.style.display = 'inline-block';
      } else {
        assinaturaStatus2.style.display = 'none';
        btnRemoverAssinatura2.style.display = 'none';
      }
    }
  }

  checkboxAssinatura.addEventListener('change', () => {
    atualizarVisibilidadeAssinaturas();
    salvarRascunhoLocal();
  });

  checkboxIncluirFiscal2.addEventListener('change', (e) => {
    blocoFiscal2.style.display = e.target.checked ? 'flex' : 'none';
    atualizarVisibilidadeAssinaturas();
    salvarRascunhoLocal();
  });

  inputImagemAssinatura.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        assinaturaBase64 = ev.target.result;
        atualizarVisibilidadeAssinaturas();
        salvarRascunhoLocal();
      };
      reader.readAsDataURL(file);
    }
  });

  inputImagemAssinatura2.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        assinaturaBase64_2 = ev.target.result;
        atualizarVisibilidadeAssinaturas();
        salvarRascunhoLocal();
      };
      reader.readAsDataURL(file);
    }
  });

  btnRemoverAssinatura.addEventListener('click', () => {
    assinaturaBase64 = null;
    inputImagemAssinatura.value = '';
    atualizarVisibilidadeAssinaturas();
    salvarRascunhoLocal();
  });

  btnRemoverAssinatura2.addEventListener('click', () => {
    assinaturaBase64_2 = null;
    inputImagemAssinatura2.value = '';
    atualizarVisibilidadeAssinaturas();
    salvarRascunhoLocal();
  });

  const checkboxMarca = document.getElementById('usarMarcaDagua');
  const divOpcoesMarca = document.getElementById('opcoesMarcaDagua');
  const selectPosicaoMarca = document.getElementById('posicaoMarcaDagua');
  const selectTamanhoMarca = document.getElementById('tamanhoMarcaDagua');
  const rangeOpacidadeMarca = document.getElementById('opacidadeMarcaDagua');
  const spanValorOpacidade = document.getElementById('valorOpacidade');
  const checkboxMetadados = document.getElementById('usarMetadados'); 

  const selectFonte = document.getElementById('fonteRelatorio');
  const selectTamanhoFonte = document.getElementById('tamanhoFonteRelatorio');

  const modalEditor = document.getElementById('modalEditor');
  const canvasEditor = document.getElementById('canvasEditor');
  const ctxEditor = canvasEditor.getContext('2d');
  const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
  const btnDesfazerSeta = document.getElementById('btnDesfazerSeta');
  const btnFecharModal = document.getElementById('btnFecharModal');
  const radiosFerramenta = document.querySelectorAll('input[name="ferramentaEdicao"]');
  const inputTextoEdicao = document.getElementById('textoEdicao');
  let ferramentaAtual = 'seta';
  
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const zoomLabel = document.getElementById('zoomLabel');
  let zoomLevel = 1;
  
  let fotoAtualEdicaoIndex = null;
  let isDrawing = false;
  let startX = 0, startY = 0;
  let historicoEdicao = []; 
  let lastStateImageData = null; 

  const modalCrop = document.getElementById('modalCrop');
  const imgCrop = document.getElementById('imgCrop');
  const btnAplicarCrop = document.getElementById('btnAplicarCrop');
  const btnFecharCrop = document.getElementById('btnFecharCrop');
  
  const btnCropLivre = document.getElementById('btnCropLivre');
  const btnCrop43 = document.getElementById('btnCrop43');
  const btnCrop34 = document.getElementById('btnCrop34');
  
  let cropperInstancia = null;
  let fotoAtualCropIndex = null;

  function setCropActiveBtn(activeBtn) {
    [btnCropLivre, btnCrop43, btnCrop34].forEach(btn => {
      btn.style.backgroundColor = '#6c757d';
    });
    activeBtn.style.backgroundColor = '#28a745';
  }

  btnCropLivre.addEventListener('click', (e) => { e.preventDefault(); if(cropperInstancia) { cropperInstancia.setAspectRatio(NaN); setCropActiveBtn(btnCropLivre); } });
  btnCrop43.addEventListener('click', (e) => { e.preventDefault(); if(cropperInstancia) { cropperInstancia.setAspectRatio(4/3); setCropActiveBtn(btnCrop43); } });
  btnCrop34.addEventListener('click', (e) => { e.preventDefault(); if(cropperInstancia) { cropperInstancia.setAspectRatio(3/4); setCropActiveBtn(btnCrop34); } });

  const inputSelecionarVideo = document.getElementById('selecionarVideo');
  const modalVideo = document.getElementById('modalVideo');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoSlider = document.getElementById('videoSlider');
  const btnVideoRewind = document.getElementById('btnVideoRewind');
  const btnVideoForward = document.getElementById('btnVideoForward');
  const btnCapturarFrame = document.getElementById('btnCapturarFrame');
  const btnFecharModalVideo = document.getElementById('btnFecharModalVideo');
  const msgFrameCapturado = document.getElementById('msgFrameCapturado');
  let videoFileName = '';

  let fotosSelecionadasParaRelatorio = [];

  function exportarEstado() {
    const borda = Array.from(document.querySelectorAll('input[name="bordaFotos"]')).find(r => r.checked)?.value || 'nenhuma';
    
    return {
      form: {
        local: inputLocalVistoria.value, data: inputDataVistoria.value, hora: inputHoraVistoria.value,
        fiscal: inputNomeFiscal.value, obs: inputObservacoes.value,
        incluirAssinatura: checkboxAssinatura.checked,
        assinaturaUrl: assinaturaBase64,
        cargo: selectCargo.value,
        cargoOutros: inputCargoOutros.value,
        departamento1: selectDepartamento.value,
        departamentoOutros1: inputDepartamentoOutros.value,
        
        incluirFiscal2: checkboxIncluirFiscal2.checked,
        nomeFiscal2: inputNomeFiscal2.value,
        cargo2: selectCargo2.value,
        cargoOutros2: inputCargoOutros2.value,
        departamento2: selectDepartamento2.value,
        departamentoOutros2: inputDepartamentoOutros2.value,
        assinaturaUrl2: assinaturaBase64_2,
        
        bordaFotos: borda
      },
      fotos: fotosSelecionadasParaRelatorio
    };
  }

  function carregarEstado(estado) {
    if(estado.form) {
      inputLocalVistoria.value = estado.form.local || ''; 
      inputDataVistoria.value = estado.form.data || '';
      inputHoraVistoria.value = estado.form.hora || ''; 
      inputNomeFiscal.value = estado.form.fiscal || '';
      inputObservacoes.value = estado.form.obs || '';
      
      if (estado.form.cargo) selectCargo.value = estado.form.cargo;
      if (estado.form.cargo === 'Outros') {
        inputCargoOutros.style.display = 'inline-block';
        inputCargoOutros.value = estado.form.cargoOutros || '';
      } else {
        inputCargoOutros.style.display = 'none';
      }

      if (estado.form.departamento1) selectDepartamento.value = estado.form.departamento1;
      if (estado.form.departamento && !estado.form.departamento1) selectDepartamento.value = estado.form.departamento;
      if (selectDepartamento.value === 'Outros') {
        inputDepartamentoOutros.style.display = 'inline-block';
        inputDepartamentoOutros.value = estado.form.departamentoOutros1 || estado.form.departamentoOutros || '';
      } else {
        inputDepartamentoOutros.style.display = 'none';
      }

      checkboxIncluirFiscal2.checked = estado.form.incluirFiscal2 || false;
      blocoFiscal2.style.display = checkboxIncluirFiscal2.checked ? 'flex' : 'none';
      inputNomeFiscal2.value = estado.form.nomeFiscal2 || '';
      
      if (estado.form.cargo2) selectCargo2.value = estado.form.cargo2;
      if (estado.form.cargo2 === 'Outros') {
        inputCargoOutros2.style.display = 'inline-block';
        inputCargoOutros2.value = estado.form.cargoOutros2 || '';
      } else {
        inputCargoOutros2.style.display = 'none';
      }

      if (estado.form.departamento2) selectDepartamento2.value = estado.form.departamento2;
      if (estado.form.departamento2 === 'Outros') {
        inputDepartamentoOutros2.style.display = 'inline-block';
        inputDepartamentoOutros2.value = estado.form.departamentoOutros2 || '';
      } else {
        inputDepartamentoOutros2.style.display = 'none';
      }

      checkboxAssinatura.checked = estado.form.incluirAssinatura || false;
      assinaturaBase64 = estado.form.assinaturaUrl || null;
      assinaturaBase64_2 = estado.form.assinaturaUrl2 || null;
      
      if (estado.form.bordaFotos) {
        const rb = document.querySelector(`input[name="bordaFotos"][value="${estado.form.bordaFotos}"]`);
        if (rb) rb.checked = true;
      }
      
      atualizarVisibilidadeAssinaturas();
    }
    if(estado.fotos) {
      fotosSelecionadasParaRelatorio = estado.fotos;
      renderizarGaleria();
    }
  }

  // =======================================================
  // MOTOR DE AUTO-SAVE COM INDEXEDDB
  // =======================================================
  const dbName = 'ovmsDB';
  const storeName = 'rascunhoStore';

  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function salvarDB(estado) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(estado, 'draft');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function carregarDB() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get('draft');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function limparDB() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete('draft');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  let timeoutSalvarRascunho; 

  function salvarRascunhoLocal() {
    clearTimeout(timeoutSalvarRascunho);
    autoSaveStatus.textContent = 'Digitando... (aguardando para salvar)';
    autoSaveStatus.style.color = '#6c757d';

    timeoutSalvarRascunho = setTimeout(async () => {
      try {
        const estado = exportarEstado();
        await salvarDB(estado);
        const agora = new Date();
        autoSaveStatus.textContent = `✔ Salvo às ${agora.getHours()}:${String(agora.getMinutes()).padStart(2, '0')}`;
        autoSaveStatus.style.color = 'green';
      } catch (e) {
        autoSaveStatus.textContent = `⚠️ Falha ao armazenar. Use "Baixar Projeto" para garantir!`;
        autoSaveStatus.style.color = '#d9534f';
        console.error('Falha interna no IndexedDB:', e);
      }
    }, 5000); 
  }

  formVistoria.addEventListener('input', salvarRascunhoLocal);

  [inputLocalVistoria, inputDataVistoria, inputNomeFiscal, inputCargoOutros,
   inputDepartamentoOutros, inputNomeFiscal2, inputCargoOutros2, inputDepartamentoOutros2
  ].forEach(input => input.addEventListener('input', () => limparErro(input)));

  btnSalvarProjeto.addEventListener('click', (e) => {
    e.preventDefault();
    const blob = new Blob([JSON.stringify(exportarEstado())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const dataArquivo = inputDataVistoria.value || 'sem-data';
    let localArquivo = inputLocalVistoria.value.trim();
    localArquivo = localArquivo ? localArquivo.replace(/[^a-zA-Z0-9-]/g, '_') : 'sem-local'; 
    
    a.download = `vistoria-${dataArquivo}-${localArquivo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  inputCarregarProjeto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        carregarEstado(JSON.parse(ev.target.result));
        alert("Projeto carregado com sucesso!");
        salvarRascunhoLocal();
      } catch(err) { alert("Erro ao ler o arquivo."); }
    };
    reader.readAsText(file);
    inputCarregarProjeto.value = ''; 
  });

  async function inicializarAutoSave() {
    try {
      const draftDB = await carregarDB();
      const draftLocal = localStorage.getItem('ovms_rascunho');

      let dataToRestore = draftDB;
      if (!dataToRestore && draftLocal) {
        dataToRestore = JSON.parse(draftLocal);
      }

      if(dataToRestore) {
        const localSalvo = (dataToRestore.form && dataToRestore.form.local) ? dataToRestore.form.local : 'Não informado';
        
        let dataSalva = 'Não informada';
        if (dataToRestore.form && dataToRestore.form.data) {
          dataSalva = formatarDataISO(dataToRestore.form.data) || 'Não informada';
        }

        const mensagemConfirma = `Encontramos um relatório em andamento salvo neste dispositivo:\n\n📍 Local: ${localSalvo}\n📅 Data: ${dataSalva}\n\nDeseja restaurar esta vistoria?`;

        if(confirm(mensagemConfirma)) {
          carregarEstado(dataToRestore);
          autoSaveStatus.textContent = 'Rascunho restaurado.';
        } else {
          await limparDB();
          localStorage.removeItem('ovms_rascunho');
        }
      }
    } catch (e) {
      console.error("Erro assíncrono ao recuperar o estado da vistoria:", e);
    }
  }
  
  inicializarAutoSave();

  radiosFerramenta.forEach(radio => {
    radio.addEventListener('change', (e) => {
      ferramentaAtual = e.target.value;
      if (ferramentaAtual === 'texto') {
        inputTextoEdicao.style.display = 'inline-block'; inputTextoEdicao.focus();
      } else {
        inputTextoEdicao.style.display = 'none';
      }
    });
  });

  function updateZoomDisplay() {
    if (zoomLevel <= 1) {
      canvasEditor.style.maxWidth = '100%'; canvasEditor.style.maxHeight = '60vh'; canvasEditor.style.width = 'auto'; canvasEditor.style.height = 'auto';
    } else {
      canvasEditor.style.maxWidth = 'none'; canvasEditor.style.maxHeight = 'none'; canvasEditor.style.width = `${Math.round(zoomLevel * 100)}%`; canvasEditor.style.height = 'auto';
    }
    zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
  }
  
  btnZoomIn.addEventListener('click', () => { zoomLevel = Math.min(zoomLevel + 0.2, 3); updateZoomDisplay(); });
  btnZoomOut.addEventListener('click', () => { zoomLevel = Math.max(zoomLevel - 0.2, 0.4); updateZoomDisplay(); });

  checkboxMarca.addEventListener('change', (e) => { divOpcoesMarca.style.display = e.target.checked ? 'flex' : 'none'; renderizarGaleria(); });
  rangeOpacidadeMarca.addEventListener('input', (e) => spanValorOpacidade.textContent = `${e.target.value}%`);
  checkboxMetadados.addEventListener('change', () => renderizarGaleria());

  const radiosBordaFotos = document.querySelectorAll('input[name="bordaFotos"]');
  radiosBordaFotos.forEach(r => r.addEventListener('change', salvarRascunhoLocal));

  const radiosLayout = formVistoria.querySelectorAll('input[name="layoutColunas"]');
  const radiosQualidade = formVistoria.querySelectorAll('input[name="qualidadeImagens"]');
  const radiosMargens = formVistoria.querySelectorAll('input[name="margensImpressao"]');

  inputSelecionarFotos.addEventListener('change', handleFotosSelecionadas);
  
  btnGerarRelatorio.addEventListener('click', (e) => { e.preventDefault(); gerarRelatorio(true); });
  
  btnGerarPDF.addEventListener('click', async (e) => { 
    e.preventDefault(); 
    await gerarRelatorio(true); 
    
    const tituloOriginal = document.title;
    const nomeObra = inputLocalVistoria.value.trim();
    document.title = nomeObra ? `Relatório Fotográfico - ${nomeObra}` : 'Relatório Fotográfico';
    
    setTimeout(() => { 
      window.print(); 
      document.title = tituloOriginal;
    }, 500); 
  });

  btnAlternarPreview.addEventListener('click', () => { document.body.classList.toggle('preview-print'); areaRelatorio.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  function lerMetadadosExif(file) {
    return new Promise((resolve) => {
      if (typeof EXIF === 'undefined' || !file.type.startsWith('image/')) { resolve(''); return; }
      
      EXIF.getData(file, function() {
        let textoMeta = '';
        const dataExif = EXIF.getTag(this, "DateTimeOriginal");
        if (dataExif) {
          const partes = dataExif.split(' '); 
          if (partes.length === 2) textoMeta += `🗓️ ${partes[0].split(':').reverse().join('/')} às ${partes[1].substring(0, 5)}  `;
        }
        
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lng = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lngRef = EXIF.getTag(this, "GPSLongitudeRef");

        if (lat !== undefined && lng !== undefined) {
          try {
            const extrairVetor = (coords) => {
              if (typeof coords === 'number') return coords;
              if (typeof coords === 'string') return parseFloat(coords); 
              if (coords && coords.length >= 3) {
                const d = coords[0].valueOf ? coords[0].valueOf() : parseFloat(coords[0]) || 0;
                const m = coords[1].valueOf ? coords[1].valueOf() : parseFloat(coords[1]) || 0;
                const s = coords[2].valueOf ? coords[2].valueOf() : parseFloat(coords[2]) || 0;
                return d + (m / 60) + (s / 3600);
              }
              return 0;
            };

            let calcLat = extrairVetor(lat);
            let calcLng = extrairVetor(lng);

            if (latRef === "S") calcLat = Math.abs(calcLat) * -1; else if (latRef === "N") calcLat = Math.abs(calcLat);
            if (lngRef === "W") calcLng = Math.abs(calcLng) * -1; else if (lngRef === "E") calcLng = Math.abs(calcLng);

            if (calcLat !== 0 && calcLng !== 0 && !isNaN(calcLat) && !isNaN(calcLng)) {
              textoMeta += `📍 GPS: ${calcLat.toFixed(6)}, ${calcLng.toFixed(6)}`;
            } else {
              textoMeta += `📍 GPS: Removido pelo sistema do aparelho celular`;
            }
          } catch (e) {
            textoMeta += `📍 GPS: Falha na leitura`;
          }
        } else {
          textoMeta += `📍 GPS: Bloqueado pelo aparelho celular (Use o botão abaixo)`;
        }
        resolve(textoMeta.trim());
      });
    });
  }

  function redimensionarImagem(dataUrl, maxWidth, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const ratio = img.width / img.height;
        canvas.width = Math.min(img.width, maxWidth);
        canvas.height = canvas.width / ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject; img.src = dataUrl;
    });
  }

  function girarImagemDiretoNaGaleria(index, graus) {
    const foto = fotosSelecionadasParaRelatorio[index];
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (Math.abs(graus) === 90 || Math.abs(graus) === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((graus * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const novaImagemBase64 = canvas.toDataURL('image/jpeg', 0.9);
      foto.originalDataUrl = novaImagemBase64;
      foto.previewDataUrl = await redimensionarImagem(novaImagemBase64, 1024, 0.7);
      foto.editedPreviewDataUrl = null; 

      renderizarGaleria();
      salvarRascunhoLocal();
    };
    img.src = foto.originalDataUrl;
  }

  async function handleFotosSelecionadas(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    galeriaPreview.innerHTML = '<h4>Processando imagens... Por favor, aguarde.</h4>';
    const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const novasFotos = new Array(sortedFiles.length);

    async function processarFoto(file, index) {
      if (!file.type.startsWith('image/')) { novasFotos[index] = null; return; }
      const metadadosExtraidos = await lerMetadadosExif(file);
      const originalDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      try {
        const resizedPreview = await redimensionarImagem(originalDataUrl, 1024, 0.7);
        novasFotos[index] = {
          id: `foto-${Date.now()}-${index}`, fileName: file.name,
          originalDataUrl: originalDataUrl,
          previewDataUrl: resizedPreview,
          editedPreviewDataUrl: null,
          textoLegenda: '', metadadosExif: metadadosExtraidos, ocultarLogo: false, ocultarMetadados: false
        };
      } catch (error) { novasFotos[index] = null; }
    }

    const promises = sortedFiles.map((file, index) => processarFoto(file, index));

    await Promise.all(promises);
    fotosSelecionadasParaRelatorio = [...fotosSelecionadasParaRelatorio, ...novasFotos.filter(f => f !== null)];
    inputSelecionarFotos.value = '';
    renderizarGaleria();
    salvarRascunhoLocal(); 
  }

  function renderizarGaleria() {
    galeriaPreview.innerHTML = '';
    if (fotosSelecionadasParaRelatorio.length === 0) {
      galeriaPreview.innerHTML = '<p>Nenhuma foto selecionada.</p>';
      return;
    }

    const logoGlobalAtivo = checkboxMarca.checked;
    const mostrarMetadados = checkboxMetadados.checked; 

    fotosSelecionadasParaRelatorio.forEach((fotoInfo, idx) => {
      const itemPreviewDiv = document.createElement('div');
      itemPreviewDiv.classList.add('foto-legenda-item-preview');

      const imgElement = document.createElement('img');
      imgElement.src = fotoInfo.editedPreviewDataUrl || fotoInfo.previewDataUrl;
      
      const legendaTextarea = document.createElement('textarea');
      legendaTextarea.placeholder = `Legenda para ${fotoInfo.fileName}`;
      legendaTextarea.value = fotoInfo.textoLegenda || ''; 
      legendaTextarea.addEventListener('input', (e) => { 
        fotoInfo.textoLegenda = e.target.value; 
        salvarRascunhoLocal(); 
      });

      const acoesDiv = document.createElement('div');
      acoesDiv.classList.add('acoes-foto');

      const btnSubir = document.createElement('button'); btnSubir.innerHTML = '▲'; btnSubir.title = 'Subir foto'; btnSubir.classList.add('btn-acao-foto');
      btnSubir.disabled = idx === 0; btnSubir.onclick = () => { moverFoto(idx, -1); };
      
      const btnDescer = document.createElement('button'); btnDescer.innerHTML = '▼'; btnDescer.title = 'Descer foto'; btnDescer.classList.add('btn-acao-foto');
      btnDescer.disabled = idx === fotosSelecionadasParaRelatorio.length - 1; btnDescer.onclick = () => { moverFoto(idx, 1); };

      const btnGirarEsq = document.createElement('button'); btnGirarEsq.innerHTML = '↺ Esq.'; btnGirarEsq.classList.add('btn-acao-foto');
      btnGirarEsq.onclick = () => girarImagemDiretoNaGaleria(idx, -90);

      const btnGirarDir = document.createElement('button'); btnGirarDir.innerHTML = '↻ Dir.'; btnGirarDir.classList.add('btn-acao-foto');
      btnGirarDir.onclick = () => girarImagemDiretoNaGaleria(idx, 90);

      const btnCrop = document.createElement('button'); btnCrop.innerHTML = '✂️ Cortar'; btnCrop.classList.add('btn-acao-foto'); 
      btnCrop.onclick = () => abrirCrop(idx);

      const btnEditar = document.createElement('button'); btnEditar.innerHTML = '✏️ Desenhar'; btnEditar.classList.add('btn-acao-foto', 'btn-editar'); 
      btnEditar.onclick = () => abrirEditor(idx);

      const btnRestaurar = document.createElement('button');
      btnRestaurar.innerHTML = '↩️ Limpar'; btnRestaurar.classList.add('btn-acao-foto', 'btn-restaurar');
      btnRestaurar.title = 'Remove cortes e desenhos';
      btnRestaurar.onclick = async () => {
        if(confirm('Deseja remover todos os recortes e desenhos desta foto?')) {
          fotoInfo.previewDataUrl = await redimensionarImagem(fotoInfo.originalDataUrl, 1024, 0.7);
          fotoInfo.editedPreviewDataUrl = null;
          renderizarGaleria(); salvarRascunhoLocal();
        }
      };

      const btnToggleLogo = document.createElement('button');
      btnToggleLogo.innerHTML = fotoInfo.ocultarLogo ? '+ Logo' : '- Logo'; btnToggleLogo.classList.add('btn-acao-foto');
      btnToggleLogo.disabled = !logoGlobalAtivo; if (fotoInfo.ocultarLogo && logoGlobalAtivo) btnToggleLogo.classList.add('btn-logo-off');
      btnToggleLogo.onclick = () => { fotoInfo.ocultarLogo = !fotoInfo.ocultarLogo; renderizarGaleria(); salvarRascunhoLocal(); };

      const btnToggleMeta = document.createElement('button');
      btnToggleMeta.innerHTML = fotoInfo.ocultarMetadados ? '+ Dados' : '- Dados'; btnToggleMeta.classList.add('btn-acao-foto');
      btnToggleMeta.disabled = !mostrarMetadados || !fotoInfo.metadadosExif; 
      if (fotoInfo.ocultarMetadados && mostrarMetadados && fotoInfo.metadadosExif) btnToggleMeta.classList.add('btn-logo-off');
      btnToggleMeta.onclick = () => { fotoInfo.ocultarMetadados = !fotoInfo.ocultarMetadados; renderizarGaleria(); salvarRascunhoLocal(); };

      const btnRemover = document.createElement('button'); btnRemover.innerHTML = '✖ Excluir'; btnRemover.classList.add('btn-acao-foto', 'btn-remover');
      btnRemover.onclick = () => { fotosSelecionadasParaRelatorio.splice(idx, 1); renderizarGaleria(); salvarRascunhoLocal(); };

      const btnGPSAtual = document.createElement('button');
      btnGPSAtual.innerHTML = '📍 Atualizar GPS pelo Celular';
      btnGPSAtual.classList.add('btn-acao-foto', 'btn-gps');
      btnGPSAtual.title = 'Usa a antena GPS do aparelho celular para preencher a localização';
      
      btnGPSAtual.onclick = () => {
        if(navigator.geolocation) {
          btnGPSAtual.innerHTML = '⏳ Procurando...';
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const nLat = pos.coords.latitude.toFixed(6);
              const nLng = pos.coords.longitude.toFixed(6);
              
              let metaAtual = fotoInfo.metadadosExif || '';
              if (metaAtual.includes('📍')) {
                metaAtual = metaAtual.split('📍')[0].trim();
              }
              fotoInfo.metadadosExif = metaAtual + `  📍 GPS: ${nLat}, ${nLng}`;
              renderizarGaleria();
              salvarRascunhoLocal();
            },
            (_err) => {
              alert('Por favor, ative a Localização (GPS) no seu celular e dê permissão ao navegador.');
              btnGPSAtual.innerHTML = '📍 Atualizar GPS pelo Celular';
            },
            { enableHighAccuracy: true }
          );
        } else {
          alert('GPS não suportado neste navegador.');
        }
      };

      acoesDiv.append(btnSubir, btnDescer, btnGirarEsq, btnGirarDir, btnCrop, btnEditar, btnRestaurar, btnToggleLogo, btnToggleMeta, btnRemover, btnGPSAtual);
      itemPreviewDiv.appendChild(imgElement);

      if (fotoInfo.metadadosExif && mostrarMetadados && !fotoInfo.ocultarMetadados) {
        const metaInfoPreview = document.createElement('div');
        metaInfoPreview.style.fontSize = '0.75em'; metaInfoPreview.style.color = '#777'; metaInfoPreview.style.marginBottom = '5px';
        metaInfoPreview.innerText = fotoInfo.metadadosExif;
        itemPreviewDiv.appendChild(metaInfoPreview);
      }
      itemPreviewDiv.appendChild(legendaTextarea);
      itemPreviewDiv.appendChild(acoesDiv);
      galeriaPreview.appendChild(itemPreviewDiv);
    });
  }

  function moverFoto(index, direcao) {
    const novo = index + direcao;
    const temp = fotosSelecionadasParaRelatorio[index];
    fotosSelecionadasParaRelatorio[index] = fotosSelecionadasParaRelatorio[novo];
    fotosSelecionadasParaRelatorio[novo] = temp;
    renderizarGaleria(); salvarRascunhoLocal();
  }

  function abrirCrop(index) {
    fotoAtualCropIndex = index;
    const foto = fotosSelecionadasParaRelatorio[index];
    imgCrop.src = foto.previewDataUrl; 
    modalCrop.classList.remove('modal-oculto');
    
    setCropActiveBtn(btnCropLivre);

    imgCrop.onload = () => {
      if(cropperInstancia) cropperInstancia.destroy();
      cropperInstancia = new Cropper(imgCrop, {
        viewMode: 1, 
        autoCropArea: 1, 
        background: false,
        zoomable: true,       
        zoomOnWheel: false,   
        zoomOnTouch: false,   
        transition: false     
      });
    };
  }

  function fecharCrop() {
    modalCrop.classList.add('modal-oculto');
    if (cropperInstancia) { cropperInstancia.destroy(); cropperInstancia = null; }
    fotoAtualCropIndex = null;
  }
  
  btnAplicarCrop.onclick = (e) => {
    e.preventDefault();
    const canvasRecortado = cropperInstancia.getCroppedCanvas();
    const recortadaDataUrl = canvasRecortado.toDataURL('image/jpeg', 0.8);
    fotosSelecionadasParaRelatorio[fotoAtualCropIndex].previewDataUrl = recortadaDataUrl;
    fotosSelecionadasParaRelatorio[fotoAtualCropIndex].editedPreviewDataUrl = null; 
    renderizarGaleria(); salvarRascunhoLocal(); fecharCrop();
  };
  btnFecharCrop.onclick = (e) => { e.preventDefault(); fecharCrop(); };

  function abrirEditor(index) {
    fotoAtualEdicaoIndex = index;
    const foto = fotosSelecionadasParaRelatorio[index];
    zoomLevel = 1; updateZoomDisplay();

    const imgBase = new Image();
    imgBase.onload = () => {
      canvasEditor.width = imgBase.width; canvasEditor.height = imgBase.height;
      ctxEditor.drawImage(imgBase, 0, 0);
      historicoEdicao = [canvasEditor.toDataURL()]; 
      modalEditor.classList.remove('modal-oculto');
    };
    imgBase.src = foto.editedPreviewDataUrl || foto.previewDataUrl; 
  }

  function fecharEditor() {
    modalEditor.classList.add('modal-oculto');
    fotoAtualEdicaoIndex = null; historicoEdicao = [];
  }

  function drawArrow(ctx, fromx, fromy, tox, toy) {
    const headlen = Math.max(15, canvasEditor.width * 0.03); 
    const angle = Math.atan2(toy - fromy, tox - fromx);
    ctx.beginPath(); ctx.moveTo(fromx, fromy); ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = 'red'; ctx.lineWidth = Math.max(4, canvasEditor.width * 0.008); ctx.lineCap = 'round'; ctx.stroke();
  }

  function drawCircle(ctx, x, y, radiusX, radiusY) {
    ctx.beginPath(); ctx.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = 'red'; ctx.lineWidth = Math.max(4, canvasEditor.width * 0.008); ctx.stroke();
  }

  function getPos(e) {
    const rect = canvasEditor.getBoundingClientRect();
    const scaleX = canvasEditor.width / rect.width, scaleY = canvasEditor.height / rect.height;
    let cx = e.clientX, cy = e.clientY;
    if (e.touches && e.touches.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  }

  function startDrawing(e) {
    e.preventDefault();
    const pos = getPos(e);
    if (ferramentaAtual === 'texto') {
      const txt = inputTextoEdicao.value.trim();
      if (txt !== '') {
        const fontSize = Math.max(20, canvasEditor.width * 0.04);
        ctxEditor.font = `bold ${fontSize}px Arial`; ctxEditor.fillStyle = 'red'; ctxEditor.strokeStyle = 'white';
        ctxEditor.lineWidth = Math.max(2, fontSize * 0.1); ctxEditor.textBaseline = "middle";
        ctxEditor.strokeText(txt, pos.x, pos.y); ctxEditor.fillText(txt, pos.x, pos.y);
        historicoEdicao.push(canvasEditor.toDataURL());
      } else { alert('Digite o texto na barra superior antes de clicar na foto.'); inputTextoEdicao.focus(); }
      return; 
    }
    isDrawing = true; startX = pos.x; startY = pos.y;
    lastStateImageData = ctxEditor.getImageData(0, 0, canvasEditor.width, canvasEditor.height);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctxEditor.putImageData(lastStateImageData, 0, 0);
    if (ferramentaAtual === 'seta') drawArrow(ctxEditor, startX, startY, pos.x, pos.y);
    else if (ferramentaAtual === 'circulo') drawCircle(ctxEditor, startX, startY, Math.abs(pos.x - startX), Math.abs(pos.y - startY));
  }

  function stopDrawing(e) {
    if (!isDrawing) return;
    e.preventDefault(); isDrawing = false;
    historicoEdicao.push(canvasEditor.toDataURL());
  }

  canvasEditor.addEventListener('mousedown', startDrawing); canvasEditor.addEventListener('mousemove', draw);
  canvasEditor.addEventListener('mouseup', stopDrawing); canvasEditor.addEventListener('mouseout', stopDrawing);
  canvasEditor.addEventListener('touchstart', startDrawing, {passive: false}); canvasEditor.addEventListener('touchmove', draw, {passive: false}); canvasEditor.addEventListener('touchend', stopDrawing);

  btnSalvarEdicao.addEventListener('click', (e) => {
    e.preventDefault();
    if (fotoAtualEdicaoIndex !== null) {
      fotosSelecionadasParaRelatorio[fotoAtualEdicaoIndex].editedPreviewDataUrl = canvasEditor.toDataURL('image/jpeg', 0.8);
      renderizarGaleria(); salvarRascunhoLocal();
    }
    fecharEditor();
  });

  btnDesfazerSeta.addEventListener('click', (e) => {
    e.preventDefault();
    if (historicoEdicao.length > 1) {
      historicoEdicao.pop(); 
      const imgAnterior = new Image();
      imgAnterior.onload = () => { ctxEditor.clearRect(0, 0, canvasEditor.width, canvasEditor.height); ctxEditor.drawImage(imgAnterior, 0, 0); };
      imgAnterior.src = historicoEdicao[historicoEdicao.length - 1];
    }
  });

  btnFecharModal.addEventListener('click', (e) => { e.preventDefault(); fecharEditor(); });

  inputSelecionarVideo.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    videoFileName = file.name; videoPlayer.src = URL.createObjectURL(file);
    videoPlayer.onloadedmetadata = () => { videoSlider.max = videoPlayer.duration; modalVideo.classList.remove('modal-oculto'); };
    inputSelecionarVideo.value = ''; 
  });

  videoPlayer.addEventListener('timeupdate', () => videoSlider.value = videoPlayer.currentTime);
  videoSlider.addEventListener('input', (e) => videoPlayer.currentTime = e.target.value);
  btnVideoRewind.addEventListener('click', (e) => { e.preventDefault(); videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 0.1); });
  btnVideoForward.addEventListener('click', (e) => { e.preventDefault(); videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 0.1); });

  btnCapturarFrame.addEventListener('click', async (e) => {
    e.preventDefault();
    const canvas = document.createElement('canvas');
    canvas.width = videoPlayer.videoWidth; canvas.height = videoPlayer.videoHeight;
    canvas.getContext('2d').drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
    const originalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    fotosSelecionadasParaRelatorio.push({
      id: `foto-${Date.now()}`, fileName: `Frame de ${videoFileName}`,
      originalDataUrl: originalDataUrl, previewDataUrl: await redimensionarImagem(originalDataUrl, 1024, 0.7),
      editedPreviewDataUrl: null, textoLegenda: `Extraído do vídeo: ${videoFileName}`,
      metadadosExif: '', ocultarLogo: false, ocultarMetadados: false 
    });
    renderizarGaleria(); salvarRascunhoLocal();
    msgFrameCapturado.style.display = 'block'; setTimeout(() => msgFrameCapturado.style.display = 'none', 2500);
  });
  btnFecharModalVideo.addEventListener('click', (e) => { e.preventDefault(); modalVideo.classList.add('modal-oculto'); videoPlayer.pause(); videoPlayer.src = ''; });

  function getOpcoesRelatorio() {
    const layout = Array.from(radiosLayout).find(r => r.checked)?.value || '2';
    const qualidade = Array.from(radiosQualidade).find(r => r.checked)?.value || 'media';
    const margens = Array.from(radiosMargens).find(r => r.checked)?.value || 'maiores';
    const borda = Array.from(document.querySelectorAll('input[name="bordaFotos"]')).find(r => r.checked)?.value || 'nenhuma';
    const mapaQualidade = { media: { largura: 1024, qualidade: 0.7 }, maxima: { largura: 1600, qualidade: 0.8 } };
    const mapaMargens = { menores: 5, maiores: 15 };
    return {
      layoutColunas: layout, largura: mapaQualidade[qualidade].largura, qualidade: mapaQualidade[qualidade].qualidade,
      margensMm: mapaMargens[margens], usarMarca: checkboxMarca.checked, posMarca: selectPosicaoMarca.value, 
      tamMarca: selectTamanhoMarca.value, opacMarca: parseInt(rangeOpacidadeMarca.value, 10) / 100, 
      fonte: selectFonte.value, tamanhoFonte: selectTamanhoFonte.value, usarMetadados: checkboxMetadados.checked,
      bordaFotos: borda
    };
  }

  function applyPrintMargins(mm) {
    const STYLE_ID = 'print-margins-style'; let styleTag = document.getElementById(STYLE_ID);
    const css = `@page { size: A4 portrait; margin: ${mm}mm; }`;
    if (!styleTag) { styleTag = document.createElement('style'); styleTag.id = STYLE_ID; styleTag.setAttribute('media', 'print'); document.head.appendChild(styleTag); }
    styleTag.textContent = css;
  }

  async function gerarRelatorio(ativarPreview = true) {
    if (!validarFormulario()) return;
    const fotosValidas = fotosSelecionadasParaRelatorio.filter(f => f && f.originalDataUrl);
    if (fotosValidas.length === 0) { alert('Selecione pelo menos uma foto.'); return; }

    const opt = getOpcoesRelatorio();
    cabecalhoRelatorioDiv.innerHTML = ''; corpoRelatorioDiv.innerHTML = ''; observacoesFinaisRelatorioDiv.innerHTML = '';

    const local = inputLocalVistoria.value; const data = new Date(inputDataVistoria.value + 'T00:00:00');
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaHtml = inputHoraVistoria.value ? `<p><strong>Hora:</strong> ${esc(inputHoraVistoria.value)}</p>` : '';
    
    areaRelatorio.style.fontFamily = opt.fonte; areaRelatorio.style.fontSize = `${opt.tamanhoFonte}pt`;
    cabecalhoRelatorioDiv.innerHTML = `
      <div class="cabecalho-principal">
        <div class="espacador-logo"></div>
        <div class="titulos-cabecalho">
          <div class="titulo-companhia">COMPANHIA DE SANEAMENTO BÁSICO DO ESTADO DE SÃO PAULO</div>
          <h2 class="titulo-vistoria">RELATÓRIO FOTOGRÁFICO DE VISTORIA</h2>
        </div>
        <img src="sabesp-logo.png" alt="Logo" class="logo-relatorio-direito">
      </div>
      <div class="info-vistoria"><p><strong>Local da Vistoria:</strong> ${esc(local)}</p><p><strong>Data da Vistoria:</strong> ${esc(dataFormatada)}</p>${horaHtml}</div>
    `;

    areaRelatorio.classList.remove('layout-1-col'); if (opt.layoutColunas === '1') areaRelatorio.classList.add('layout-1-col');
    applyPrintMargins(opt.margensMm);

    const imagensProcessadas = await Promise.all(fotosValidas.map(async (f, i) => {
      const base = f.editedPreviewDataUrl || f.previewDataUrl;
      return { url: await redimensionarImagem(base, opt.largura, opt.qualidade), leg: `Imagem ${i + 1}: ${(f.textoLegenda || '').trim() || 'Sem legenda'}`, meta: f.metadadosExif, noLogo: f.ocultarLogo, noMeta: f.ocultarMetadados };
    }));

    imagensProcessadas.forEach((imgObj) => {
      const itemDiv = document.createElement('div'); itemDiv.classList.add('item-relatorio');
      const wrapper = document.createElement('div'); wrapper.classList.add('imagem-wrapper');
      
      const imgEl = document.createElement('img'); 
      imgEl.src = imgObj.url; 
      imgEl.classList.add('foto-principal'); 
      
      if (opt.bordaFotos === 'preta-2pt') {
        imgEl.classList.add('borda-preta-2pt');
      }

      wrapper.appendChild(imgEl);
      
      if (opt.usarMarca && !imgObj.noLogo) {
        const logo = document.createElement('img'); logo.src = 'sabesp-logo.png'; logo.classList.add('marca-dagua-overlay', `pos-${opt.posMarca}`, opt.tamMarca); logo.style.opacity = opt.opacMarca; wrapper.appendChild(logo);
      }
      const legP = document.createElement('p'); legP.classList.add('legenda'); legP.textContent = imgObj.leg;
      itemDiv.appendChild(wrapper); itemDiv.appendChild(legP);
      if (imgObj.meta && opt.usarMetadados && !imgObj.noMeta) {
        const metaP = document.createElement('p'); metaP.classList.add('metadados-foto'); metaP.textContent = imgObj.meta; itemDiv.appendChild(metaP);
      }
      corpoRelatorioDiv.appendChild(itemDiv);
    });

    let assinaturaHtml = '';
    if (checkboxAssinatura.checked) {
      const nome1 = inputNomeFiscal.value.trim() || '1º Fiscal/Inspetor';
      const cargo1 = selectCargo.value === 'Outros' ? inputCargoOutros.value.trim() : selectCargo.value;
      const deptoFinal1 = resolverDepartamento(selectDepartamento.value, inputDepartamentoOutros.value);

      let bloco2 = '';
      if (checkboxIncluirFiscal2.checked) {
        const nome2 = inputNomeFiscal2.value.trim() || '2º Fiscal/Inspetor';
        const cargo2 = selectCargo2.value === 'Outros' ? inputCargoOutros2.value.trim() : selectCargo2.value;
        const deptoFinal2 = resolverDepartamento(selectDepartamento2.value, inputDepartamentoOutros2.value);
        bloco2 = criarBlocoAssinatura(nome2, cargo2, deptoFinal2, assinaturaBase64_2);
      }

      assinaturaHtml = `
        <div class="assinaturas-container">
          ${criarBlocoAssinatura(nome1, cargo1, deptoFinal1, assinaturaBase64)}
          ${bloco2}
        </div>
      `;
    }

    let obsFinalHtml = '';
    if (inputObservacoes.value.trim()) {
      obsFinalHtml += `<h3>Observações Gerais</h3><p>${esc(inputObservacoes.value.trim())}</p>`;
    }
    if (assinaturaHtml) {
      obsFinalHtml += assinaturaHtml;
    }
    observacoesFinaisRelatorioDiv.innerHTML = obsFinalHtml;

    // --- NOVA LÓGICA DO RODAPÉ DINÂMICO (v36) ---
    const rodapeDiv = document.querySelector('.rodape-texto');
    if (rodapeDiv) {
      const isOutros1 = selectDepartamento.value === 'Outros';
      const isOutros2 = checkboxIncluirFiscal2.checked && selectDepartamento2.value === 'Outros';

      if (isOutros1 || isOutros2) {
        // Pega o nome do departamento customizado digitado (prioridade para o fiscal 1)
        let deptoNome = '';
        if (isOutros1 && inputDepartamentoOutros.value.trim() !== '') {
          deptoNome = inputDepartamentoOutros.value.trim();
        } else if (isOutros2 && inputDepartamentoOutros2.value.trim() !== '') {
          deptoNome = inputDepartamentoOutros2.value.trim();
        }

        if (deptoNome !== '') {
          rodapeDiv.innerHTML = `Companhia de Saneamento Básico do Estado de São Paulo – Sabesp<br>
          <span contenteditable="true" style="display:inline-block; outline:none;">${esc(deptoNome)}</span><br>
          <span>www.sabesp.com.br</span>`;
        } else {
          // Se escolheu 'Outros' mas deixou a caixa em branco
          rodapeDiv.innerHTML = `Companhia de Saneamento Básico do Estado de São Paulo – Sabesp<br>
          <span>www.sabesp.com.br</span>`;
        }
      } else {
        // Padrão
        rodapeDiv.innerHTML = `Companhia de Saneamento Básico do Estado de São Paulo – Sabesp<br>
        <span contenteditable="true" style="display:inline-block; outline:none;">Divisão de Manutenção e Serviços Operacionais de São José dos Campos - OVMS</span><br>
        <span contenteditable="true" style="display: inline-block; outline: none; min-width: 100%;">Rua Euclides Miragaia, 126, Centro - CEP 12.245-820 - São José dos Campos - SP</span><br>
        <span>www.sabesp.com.br</span>`;
      }
    }
    // -------------------------------------------

    areaRelatorio.style.display = 'table';
    if (ativarPreview) document.body.classList.add('preview-print');
    areaRelatorio.scrollIntoView({ behavior: 'smooth' });
  }
});
