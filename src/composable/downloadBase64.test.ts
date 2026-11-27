import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import {
  getMimeTypeFromBase64,
  getMimeTypeFromExtension,
  previewImageFromBase64,
  useDownloadFileFromBase64Refs,
} from './downloadBase64';

describe('downloadBase64', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('getMimeTypeFromExtension', () => {
    it('returns the MIME type for known extensions', () => {
      expect(getMimeTypeFromExtension('txt')).toBe('text/plain');
      expect(getMimeTypeFromExtension('json')).toBe('application/json');
      expect(getMimeTypeFromExtension('png')).toBe('image/png');
    });

    it('returns false for unknown extensions', () => {
      expect(getMimeTypeFromExtension('nonexistent-ext-xyz')).toBe(false);
    });
  });

  describe('getMimeTypeFromBase64', () => {
    it('when the base64 string has a data URI, it returns the mime type', () => {
      expect(getMimeTypeFromBase64({ base64String: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA' })).to.deep.equal({ mimeType: 'image/png' });
      expect(getMimeTypeFromBase64({ base64String: 'data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA' })).to.deep.equal({ mimeType: 'image/jpg' });
    });

    it('when the base64 string has no data URI, it try to infer the mime type from the signature', () => {
      // https://en.wikipedia.org/wiki/List_of_file_signatures

      // PNG
      expect(getMimeTypeFromBase64({ base64String: 'iVBORw0KGgoAAAANSUhEUgAAAAUA' })).to.deep.equal({ mimeType: 'image/png' });

      // GIF
      expect(getMimeTypeFromBase64({ base64String: 'R0lGODdh' })).to.deep.equal({ mimeType: 'image/gif' });
      expect(getMimeTypeFromBase64({ base64String: 'R0lGODlh' })).to.deep.equal({ mimeType: 'image/gif' });

      // JPG
      expect(getMimeTypeFromBase64({ base64String: '/9j/' })).to.deep.equal({ mimeType: 'image/jpg' });

      // PDF
      expect(getMimeTypeFromBase64({ base64String: 'JVBERi0' })).to.deep.equal({ mimeType: 'application/pdf' });
    });

    it('when the base64 string has no data URI and no signature, it returns an undefined mimeType', () => {
      expect(getMimeTypeFromBase64({ base64String: 'JVBERi' })).to.deep.equal({ mimeType: undefined });
    });
  });

  describe('useDownloadFileFromBase64Refs', () => {
    it('uses the looked-up MIME type and appends txt extension when extension is empty', () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      const originalCreateElement = document.createElement.bind(document);
      let createdAnchor: HTMLAnchorElement | undefined;
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName === 'a') {
          createdAnchor = el as HTMLAnchorElement;
        }
        return el;
      });

      const { download } = useDownloadFileFromBase64Refs({
        source: ref('SGVsbG8gd29ybGQ='),
        filename: ref('file'),
        extension: ref(''),
      });
      download();

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(createdAnchor?.href).toBe('data:text/plain;base64,SGVsbG8gd29ybGQ=');
      expect(createdAnchor?.download).toBe('file.txt');
    });

    it('falls back to application/octet-stream when extension has no known MIME type', () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      const originalCreateElement = document.createElement.bind(document);
      let createdAnchor: HTMLAnchorElement | undefined;
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName === 'a') {
          createdAnchor = el as HTMLAnchorElement;
        }
        return el;
      });

      const { download } = useDownloadFileFromBase64Refs({
        source: ref('SGVsbG8='),
        filename: ref('archive'),
        extension: ref('.unknownextxyz'),
      });
      download();

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(createdAnchor?.href).toBe('data:application/octet-stream;base64,SGVsbG8=');
      expect(createdAnchor?.download).toBe('archive.unknownextxyz');
    });
  });

  describe('previewImageFromBase64', () => {
    it('wraps raw base64 images in a valid data URI using inferred MIME type', () => {
      const container = document.createElement('div');
      container.id = 'previewContainer';
      document.body.appendChild(container);

      const img = previewImageFromBase64('iVBORw0KGgoAAAANSUhEUgAAAAUA');

      expect(img.src).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA');
      expect(container.firstElementChild).toBe(img);
    });
  });
});
