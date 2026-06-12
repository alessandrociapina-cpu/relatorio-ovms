# CLAUDE.md — Relatório Fotográfico OVMS

## Visão geral

PWA (Progressive Web App) 100% client-side para geração de relatórios fotográficos de vistoria da Sabesp/OVMS. Sem backend — todo o processamento ocorre no navegador. Funciona offline após o primeiro carregamento via Service Worker.

## Comandos essenciais

```bash
npm test                  # Roda todos os testes (Jest + jsdom)
npm run test:coverage     # Testes com relatório de cobertura
npm run test:watch        # Modo watch (desenvolvimento)
npm run lint              # Verifica ESLint
npm run lint:fix          # Corrige automaticamente com ESLint
npm run format            # Aplica Prettier em JS/HTML/CSS
```

## Arquitetura dos módulos JS

| Arquivo | Responsabilidade |
|---|---|
| `script.js` | Ponto de entrada; inicializa `appState` e orquestra os três módulos |
| `formHandler.js` | Valida formulário, auto-save com debounce no IndexedDB, exporta/importa projeto JSON |
| `galleryManager.js` | Galeria de fotos, edição (seta/linha/rect), crop (CropperJS), vídeo, histórico undo/redo |
| `reportGenerator.js` | Gera HTML do relatório/PDF; processa imagens via canvas (resize + canvas burn do logo) |
| `utils.js` | Funções puras: `esc()` (XSS), `formatarDataISO()`, constantes de departamento |
| `domUtils.js` | Helpers de DOM: `mostrarErro`, `limparErro`, modais de alerta/confirmação |
| `modules/storage.js` | Wrapper do IndexedDB (`salvarDB`, `carregarDB`, `limparDB`) |
| `modules/gps.js` | Lê metadados EXIF (data + GPS) com fallback para `file.lastModified` |

## Testes

- **Framework**: Jest 29 + jest-environment-jsdom
- **Localização**: `tests/*.test.js` (8 suites, 209 testes)
- **Cobertura atual**: utils, domUtils, formHandler, galleryManager, reportGenerator, script, storage, gps
- Os testes mockam globals do browser (`esc`, `resolverDepartamento`, `criarBlocoAssinatura`, `mostrarAlerta`) e DOM via jsdom

## Linting e formatação

- **ESLint** ^8 — `eslint:recommended` + browser/ES2021; regras chave: `no-var`, `eqeqeq`, `prefer-const`
- **Prettier** ^3 — `singleQuote: true`, `semi: true`, `tabWidth: 2`, `printWidth: 100`
- **Husky + lint-staged**: pre-commit roda ESLint --fix + Prettier em arquivos staged

## Service Worker e versionamento

A cada release, **todos** estes pontos devem ser atualizados com o novo número de versão (ex: `57`):

- `sw.js`: `CACHE_NAME = 'ovms-app-v57'` e todos os `?v=57` em `urlsToCache`
- `index.html`: `?v=57` em todos os `<link>` e `<script>` + "Versão 57 | Última atualização: DD/MM/AAAA"
- `index.html`: tooltip "Últimas Atualizações" — adicionar entrada da nova versão e marcar como "(Atual)"
- `documentacao.html`: nova entrada no histórico, mudar versão anterior de "(Atual)" para sem label

## Layouts de PDF

| Valor `layoutColunas` | Comportamento |
|---|---|
| `'2'` | Grade 2 colunas (padrão) |
| `'1'` | 1 coluna, `max-height: 165mm` por foto, `break-before: page` em fotos 2+ |
| `'4pp'` | 4 por página (grade 2×2, `height: 85mm` em print), sem `object-fit: contain` |

## Marca d'água (canvas burn)

O logo **não** usa overlay CSS no relatório — é gravado diretamente nos pixels da imagem via canvas em `reportGenerator.js`:

1. `_logoParaDataUrl()` — carrega `sabesp-logo.png` como data URL (uma vez por geração)
2. `_queimarcaDagua(dataUrl, logoDataUrl, posMarca, tamMarca, opacMarca)` — desenha o logo na posição correta dentro dos limites da imagem

Posições: `bottom-right`, `bottom-left`, `top-right`, `top-left`
Tamanhos (fração da largura da imagem): `logo-pequeno` = 8%, `logo-medio` = 15%, `logo-grande` = 22%

## Auto-save

`formHandler.js` salva o estado completo no IndexedDB com debounce de 5s sempre que qualquer campo do formulário muda. O estado inclui todos os campos do formulário + URLs das fotos.

## CI/CD (GitHub Actions)

- `.github/workflows/ci.yml`: push em `main` ou `claude/**` → `npm run lint` + `npm test`
- `.github/workflows/lighthouse.yml`: audit de performance com LHCI

## Fluxo de desenvolvimento

1. Trabalhar na branch `claude/analyze-repository-CJ7O7`
2. Fazer bump de versão em `sw.js` e `index.html` (e `documentacao.html`)
3. Rodar `npm test` — devem passar 209/209
4. Commit + push + PR para `main` + squash merge
