/* eslint-env node */
/* eslint-disable no-console */
'use strict';
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function generateIcon(size, logo) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size;

  // --- Background: rounded square, azul Sabesp ---
  ctx.fillStyle = '#007bff';
  roundRect(ctx, 0, 0, s, s, s * 0.18);
  ctx.fill();

  // --- Câmera (branca) ---
  ctx.fillStyle = 'white';

  const padH = s * 0.16;
  const padV = s * 0.2;

  // corpo da câmera
  const bX = padH;
  const bY = padV + s * 0.09; // empurra para baixo para dar espaço ao bump
  const bW = s - padH * 2;
  const bH = s - padV - bY - padH * 0.6;
  roundRect(ctx, bX, bY, bW, bH, s * 0.06);
  ctx.fill();

  // bump (visor) no topo centro
  const bpW = bW * 0.28;
  const bpH = s * 0.1;
  const bpX = bX + (bW - bpW) / 2;
  const bpY = bY - bpH + s * 0.012;
  roundRect(ctx, bpX, bpY, bpW, bpH, s * 0.04);
  ctx.fill();

  // botão disparador (canto superior esquerdo do corpo)
  const btnR = s * 0.055;
  ctx.beginPath();
  ctx.arc(bX + bW * 0.18, bY - btnR * 0.4, btnR, 0, Math.PI * 2);
  ctx.fill();

  // lente: anel externo (fundo azul recortado)
  const lcX = bX + bW / 2;
  const lcY = bY + bH / 2 + s * 0.01;
  const lr = bH * 0.38;

  // anel branco externo (já está branco do body)
  // recorte central azul = anel
  ctx.fillStyle = '#007bff';
  ctx.beginPath();
  ctx.arc(lcX, lcY, lr * 0.78, 0, Math.PI * 2);
  ctx.fill();

  // anel branco médio
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(lcX, lcY, lr * 0.58, 0, Math.PI * 2);
  ctx.fill();

  // pupila azul central
  ctx.fillStyle = '#007bff';
  ctx.beginPath();
  ctx.arc(lcX, lcY, lr * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // reflexo de luz (brilho branco pequeno)
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(lcX - lr * 0.14, lcY - lr * 0.14, lr * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // flash (canto superior direito do corpo)
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const fR = s * 0.038;
  ctx.beginPath();
  ctx.arc(bX + bW * 0.82, bY + bH * 0.22, fR, 0, Math.PI * 2);
  ctx.fill();

  // --- Badge Sabesp: canto inferior direito ---
  const badgeR = s * 0.2; // raio do círculo branco
  const badgeCX = s - badgeR * 0.82;
  const badgeCY = s - badgeR * 0.82;

  // sombra sutil
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = s * 0.025;
  ctx.shadowOffsetX = -s * 0.01;
  ctx.shadowOffsetY = -s * 0.01;

  // círculo branco do badge
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
  ctx.fill();

  // remove sombra para o logo
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Desenha só a parte do símbolo (top 57% da imagem = marca, sem texto "sabesp")
  const srcH = Math.floor(logo.height * 0.57);
  const drawSide = badgeR * 1.55; // tamanho do logo dentro do badge
  const aspect = logo.width / srcH;
  const drawW = drawSide;
  const drawH = drawW / aspect;

  ctx.save();
  ctx.beginPath();
  ctx.arc(badgeCX, badgeCY, badgeR * 0.92, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(
    logo,
    0,
    0,
    logo.width,
    srcH,
    badgeCX - drawW / 2,
    badgeCY - drawH / 2 - badgeR * 0.04,
    drawW,
    drawH
  );
  ctx.restore();

  return canvas;
}

async function main() {
  const logo = await loadImage(path.join(__dirname, 'sabesp-logo.png'));
  for (const size of [192, 512]) {
    const canvas = await generateIcon(size, logo);
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, `icon-${size}.png`), buf);
    console.log(`Gerado icon-${size}.png (${buf.length} bytes)`);
  }
}

main().catch(console.error);
