/**
 * Gera uma imagem de conquista personalizada com Canvas
 */
export async function gerarImagemConquista(
  conquista: string,
  nivel: string,
  nomeUsuario?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Não foi possível criar o contexto do canvas'));
      return;
    }

    // Configurar dimensões (formato quadrado para Instagram)
    canvas.width = 1080;
    canvas.height = 1080;

    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Carregar logo da Ciclik
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.src = '/ciclik-logo-full.png';
    
    logo.onload = () => {
      // Desenhar logo no topo centralizada
      const logoWidth = 350;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      const logoX = (canvas.width - logoWidth) / 2;
      const logoY = 80;
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

      // Adicionar borda decorativa verde
      ctx.strokeStyle = '#8BC34A';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Texto: Conquista (mais acima)
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 46px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 CONQUISTA DESBLOQUEADA', canvas.width / 2, 350);

      // Texto: Nome da conquista (em destaque com quebra de linha inteligente)
      ctx.fillStyle = '#8BC34A';
      ctx.font = 'bold 52px Arial, sans-serif';
      const maxWidth = canvas.width - 160;
      const words = conquista.split(' ');
      let line = '';
      let y = 440;
      const lineHeight = 60;
      const lines: string[] = [];

      // Criar array de linhas
      words.forEach((word) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line.trim());
          line = word + ' ';
        } else {
          line = testLine;
        }
      });
      if (line.trim()) {
        lines.push(line.trim());
      }

      // Desenhar todas as linhas da conquista
      lines.forEach((textLine, index) => {
        ctx.fillText(textLine, canvas.width / 2, y + index * lineHeight);
      });

      // Posições fixas a partir da base para evitar sobreposição
      const nomeY = canvas.height - 210;
      const nivelY = canvas.height - 170;
      const brandY = canvas.height - 110;
      const hashtagsY = canvas.height - 70;

      // Nome do usuário (se fornecido) acima do nível
      if (nomeUsuario) {
        ctx.fillStyle = '#666666';
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.fillText(nomeUsuario, canvas.width / 2, nomeY);
      }

      // Texto: Nível (logo acima da frase Ciclik - Recicle e Ganhe)
      ctx.fillStyle = '#FFA726';
      ctx.font = 'bold 44px Arial, sans-serif';
      ctx.fillText(`NÍVEL: ${nivel.toUpperCase()}`, canvas.width / 2, nivelY);

      // Texto: Rodapé com marca
      ctx.fillStyle = '#999999';
      ctx.font = '26px Arial, sans-serif';
      ctx.fillText('Ciclik - Recicle e Ganhe', canvas.width / 2, brandY);
      
      // Hashtags abaixo da frase principal
      ctx.font = '22px Arial, sans-serif';
      ctx.fillText('#Ciclik #Sustentabilidade #RecicleEGanhe', canvas.width / 2, hashtagsY);

      // Converter para data URL
      resolve(canvas.toDataURL('image/png'));
    };

    logo.onerror = () => {
      reject(new Error('Erro ao carregar a logo'));
    };
  });
}

/**
 * Baixa uma imagem gerada
 */
export function baixarImagem(dataUrl: string, nomeArquivo: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
