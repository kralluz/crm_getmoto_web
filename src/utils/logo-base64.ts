/**
 * Logo GetMoto em base64
 * Nota: Logo PNG com fundo transparente para uso em PDFs
 */

// Para carregar a logo dinamicamente, use esta função
export async function loadLogoAsBase64(): Promise<string> {
  try {
    const response = await fetch('/logo-getmoto-transparent.png');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
    return '';
  }
}

// URL pública da logo
export const LOGO_URL = '/logo-getmoto-transparent.png';
