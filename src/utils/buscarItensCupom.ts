// Integração com API Ciclik Backend no Render
// Busca itens de uma nota fiscal a partir da URL do QR Code

const API_BASE = "https://ciclik-backend.onrender.com";

interface ItemCupom {
  nome: string;
  ean: string;
}

/**
 * Busca itens de um cupom a partir da URL/QR lido.
 * @param qrUrl - URL completa do QR Code da NFC-e
 * @param timeoutMs - Timeout em milissegundos (padrão: 20000)
 * @returns Array de itens com nome e EAN
 */
export async function buscarItensDoCupom(
  qrUrl: string,
  timeoutMs: number = 20000
): Promise<ItemCupom[]> {
  if (!qrUrl || typeof qrUrl !== "string") {
    throw new Error("URL do QR Code inválida.");
  }

  // Garante esquema (evita falha se vier sem http/https)
  const urlNormalizada = /^https?:\/\//i.test(qrUrl)
    ? qrUrl
    : `https://${qrUrl}`;

  console.log('[buscarItensCupom] Consultando:', urlNormalizada);

  // Timeout com AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(`${API_BASE}/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_url: urlNormalizada }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(
        `Falha ao consultar backend (${resp.status}): ${text || resp.statusText}`
      );
    }

    const data = await resp.json();
    console.log('[buscarItensCupom] Resposta:', data);

    // Esperado: array de objetos { nome, ean }
    if (!Array.isArray(data)) {
      throw new Error("Resposta do backend inesperada (esperado um array).");
    }

    // Normaliza minimamente
    return data
      .filter((x) => x && typeof x === "object")
      .map((x) => ({
        nome: String(x.nome ?? ""),
        ean: String(x.ean ?? ""),
      }));
  } catch (err) {
    // Diferencia erro de timeout
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Tempo excedido ao consultar o backend (20s).");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
