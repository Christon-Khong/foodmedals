import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/admin', '/api/', '/my-medals', '/suggest/'],
      },
    ],
    sitemap: 'https://foodmedals.com/sitemap.xml',
  }
}
