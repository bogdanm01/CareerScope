import { getApiBaseUrl } from './http';

const getWebsiteDomain = (websiteUrl?: string | null) => {
  if (!websiteUrl) {
    return null;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
};

const resolveAssetUrl = (assetUrl?: string | null) => {
  if (!assetUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(assetUrl)) {
    return assetUrl;
  }

  const baseUrl = getApiBaseUrl();
  return baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${assetUrl}` : new URL(assetUrl, baseUrl).toString();
};

export const getCompanyLogoUrl = (logoUrl?: string | null, websiteUrl?: string | null, size = 128) => {
  const resolvedLogoUrl = resolveAssetUrl(logoUrl);

  if (resolvedLogoUrl) {
    return resolvedLogoUrl;
  }

  const token = import.meta.env.VITE_LOGO_DEV_TOKEN?.trim();
  const domain = getWebsiteDomain(websiteUrl);

  if (!token || !domain) {
    return null;
  }

  const params = new URLSearchParams({
    token,
    size: String(size),
  });

  return `https://img.logo.dev/${encodeURIComponent(domain)}?${params.toString()}`;
};
