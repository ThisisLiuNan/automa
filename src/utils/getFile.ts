export function readFileAsBase64(blob: Blob): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

interface GetFileOptions {
  responseType?: 'blob' | 'text' | 'arrayBuffer' | 'json';
  returnValue?: boolean;
}

export interface GetFileResult {
  path: string;
  objUrl: string | ArrayBuffer | null;
  type: string;
}

async function downloadFile(url: string, options: GetFileOptions): Promise<GetFileResult | Blob | string | ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.statusText);

  const type = options.responseType || 'blob';
  const result = await (response as any)[type]();

  if (options.returnValue) {
    return result;
  }

  if (URL.createObjectURL) {
    const objUrl = URL.createObjectURL(result);
    return { objUrl, path: url, type: result.type };
  }
  const base64 = await readFileAsBase64(result);
  return { path: url, objUrl: base64, type: result.type };
}

function getLocalFile(
  path: string,
  options: GetFileOptions
): Promise<GetFileResult | Blob | string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const isFile = /\.(.*)/.test(path);

    if (!isFile) {
      reject(new Error(`"${path}" is invalid file path.`));
      return;
    }

    const fileUrl = path?.startsWith('file://') ? path : `file://${path}`;

    /* eslint-disable-next-line */
    if ('XMLHttpRequest' in self) {
      const xhr = new XMLHttpRequest();
      const respType =
        options.responseType === 'arrayBuffer'
          ? 'arraybuffer'
          : options.responseType || 'blob';
      xhr.responseType = respType as XMLHttpRequestResponseType;
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 0 || xhr.status === 200) {
            if (options.returnValue) {
              resolve(xhr.response);
              return;
            }

            const objUrl = URL.createObjectURL(xhr.response);
            resolve({ path, objUrl, type: xhr.response.type });
          } else {
            reject(new Error(xhr.statusText));
          }
        }
      };
      xhr.onerror = function () {
        reject(
          new Error(xhr.statusText || `Can't find a file with "${path}" path`)
        );
      };
      xhr.open('GET', fileUrl);
      xhr.send();
    } else {
      fetch(fileUrl)
        .then(async (response) => {
          if (!response.ok) throw new Error(response.statusText);

          if (options.returnValue) {
            if (options.responseType === 'text') return response.text();
            if (options.responseType === 'arrayBuffer') return response.arrayBuffer();
            if (options.responseType === 'json') return response.json();
            return response.blob();
          }

          return response.blob();
        })
        .then((blob) => {
          if (options.returnValue) {
            resolve(blob as any);
            return;
          }
          if (!blob) return;

          if (URL.createObjectURL) {
            const objUrl = URL.createObjectURL(blob);
            resolve({ path, objUrl, type: blob.type });
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({ path, objUrl: reader.result, type: blob.type });
            };
            reader.readAsDataURL(blob);
          }
        })
        .catch(reject);
    }
  });
}

export default function getFile(
  path: string,
  options: GetFileOptions = {}
): Promise<GetFileResult | Blob | string | ArrayBuffer> {
  if (path.startsWith('http')) return downloadFile(path, options);

  return getLocalFile(path, options);
}
