/**
 * Converte URLs do YouTube para o formato embed correto
 * Suporta formatos:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID (já correto)
 */
export function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';

  try {
    // Se já estiver no formato embed, retorna como está
    if (url.includes('/embed/')) {
      return url;
    }

    let videoId = '';

    // Formato: https://youtu.be/VIDEO_ID
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    // Formato: https://www.youtube.com/watch?v=VIDEO_ID
    else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    }
    // Formato: https://www.youtube.com/v/VIDEO_ID
    else if (url.includes('/v/')) {
      videoId = url.split('/v/')[1].split('?')[0];
    }

    // Se encontrou o ID, retorna URL embed
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Se não conseguiu extrair, retorna original
    return url;
  } catch (error) {
    console.error('Erro ao processar URL do YouTube:', error);
    return url;
  }
}
