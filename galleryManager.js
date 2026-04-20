/* global mostrarAlerta, confirmar, lerMetadadosExif */
'use strict';

const GalleryManager = (() => {
  let _st, _el, _cb;

  // Editor state
  let _ferramentaAtual = 'seta';
  let _zoomLevel = 1;
  let _fotoAtualEdicaoIndex = null;
  let _isDrawing = false;
  let _startX = 0,
    _startY = 0;
  let _historicoEdicao = [];
  let _lastStateImageData = null;
  let _ctxEditor = null;

  // Crop state
  let _cropperInstancia = null;
  let _fotoAtualCropIndex = null;

  // Video state
  let _videoFileName = '';

  // Debounce + focus state
  let _renderTimeout = null;
  let _focusedIndex = null;

  function init(state, elements, callbacks) {
    _st = state;
    _el = elements;
    _cb = callbacks; // { salvarRascunhoLocal }
    _ctxEditor = _el.canvasEditor.getContext('2d');
    _bindEvents();
  }

  // --- Image utilities ---

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
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function girarImagemDiretoNaGaleria(index, graus) {
    const foto = _st.fotos[index];
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
      _cb.salvarRascunhoLocal();
    };
    img.src = foto.originalDataUrl;
  }

  async function handleFotosSelecionadas(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    _el.galeriaPreview.innerHTML = '<h4>Processando imagens... Por favor, aguarde.</h4>';
    const sortedFiles = Array.from(files).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    const novasFotos = new Array(sortedFiles.length);

    async function processarFoto(file, index) {
      if (!file.type.startsWith('image/')) {
        novasFotos[index] = null;
        return;
      }
      const metadadosExtraidos = await lerMetadadosExif(file);
      const originalDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      try {
        const resizedPreview = await redimensionarImagem(originalDataUrl, 1024, 0.7);
        novasFotos[index] = {
          id: `foto-${Date.now()}-${index}`,
          fileName: file.name,
          originalDataUrl,
          previewDataUrl: resizedPreview,
          editedPreviewDataUrl: null,
          textoLegenda: '',
          metadadosExif: metadadosExtraidos,
          ocultarLogo: false,
          ocultarMetadados: false,
        };
      } catch (_err) {
        novasFotos[index] = null;
      }
    }

    await Promise.all(sortedFiles.map((file, index) => processarFoto(file, index)));
    _st.fotos = [..._st.fotos, ...novasFotos.filter((f) => f !== null)];
    _el.inputSelecionarFotos.value = '';
    renderizarGaleria();
    _cb.salvarRascunhoLocal();
  }

  // --- Gallery rendering (debounced) ---

  function renderizarGaleria() {
    clearTimeout(_renderTimeout);
    _renderTimeout = setTimeout(_doRenderizarGaleria, 50);
  }

  function _doRenderizarGaleria() {
    _el.galeriaPreview.innerHTML = '';
    if (_st.fotos.length === 0) {
      _el.galeriaPreview.innerHTML = '<p>Nenhuma foto selecionada.</p>';
      return;
    }

    const logoGlobalAtivo = _el.checkboxMarca.checked;
    const mostrarMetadados = _el.checkboxMetadados.checked;

    _st.fotos.forEach((fotoInfo, idx) => {
      const itemPreviewDiv = document.createElement('div');
      itemPreviewDiv.classList.add('foto-legenda-item-preview');
      itemPreviewDiv.setAttribute('tabindex', '0');
      itemPreviewDiv.setAttribute('role', 'article');
      itemPreviewDiv.setAttribute('aria-label', `Foto ${idx + 1}: ${fotoInfo.fileName}`);

      // Keyboard navigation: arrows to reorder, Delete to remove, Enter to edit
      itemPreviewDiv.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          if (idx > 0) {
            _focusedIndex = idx - 1;
            moverFoto(idx, -1);
          }
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          if (idx < _st.fotos.length - 1) {
            _focusedIndex = idx + 1;
            moverFoto(idx, 1);
          }
        } else if (e.key === 'Delete') {
          confirmar('Deseja excluir esta foto?').then((ok) => {
            if (ok) {
              _st.fotos.splice(idx, 1);
              renderizarGaleria();
              _cb.salvarRascunhoLocal();
            }
          });
        } else if (e.key === 'Enter') {
          abrirEditor(idx);
        }
      });

      const imgElement = document.createElement('img');
      imgElement.src = fotoInfo.editedPreviewDataUrl || fotoInfo.previewDataUrl;
      imgElement.loading = 'lazy';
      imgElement.alt = fotoInfo.textoLegenda || fotoInfo.fileName;

      const legendaTextarea = document.createElement('textarea');
      legendaTextarea.placeholder = `Legenda para ${fotoInfo.fileName}`;
      legendaTextarea.value = fotoInfo.textoLegenda || '';
      legendaTextarea.setAttribute('aria-label', `Legenda da foto ${idx + 1}`);
      legendaTextarea.addEventListener('input', (e) => {
        fotoInfo.textoLegenda = e.target.value;
        imgElement.alt = fotoInfo.textoLegenda || fotoInfo.fileName;
        _cb.salvarRascunhoLocal();
      });

      const acoesDiv = document.createElement('div');
      acoesDiv.classList.add('acoes-foto');
      acoesDiv.setAttribute('role', 'toolbar');
      acoesDiv.setAttribute('aria-label', `Ações da foto ${idx + 1}`);

      function criarBtn(html, ariaLabel, classes = []) {
        const btn = document.createElement('button');
        btn.innerHTML = html;
        btn.setAttribute('aria-label', ariaLabel);
        btn.classList.add('btn-acao-foto', ...classes);
        return btn;
      }

      const btnSubir = criarBtn('▲', 'Mover foto para cima');
      btnSubir.title = 'Subir foto';
      btnSubir.disabled = idx === 0;
      btnSubir.onclick = () => moverFoto(idx, -1);

      const btnDescer = criarBtn('▼', 'Mover foto para baixo');
      btnDescer.title = 'Descer foto';
      btnDescer.disabled = idx === _st.fotos.length - 1;
      btnDescer.onclick = () => moverFoto(idx, 1);

      const btnGirarEsq = criarBtn('↺ Esq.', 'Girar foto para a esquerda');
      btnGirarEsq.onclick = () => girarImagemDiretoNaGaleria(idx, -90);

      const btnGirarDir = criarBtn('↻ Dir.', 'Girar foto para a direita');
      btnGirarDir.onclick = () => girarImagemDiretoNaGaleria(idx, 90);

      const btnCrop = criarBtn('✂️ Cortar', 'Recortar foto');
      btnCrop.onclick = () => abrirCrop(idx);

      const btnEditar = criarBtn('✏️ Desenhar', 'Abrir editor de desenho', ['btn-editar']);
      btnEditar.onclick = () => abrirEditor(idx);

      const btnRestaurar = criarBtn('↩️ Limpar', 'Remover cortes e desenhos desta foto', [
        'btn-restaurar',
      ]);
      btnRestaurar.title = 'Remove cortes e desenhos';
      btnRestaurar.onclick = async () => {
        if (await confirmar('Deseja remover todos os recortes e desenhos desta foto?')) {
          fotoInfo.previewDataUrl = await redimensionarImagem(fotoInfo.originalDataUrl, 1024, 0.7);
          fotoInfo.editedPreviewDataUrl = null;
          renderizarGaleria();
          _cb.salvarRascunhoLocal();
        }
      };

      const btnToggleLogo = criarBtn(
        fotoInfo.ocultarLogo ? '+ Logo' : '- Logo',
        fotoInfo.ocultarLogo ? 'Mostrar logo nesta foto' : 'Ocultar logo nesta foto'
      );
      btnToggleLogo.disabled = !logoGlobalAtivo;
      if (fotoInfo.ocultarLogo && logoGlobalAtivo) btnToggleLogo.classList.add('btn-logo-off');
      btnToggleLogo.onclick = () => {
        fotoInfo.ocultarLogo = !fotoInfo.ocultarLogo;
        renderizarGaleria();
        _cb.salvarRascunhoLocal();
      };

      const btnToggleMeta = criarBtn(
        fotoInfo.ocultarMetadados ? '+ Dados' : '- Dados',
        fotoInfo.ocultarMetadados ? 'Mostrar metadados desta foto' : 'Ocultar metadados desta foto'
      );
      btnToggleMeta.disabled = !mostrarMetadados || !fotoInfo.metadadosExif;
      if (fotoInfo.ocultarMetadados && mostrarMetadados && fotoInfo.metadadosExif)
        btnToggleMeta.classList.add('btn-logo-off');
      btnToggleMeta.onclick = () => {
        fotoInfo.ocultarMetadados = !fotoInfo.ocultarMetadados;
        renderizarGaleria();
        _cb.salvarRascunhoLocal();
      };

      const btnRemover = criarBtn('✖ Excluir', 'Excluir esta foto', ['btn-remover']);
      btnRemover.onclick = () => {
        _st.fotos.splice(idx, 1);
        renderizarGaleria();
        _cb.salvarRascunhoLocal();
      };

      const btnGPSAtual = criarBtn(
        '📍 Atualizar GPS pelo Celular',
        'Usar GPS do dispositivo para atualizar localização',
        ['btn-gps']
      );
      btnGPSAtual.title = 'Usa a antena GPS do aparelho celular para preencher a localização';
      btnGPSAtual.onclick = async () => {
        if (navigator.geolocation) {
          btnGPSAtual.innerHTML = '⏳ Procurando...';
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const nLat = pos.coords.latitude.toFixed(6);
              const nLng = pos.coords.longitude.toFixed(6);
              let metaAtual = fotoInfo.metadadosExif || '';
              if (metaAtual.includes('📍')) metaAtual = metaAtual.split('📍')[0].trim();
              fotoInfo.metadadosExif = metaAtual + `  📍 GPS: ${nLat}, ${nLng}`;
              renderizarGaleria();
              _cb.salvarRascunhoLocal();
            },
            () => {
              mostrarAlerta(
                'Por favor, ative a Localização (GPS) no seu celular e dê permissão ao navegador.',
                'error'
              );
              btnGPSAtual.innerHTML = '📍 Atualizar GPS pelo Celular';
            },
            { enableHighAccuracy: true }
          );
        } else {
          mostrarAlerta('GPS não suportado neste navegador.', 'error');
        }
      };

      acoesDiv.append(
        btnSubir,
        btnDescer,
        btnGirarEsq,
        btnGirarDir,
        btnCrop,
        btnEditar,
        btnRestaurar,
        btnToggleLogo,
        btnToggleMeta,
        btnRemover,
        btnGPSAtual
      );

      itemPreviewDiv.appendChild(imgElement);

      if (fotoInfo.metadadosExif && mostrarMetadados && !fotoInfo.ocultarMetadados) {
        const metaInfoPreview = document.createElement('div');
        metaInfoPreview.style.fontSize = '0.75em';
        metaInfoPreview.style.color = '#777';
        metaInfoPreview.style.marginBottom = '5px';
        metaInfoPreview.innerText = fotoInfo.metadadosExif;
        itemPreviewDiv.appendChild(metaInfoPreview);
      }
      itemPreviewDiv.appendChild(legendaTextarea);
      itemPreviewDiv.appendChild(acoesDiv);
      _el.galeriaPreview.appendChild(itemPreviewDiv);
    });

    // Restore keyboard focus after re-render (e.g. after arrow-key reorder)
    if (_focusedIndex !== null) {
      const items = _el.galeriaPreview.querySelectorAll('.foto-legenda-item-preview');
      const target = items[Math.min(_focusedIndex, items.length - 1)];
      if (target) target.focus();
      _focusedIndex = null;
    }
  }

  function moverFoto(index, direcao) {
    const novo = index + direcao;
    if (novo < 0 || novo >= _st.fotos.length) return;
    const temp = _st.fotos[index];
    _st.fotos[index] = _st.fotos[novo];
    _st.fotos[novo] = temp;
    renderizarGaleria();
    _cb.salvarRascunhoLocal();
  }

  // --- Crop ---

  function setCropActiveBtn(activeBtn) {
    [_el.btnCropLivre, _el.btnCrop43, _el.btnCrop34].forEach(
      (btn) => (btn.style.backgroundColor = '#6c757d')
    );
    activeBtn.style.backgroundColor = '#28a745';
  }

  function abrirCrop(index) {
    _fotoAtualCropIndex = index;
    const foto = _st.fotos[index];
    _el.imgCrop.src = foto.previewDataUrl;
    _el.modalCrop.classList.remove('modal-oculto');
    setCropActiveBtn(_el.btnCropLivre);
    _el.imgCrop.onload = () => {
      if (_cropperInstancia) _cropperInstancia.destroy();
      _cropperInstancia = new Cropper(_el.imgCrop, {
        viewMode: 1,
        autoCropArea: 1,
        background: false,
        zoomable: true,
        zoomOnWheel: false,
        zoomOnTouch: false,
        transition: false,
      });
    };
  }

  function fecharCrop() {
    _el.modalCrop.classList.add('modal-oculto');
    if (_cropperInstancia) {
      _cropperInstancia.destroy();
      _cropperInstancia = null;
    }
    _fotoAtualCropIndex = null;
  }

  // --- Editor ---

  function updateZoomDisplay() {
    if (_zoomLevel <= 1) {
      _el.canvasEditor.style.maxWidth = '100%';
      _el.canvasEditor.style.maxHeight = '60vh';
      _el.canvasEditor.style.width = 'auto';
      _el.canvasEditor.style.height = 'auto';
    } else {
      _el.canvasEditor.style.maxWidth = 'none';
      _el.canvasEditor.style.maxHeight = 'none';
      _el.canvasEditor.style.width = `${Math.round(_zoomLevel * 100)}%`;
      _el.canvasEditor.style.height = 'auto';
    }
    _el.zoomLabel.textContent = `${Math.round(_zoomLevel * 100)}%`;
  }

  function abrirEditor(index) {
    _fotoAtualEdicaoIndex = index;
    const foto = _st.fotos[index];
    _zoomLevel = 1;
    updateZoomDisplay();
    const imgBase = new Image();
    imgBase.onload = () => {
      _el.canvasEditor.width = imgBase.width;
      _el.canvasEditor.height = imgBase.height;
      _ctxEditor.drawImage(imgBase, 0, 0);
      _historicoEdicao = [_el.canvasEditor.toDataURL()];
      _el.modalEditor.classList.remove('modal-oculto');
    };
    imgBase.src = foto.editedPreviewDataUrl || foto.previewDataUrl;
  }

  function fecharEditor() {
    _el.modalEditor.classList.add('modal-oculto');
    _fotoAtualEdicaoIndex = null;
    _historicoEdicao = [];
  }

  function drawArrow(ctx, fromx, fromy, tox, toy) {
    const headlen = Math.max(15, _el.canvasEditor.width * 0.03);
    const angle = Math.atan2(toy - fromy, tox - fromx);
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(
      tox - headlen * Math.cos(angle - Math.PI / 6),
      toy - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(tox, toy);
    ctx.lineTo(
      tox - headlen * Math.cos(angle + Math.PI / 6),
      toy - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.strokeStyle = 'red';
    ctx.lineWidth = Math.max(4, _el.canvasEditor.width * 0.008);
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawCircle(ctx, x, y, radiusX, radiusY) {
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = Math.max(4, _el.canvasEditor.width * 0.008);
    ctx.stroke();
  }

  function getPos(e) {
    const rect = _el.canvasEditor.getBoundingClientRect();
    const scaleX = _el.canvasEditor.width / rect.width;
    const scaleY = _el.canvasEditor.height / rect.height;
    let cx = e.clientX,
      cy = e.clientY;
    if (e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    }
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  }

  function startDrawing(e) {
    e.preventDefault();
    const pos = getPos(e);
    if (_ferramentaAtual === 'texto') {
      const txt = _el.inputTextoEdicao.value.trim();
      if (txt !== '') {
        const fontSize = Math.max(20, _el.canvasEditor.width * 0.04);
        _ctxEditor.font = `bold ${fontSize}px Arial`;
        _ctxEditor.fillStyle = 'red';
        _ctxEditor.strokeStyle = 'white';
        _ctxEditor.lineWidth = Math.max(2, fontSize * 0.1);
        _ctxEditor.textBaseline = 'middle';
        _ctxEditor.strokeText(txt, pos.x, pos.y);
        _ctxEditor.fillText(txt, pos.x, pos.y);
        _historicoEdicao.push(_el.canvasEditor.toDataURL());
      } else {
        mostrarAlerta('Digite o texto na barra superior antes de clicar na foto.');
        _el.inputTextoEdicao.focus();
      }
      return;
    }
    _isDrawing = true;
    _startX = pos.x;
    _startY = pos.y;
    _lastStateImageData = _ctxEditor.getImageData(
      0,
      0,
      _el.canvasEditor.width,
      _el.canvasEditor.height
    );
  }

  function draw(e) {
    if (!_isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    _ctxEditor.putImageData(_lastStateImageData, 0, 0);
    if (_ferramentaAtual === 'seta') drawArrow(_ctxEditor, _startX, _startY, pos.x, pos.y);
    else if (_ferramentaAtual === 'circulo')
      drawCircle(
        _ctxEditor,
        _startX,
        _startY,
        Math.abs(pos.x - _startX),
        Math.abs(pos.y - _startY)
      );
  }

  function stopDrawing(e) {
    if (!_isDrawing) return;
    e.preventDefault();
    _isDrawing = false;
    _historicoEdicao.push(_el.canvasEditor.toDataURL());
  }

  function _bindEvents() {
    _el.inputSelecionarFotos.addEventListener('change', handleFotosSelecionadas);

    _el.checkboxMarca.addEventListener('change', (e) => {
      _el.divOpcoesMarca.style.display = e.target.checked ? 'flex' : 'none';
      renderizarGaleria();
    });
    _el.rangeOpacidadeMarca.addEventListener(
      'input',
      (e) => (_el.spanValorOpacidade.textContent = `${e.target.value}%`)
    );
    _el.checkboxMetadados.addEventListener('change', () => renderizarGaleria());

    _el.radiosFerramenta.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        _ferramentaAtual = e.target.value;
        if (_ferramentaAtual === 'texto') {
          _el.inputTextoEdicao.style.display = 'inline-block';
          _el.inputTextoEdicao.focus();
        } else {
          _el.inputTextoEdicao.style.display = 'none';
        }
      });
    });

    _el.btnZoomIn.addEventListener('click', () => {
      _zoomLevel = Math.min(_zoomLevel + 0.2, 3);
      updateZoomDisplay();
    });
    _el.btnZoomOut.addEventListener('click', () => {
      _zoomLevel = Math.max(_zoomLevel - 0.2, 0.4);
      updateZoomDisplay();
    });

    _el.canvasEditor.addEventListener('mousedown', startDrawing);
    _el.canvasEditor.addEventListener('mousemove', draw);
    _el.canvasEditor.addEventListener('mouseup', stopDrawing);
    _el.canvasEditor.addEventListener('mouseout', stopDrawing);
    _el.canvasEditor.addEventListener('touchstart', startDrawing, { passive: false });
    _el.canvasEditor.addEventListener('touchmove', draw, { passive: false });
    _el.canvasEditor.addEventListener('touchend', stopDrawing);

    _el.btnSalvarEdicao.addEventListener('click', (e) => {
      e.preventDefault();
      if (_fotoAtualEdicaoIndex !== null) {
        _st.fotos[_fotoAtualEdicaoIndex].editedPreviewDataUrl = _el.canvasEditor.toDataURL(
          'image/jpeg',
          0.8
        );
        renderizarGaleria();
        _cb.salvarRascunhoLocal();
      }
      fecharEditor();
    });

    _el.btnDesfazerSeta.addEventListener('click', (e) => {
      e.preventDefault();
      if (_historicoEdicao.length > 1) {
        _historicoEdicao.pop();
        const imgAnterior = new Image();
        imgAnterior.onload = () => {
          _ctxEditor.clearRect(0, 0, _el.canvasEditor.width, _el.canvasEditor.height);
          _ctxEditor.drawImage(imgAnterior, 0, 0);
        };
        imgAnterior.src = _historicoEdicao[_historicoEdicao.length - 1];
      }
    });

    _el.btnFecharModal.addEventListener('click', (e) => {
      e.preventDefault();
      fecharEditor();
    });

    _el.btnCropLivre.addEventListener('click', (e) => {
      e.preventDefault();
      if (_cropperInstancia) {
        _cropperInstancia.setAspectRatio(NaN);
        setCropActiveBtn(_el.btnCropLivre);
      }
    });
    _el.btnCrop43.addEventListener('click', (e) => {
      e.preventDefault();
      if (_cropperInstancia) {
        _cropperInstancia.setAspectRatio(4 / 3);
        setCropActiveBtn(_el.btnCrop43);
      }
    });
    _el.btnCrop34.addEventListener('click', (e) => {
      e.preventDefault();
      if (_cropperInstancia) {
        _cropperInstancia.setAspectRatio(3 / 4);
        setCropActiveBtn(_el.btnCrop34);
      }
    });
    _el.btnAplicarCrop.onclick = (e) => {
      e.preventDefault();
      const canvasRecortado = _cropperInstancia.getCroppedCanvas();
      const recortadaDataUrl = canvasRecortado.toDataURL('image/jpeg', 0.8);
      _st.fotos[_fotoAtualCropIndex].previewDataUrl = recortadaDataUrl;
      _st.fotos[_fotoAtualCropIndex].editedPreviewDataUrl = null;
      renderizarGaleria();
      _cb.salvarRascunhoLocal();
      fecharCrop();
    };
    _el.btnFecharCrop.onclick = (e) => {
      e.preventDefault();
      fecharCrop();
    };

    _el.inputSelecionarVideo.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      _videoFileName = file.name;
      _el.videoPlayer.src = URL.createObjectURL(file);
      _el.videoPlayer.onloadedmetadata = () => {
        _el.videoSlider.max = _el.videoPlayer.duration;
        _el.modalVideo.classList.remove('modal-oculto');
      };
      _el.inputSelecionarVideo.value = '';
    });

    _el.videoPlayer.addEventListener(
      'timeupdate',
      () => (_el.videoSlider.value = _el.videoPlayer.currentTime)
    );
    _el.videoSlider.addEventListener(
      'input',
      (e) => (_el.videoPlayer.currentTime = e.target.value)
    );
    _el.btnVideoRewind.addEventListener('click', (e) => {
      e.preventDefault();
      _el.videoPlayer.currentTime = Math.max(0, _el.videoPlayer.currentTime - 0.1);
    });
    _el.btnVideoForward.addEventListener('click', (e) => {
      e.preventDefault();
      _el.videoPlayer.currentTime = Math.min(
        _el.videoPlayer.duration,
        _el.videoPlayer.currentTime + 0.1
      );
    });

    _el.btnCapturarFrame.addEventListener('click', async (e) => {
      e.preventDefault();
      const canvas = document.createElement('canvas');
      canvas.width = _el.videoPlayer.videoWidth;
      canvas.height = _el.videoPlayer.videoHeight;
      canvas.getContext('2d').drawImage(_el.videoPlayer, 0, 0, canvas.width, canvas.height);
      const originalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      _st.fotos.push({
        id: `foto-${Date.now()}`,
        fileName: `Frame de ${_videoFileName}`,
        originalDataUrl,
        previewDataUrl: await redimensionarImagem(originalDataUrl, 1024, 0.7),
        editedPreviewDataUrl: null,
        textoLegenda: `Extraído do vídeo: ${_videoFileName}`,
        metadadosExif: '',
        ocultarLogo: false,
        ocultarMetadados: false,
      });
      renderizarGaleria();
      _cb.salvarRascunhoLocal();
      _el.msgFrameCapturado.style.display = 'block';
      setTimeout(() => (_el.msgFrameCapturado.style.display = 'none'), 2500);
    });

    _el.btnFecharModalVideo.addEventListener('click', (e) => {
      e.preventDefault();
      _el.modalVideo.classList.add('modal-oculto');
      _el.videoPlayer.pause();
      _el.videoPlayer.src = '';
    });
  }

  return { init, renderizarGaleria, redimensionarImagem };
})();

/* global module */
if (typeof module !== 'undefined') module.exports = { GalleryManager };
