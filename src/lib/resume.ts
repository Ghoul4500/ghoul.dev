import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RESUME_PDF } from './seo';

// Download link for the résumé PDF with a content hash appended. The CDN and
// browsers cache the PDF for hours, so without this a freshly rendered résumé
// keeps downloading as the old one.
function versioned(): string {
  try {
    const bytes = readFileSync(join(process.cwd(), 'public', RESUME_PDF));
    return `${RESUME_PDF}?v=${createHash('sha256').update(bytes).digest('hex').slice(0, 10)}`;
  } catch {
    return RESUME_PDF;
  }
}

export const RESUME_HREF = versioned();
