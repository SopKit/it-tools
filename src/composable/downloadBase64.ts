import { extension as getExtensionFromMimeType, lookup as getMimeTypeFromExtension } from 'mime-types';
import type { Ref } from 'vue';
import _ from 'lodash';

export {
  getMimeTypeFromBase64,
  getMimeTypeFromExtension, getExtensionFromMimeType,
  useDownloadFileFromBase64, useDownloadFileFromBase64Refs,
  previewImageFromBase64,
};

const commonMimeTypesSignatures = {
  'JVBERi0': 'application/pdf',
  'R0lGODdh': 'image/gif',
  'R0lGODlh': 'image/gif',
  'iVBORw0KGgo': 'image/png',
  '/9j/': 'image/jpg',
};

function getMimeTypeFromBase64({ base64String }: { base64String: string }) {
  const [,mimeTypeFromBase64] = base64String.match(/data:(.*?);base64/i) ?? [];

  if (mimeTypeFromBase64) {
    return { mimeType: mimeTypeFromBase64 };
  }

  const inferredMimeType = _.find(commonMimeTypesSignatures, (_mimeType, signature) => base64String.startsWith(signature));

  if (inferredMimeType) {
    return { mimeType: inferredMimeType };
  }

  return { mimeType: undefined };
}

function getFileExtensionFromMimeType({
  mimeType,
  defaultExtension = 'txt',
}: {
  mimeType: string | undefined
  defaultExtension?: string
}) {
  if (mimeType) {
    return getExtensionFromMimeType(mimeType) || defaultExtension;
  }

  return defaultExtension;
}

function downloadFromBase64({ sourceValue, filename, extension, fileMimeType }:
{ sourceValue: string; filename?: string; extension?: string; fileMimeType?: string }) {
  if (sourceValue === '') {
    throw new Error('Base64 string is empty');
  }

  const normalizedExtension = extension?.trim().replace(/^\./, '') || undefined;
  const defaultExtension = normalizedExtension ?? 'txt';
  const { mimeType } = getMimeTypeFromBase64({ base64String: sourceValue });
  let base64String = sourceValue;
  if (!mimeType) {
    const lookedUpMimeType = getMimeTypeFromExtension(defaultExtension) || 'application/octet-stream';
    const targetMimeType = fileMimeType || lookedUpMimeType;
    base64String = `data:${targetMimeType};base64,${sourceValue}`;
  }

  const cleanExtension = normalizedExtension ?? getFileExtensionFromMimeType({ mimeType, defaultExtension });
  let cleanFileName = filename?.trim() || `file.${cleanExtension}`;
  const hasExtension = /\.[a-z0-9]+$/i.test(cleanFileName);
  if ((normalizedExtension || !hasExtension) && !cleanFileName.endsWith(`.${cleanExtension}`)) {
    cleanFileName = `${cleanFileName}.${cleanExtension}`;
  }

  const a = document.createElement('a');
  a.href = base64String;
  a.download = cleanFileName;
  a.click();
}

function useDownloadFileFromBase64(
  { source, filename, extension, fileMimeType }:
  { source: Ref<string>; filename?: string; extension?: string; fileMimeType?: string }) {
  return {
    download() {
      downloadFromBase64({ sourceValue: source.value, filename, extension, fileMimeType });
    },
  };
}

function useDownloadFileFromBase64Refs(
  { source, filename, extension }:
  { source: Ref<string>; filename?: Ref<string>; extension?: Ref<string> }) {
  return {
    download() {
      downloadFromBase64({ sourceValue: source.value, filename: filename?.value, extension: extension?.value });
    },
  };
}

function previewImageFromBase64(base64String: string): HTMLImageElement {
  if (base64String === '') {
    throw new Error('Base64 string is empty');
  }

  const trimmed = base64String.trim();
  const { mimeType } = getMimeTypeFromBase64({ base64String: trimmed });
  const src = /^data:/i.test(trimmed)
    ? trimmed
    : `data:${mimeType ?? 'image/png'};base64,${trimmed}`;

  const img = document.createElement('img');
  img.src = src;

  const previewContainer = document.getElementById('previewContainer');
  if (previewContainer) {
    previewContainer.innerHTML = '';
    previewContainer.appendChild(img);
  }
  else {
    throw new Error('Preview container element not found');
  }

  return img;
}
