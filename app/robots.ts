import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/admin', '/api/', '/my-medals', '/suggest/', '/auth/'],
      },
    ],
    sitemap: 'https://foodmedals.com/sitemap.xml',
  }
}
