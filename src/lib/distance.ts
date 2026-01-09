/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lng1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lng2 Longitude do ponto 2
 * @returns Distância em quilômetros
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Formata a distância para exibição
 * @param km Distância em quilômetros
 * @returns String formatada (ex: "450 m", "1.2 km", "15 km")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Retorna a cor do badge baseada na distância
 * @param km Distância em quilômetros
 * @returns Classe de cor Tailwind
 */
export function getDistanceColor(km: number | null): 'success' | 'warning' | 'muted' {
  if (km === null) return 'muted';
  if (km < 5) return 'success';
  if (km < 15) return 'warning';
  return 'muted';
}

/**
 * Ordena cooperativas por distância, com coordenadas conhecidas primeiro
 */
export function sortByDistance<T extends { latitude?: number | null; longitude?: number | null; distance?: number | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    // Itens com distância calculada vêm primeiro
    if (a.distance !== null && a.distance !== undefined && (b.distance === null || b.distance === undefined)) {
      return -1;
    }
    if ((a.distance === null || a.distance === undefined) && b.distance !== null && b.distance !== undefined) {
      return 1;
    }
    
    // Se ambos têm distância, ordenar por distância
    if (a.distance !== null && a.distance !== undefined && b.distance !== null && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    
    // Se nenhum tem distância, manter ordem original
    return 0;
  });
}
