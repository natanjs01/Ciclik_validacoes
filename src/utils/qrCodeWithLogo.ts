/**
 * Utilitário para gerar QR Codes com logo da Ciclik
 * 
 * Usa Error Correction Level 'H' (30% de correção) para garantir
 * que o QR Code funcione mesmo com a logo no centro.
 */

import QRCode from 'qrcode';

export interface QRCodeWithLogoOptions {
  /** Dados a serem codificados no QR Code */
  data: string;
  /** Largura do QR Code em pixels (padrão: 400) */
  width?: number;
  /** Margem ao redor do QR Code (padrão: 2) */
  margin?: number;
  /** URL da logo (padrão: logo da Ciclik) */
  logoUrl?: string;
  /** Tamanho da logo como porcentagem do QR Code (padrão: 0.25 = 25%) */
  logoSizeRatio?: number;
  /** Adicionar fundo branco atrás da logo (padrão: true) */
  logoBackground?: boolean;
  /** Padding do fundo da logo em pixels (padrão: 8) */
  logoPadding?: number;
  /** Arredondar cantos do fundo da logo (padrão: true) */
  roundedBackground?: boolean;
}

/**
 * Gera um QR Code com a logo da Ciclik no centro
 * 
 * @param options Opções de configuração do QR Code
 * @returns Promise<string> Data URL do QR Code gerado
 * 
 * @example
 * const qrCode = await generateQRCodeWithLogo({
 *   data: 'https://ciclik.com.br/validate/123',
 *   width: 400
 * });
 */
export async function generateQRCodeWithLogo(
  options: QRCodeWithLogoOptions
): Promise<string> {
  const {
    data,
    width = 400,
    margin = 2,
    logoUrl = import.meta.env.BASE_URL + 'logo_qrcod.png', // Logo Ciclik para QR Code (com BASE_URL para funcionar em prod)
    logoSizeRatio = 0.25, // 25% do tamanho do QR Code
    logoBackground = true,
    logoPadding = 8,
    roundedBackground = true
  } = options;

  try {
    // Log do caminho da logo para debug
    console.log('[QRCode] Gerando QR Code com logo');
    console.log('[QRCode] Caminho da logo:', logoUrl);
    
    // 1. Gerar QR Code com nível ALTO de correção de erros (permite até 30% de cobertura)
    const qrDataUrl = await QRCode.toDataURL(data, {
      width,
      margin,
      errorCorrectionLevel: 'H', // ← CRÍTICO: Nível máximo de correção
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // 2. Criar canvas para combinar QR Code + Logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }

    // 3. Carregar imagem do QR Code
    const qrImage = await loadImage(qrDataUrl);
    canvas.width = qrImage.width;
    canvas.height = qrImage.height;

    // 4. Desenhar QR Code no canvas
    ctx.drawImage(qrImage, 0, 0);

    // 5. Carregar e desenhar logo
    try {
      console.log('[QRCode] Carregando logo...');
      const logo = await loadImage(logoUrl);
      console.log('[QRCode] ✓ Logo carregada com sucesso:', logo.width, 'x', logo.height, 'px');
      
      // Calcular dimensões da logo (mantendo proporção quadrada)
      const logoSize = Math.floor(canvas.width * logoSizeRatio);
      const logoX = Math.floor((canvas.width - logoSize) / 2);
      const logoY = Math.floor((canvas.height - logoSize) / 2);

      // 6. Adicionar fundo branco atrás da logo (melhora legibilidade)
      if (logoBackground) {
        const bgSize = logoSize + (logoPadding * 2);
        const bgX = logoX - logoPadding;
        const bgY = logoY - logoPadding;

        ctx.fillStyle = '#FFFFFF';
        
        if (roundedBackground) {
          // Desenhar retângulo com cantos arredondados
          const radius = 8;
          ctx.beginPath();
          ctx.moveTo(bgX + radius, bgY);
          ctx.lineTo(bgX + bgSize - radius, bgY);
          ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + radius);
          ctx.lineTo(bgX + bgSize, bgY + bgSize - radius);
          ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - radius, bgY + bgSize);
          ctx.lineTo(bgX + radius, bgY + bgSize);
          ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - radius);
          ctx.lineTo(bgX, bgY + radius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(bgX, bgY, bgSize, bgSize);
        }

        // Adicionar sombra sutil ao redor da logo
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }

      // 7. Desenhar logo
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      console.log('[QRCode] ✓ Logo desenhada na posição:', logoX, ',', logoY);
      
      // Resetar sombra
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

    } catch (logoError) {
      // Se não conseguir carregar a logo, retornar QR Code sem ela
      console.error('[QRCode] ✗ ERRO ao carregar logo:', logoError);
      console.error('[QRCode] Caminho tentado:', logoUrl);
      console.warn('[QRCode] Usando fallback (QR Code sem logo)');
      return qrDataUrl;
    }

    // 8. Retornar QR Code final como Data URL
    console.log('[QRCode] ✓ QR Code com logo gerado com sucesso!');
    return canvas.toDataURL('image/png', 1.0);

  } catch (error) {
    console.error('[QRCode] Erro geral ao gerar QR Code:', error);
    throw new Error('Falha ao gerar QR Code. Tente novamente.');
  }
}

/**
 * Função auxiliar para carregar imagem
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Permitir CORS para imagens externas
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    
    img.src = src;
  });
}

/**
 * Função simplificada para gerar QR Code rapidamente
 * (usa configurações padrão)
 */
export async function generateQRCode(data: string, width?: number): Promise<string> {
  return generateQRCodeWithLogo({
    data,
    width
  });
}
