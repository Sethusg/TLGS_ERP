/**
 * Institutional Print Utility for THE LEADERS ACADEMY(CBSE)
 * 
 * Provides reliable, isolated document printing across desktop browsers,
 * mobile viewports, and sandboxed iframe preview environments.
 * 
 * Creates a hidden sandbox frame, clones the designated printable element,
 * mirrors application stylesheets and fonts, applies high-contrast CBSE print
 * styles, and invokes print cleanly without printing peripheral navigation or app chrome.
 */

export interface PrintOptions {
  title?: string;
  landscape?: boolean;
  pageMargin?: string;
  hideHeaderFooters?: boolean;
}

export function printElement(
  target: HTMLElement | string | null,
  options: PrintOptions = {}
): boolean {
  if (typeof window === 'undefined') return false;

  const element =
    typeof target === 'string'
      ? document.getElementById(target)
      : target;

  if (!element) {
    // Fallback to standard window.print() if target not found
    try {
      window.print();
      return true;
    } catch (err) {
      console.error('Failed to trigger window.print():', err);
      return false;
    }
  }

  const documentTitle = options.title || 'THE LEADERS ACADEMY(CBSE) - Official Document';
  const orientation = options.landscape ? 'landscape' : 'portrait';
  const margin = options.pageMargin || '10mm';

  try {
    // 1. Create a sandboxed hidden print iframe
    const iframeId = '__tla_print_frame__';
    const existingIframe = document.getElementById(iframeId);
    if (existingIframe && existingIframe.parentNode) {
      existingIframe.parentNode.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.setAttribute(
      'style',
      'position: fixed; right: -9999px; bottom: -9999px; width: 0; height: 0; border: 0; visibility: hidden;'
    );
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      // Fallback
      window.print();
      return true;
    }

    // 2. Collect all active stylesheets and font links from parent document
    let stylesHtml = '';
    const styleElements = document.querySelectorAll('link[rel="stylesheet"], style');
    styleElements.forEach((el) => {
      stylesHtml += el.outerHTML;
    });

    // 3. Assemble complete print-ready HTML payload
    const contentHtml = element.outerHTML;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(documentTitle)}</title>
          ${stylesHtml}
          <style>
            @page {
              size: ${orientation};
              margin: ${margin};
            }
            *, *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            .no-print, button, input[type="button"], input[type="submit"] {
              display: none !important;
            }
            /* Clean presentation for tables and borders */
            table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            th, td {
              border-color: #cbd5e1 !important;
            }
            /* Print watermarks and letterhead fidelity */
            .print-exact {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body class="p-6 bg-white">
          <div id="print-content" class="w-full">
            ${contentHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // 4. Trigger print once content & assets have parsed
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print intercepted, invoking window.print fallback:', err);
        window.print();
      } finally {
        // Cleanup iframe after a delay to ensure print spool finishes
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 2000);
      }
    }, 250);

    return true;
  } catch (err) {
    console.warn('Isolated print failed, triggering direct print:', err);
    window.print();
    return true;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
