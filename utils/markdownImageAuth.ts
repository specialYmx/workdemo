export const TRANSPARENT_GIF_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

export function extractMarkdownImageUrls(content: string): string[] {
  const imageRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const imageUrlSet = new Set<string>();
  let match: RegExpExecArray | null = imageRegex.exec(content);

  while (match) {
    const rawUrl = match[1] || '';
    const normalizedUrl =
      rawUrl.startsWith('<') && rawUrl.endsWith('>') ? rawUrl.slice(1, -1) : rawUrl;
    if (normalizedUrl) {
      imageUrlSet.add(normalizedUrl);
    }
    match = imageRegex.exec(content);
  }

  return Array.from(imageUrlSet);
}

export function replaceMarkdownImageUrls(content: string, urlMap: Map<string, string>): string {
  const imageRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

  return content.replace(imageRegex, (fullMatch: string, rawUrl: string) => {
    const normalizedUrl =
      rawUrl.startsWith('<') && rawUrl.endsWith('>') ? rawUrl.slice(1, -1) : rawUrl;
    const resolvedUrl = urlMap.get(normalizedUrl);
    return resolvedUrl ? fullMatch.replace(rawUrl, resolvedUrl) : fullMatch;
  });
}

export function maskMarkdownImageUrls(
  content: string,
  placeholderUrl: string = TRANSPARENT_GIF_DATA_URL
): string {
  const imageRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  return content.replace(imageRegex, (fullMatch: string, rawUrl: string) =>
    fullMatch.replace(rawUrl, placeholderUrl)
  );
}

export function getImageIdFromUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.searchParams.get('image_id') || '';
  } catch (error) {
    return '';
  }
}

export function getMimeTypeByUrl(imageUrl: string): string {
  const url = imageUrl.toLowerCase();
  if (url.endsWith('.png')) return 'image/png';
  if (url.endsWith('.webp')) return 'image/webp';
  if (url.endsWith('.gif')) return 'image/gif';
  if (url.endsWith('.bmp')) return 'image/bmp';
  if (url.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

export function buildDataUrlFromBase64(base64: string, mimeType: string): string {
  const normalized = base64.trim();
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(normalized)) {
    return normalized;
  }
  const cleanBase64 = normalized.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  return `data:${mimeType};base64,${cleanBase64}`;
}

export function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

export async function resolveImageRenderUrl(response: any, imageUrl: string): Promise<string | null> {
  const blob: Blob = response?.data;
  if (!blob || blob.size <= 0) {
    return null;
  }

  const headerContentType = String(response?.headers?.['content-type'] || '').toLowerCase();
  const blobType = String(blob.type || '').toLowerCase();
  const finalContentType = headerContentType || blobType;

  if (finalContentType.startsWith('image/')) {
    return blobToDataUrl(blob);
  }

  if (finalContentType.includes('application/json')) {
    try {
      const text = await blob.text();
      const json = JSON.parse(text);
      const code = Number(json?.code ?? json?.status ?? 200);
      const base64Raw: string = String(
        json?.data?.base64 || json?.data?.data?.base64 || json?.base64 || ''
      );

      if (code !== 200 || !base64Raw) {
        return null;
      }

      const dataUrlMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/i.exec(base64Raw);
      const mimeType = dataUrlMatch ? dataUrlMatch[1] : getMimeTypeByUrl(imageUrl);
      const pureBase64 = dataUrlMatch ? dataUrlMatch[2] : base64Raw;
      return buildDataUrlFromBase64(pureBase64, mimeType);
    } catch (error) {
      return null;
    }
  }

  return null;
}
