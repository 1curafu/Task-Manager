import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://vela.works'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/auth/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/auth/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
