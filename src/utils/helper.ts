import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import browser from 'webextension-polyfill';

export async function getActiveTab(): Promise<any> {
  try {
    const tabsQuery: any = {
      active: true,
      url: '*://*/*',
    };

    const window = await browser.windows.getLastFocused({
      populate: true,
      windowTypes: ['normal'],
    });
    const windowId = window.id;

    if (windowId) tabsQuery.windowId = windowId;
    else tabsQuery.lastFocusedWindow = true;

    const [tab] = await browser.tabs.query(tabsQuery);

    return tab;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function isXPath(str: string): boolean {
  const regex = /^([(/@]|id\()/;

  return regex.test(str);
}

export function visibleInViewport(element: Element): boolean {
  const { top, left, bottom, right, height, width } =
    element.getBoundingClientRect();

  if (height === 0 || width === 0) return false;

  return (
    top >= 0 &&
    left >= 0 &&
    bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function sleep(timeout = 500): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

export function findTriggerBlock(drawflow: any = {}): any {
  if (!drawflow) return null;

  if (drawflow.drawflow) {
    const blocks = Object.values(drawflow.drawflow?.Home?.data ?? {});
    if (!blocks) return null;

    return blocks.find(({ name }) => name === 'trigger');
  }
  if (drawflow.nodes) {
    return drawflow.nodes.find((node) => node.label === 'trigger');
  }

  return null;
}

export function throttle<T extends (...args: any[]) => any>(callback: T, limit: number): (...args: Parameters<T>) => void {
  let waiting = false;

  return (...args: Parameters<T>) => {
      if (!waiting) {
        callback.apply(this, args);
        waiting = true;
        setTimeout(() => {
          waiting = false;
        }, limit);
      }
    };
}

export function convertArrObjTo2DArr(arr: Array<Record<string, any>>): any[][] {
  const keyIndex = new Map<string, number>();
  const values: any[][] = [[]];

  arr.forEach((obj) => {
    const keys = Object.keys(obj);
    const row: any[] = [];

    keys.forEach((key) => {
      if (!keyIndex.has(key)) {
        keyIndex.set(key, keyIndex.size);
        values[0].push(key);
      }

      const value = obj[key];

      const rowIndex = keyIndex.get(key);
      row[rowIndex] = typeof value === 'object' ? JSON.stringify(value) : value;
    });

    values.push([...row]);
  });

  return values;
}

export function convert2DArrayToArrayObj(values: any[][]): Array<Record<string, any>> {
  let keyIndex = 0;
  const keys = values.shift() as string[];
  const result: Array<Record<string, any>> = [];

  for (let columnIndex = 0; columnIndex < values.length; columnIndex += 1) {
    const currentColumn: Record<string, any> = {};

    for (
      let rowIndex = 0;
      rowIndex < values[columnIndex].length;
      rowIndex += 1
    ) {
      let key = keys[rowIndex];

      if (!key) {
        keyIndex += 1;
        key = `_row${keyIndex}`;
        keys.push(key);
      }

      (currentColumn as any)[key] = values[columnIndex][rowIndex];
    }

    result.push(currentColumn);
  }

  return result;
}

export function parseJSON<T>(data: string, def: T): T {
  try {
    const result = JSON.parse(data);

    return result;
  } catch (error) {
    return def;
  }
}

export function parseFlow(flow: string | Record<string, any>): Record<string, any> {
  const obj = typeof flow === 'string' ? parseJSON<Record<string, any>>(flow, {}) : flow;

  return obj;
}

export function replaceMustache(str: string, replacer: (...args: any[]) => string): string {
  /* eslint-disable-next-line */
  return str.replace(/\{\{(.*?)\}\}/g, replacer);
}

export function openFilePicker(
  acceptedFileTypes: string[] = [],
  attrs: Record<string, any> = {}
): Promise<File[]> {
  return new Promise<File[]>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = Array.isArray(acceptedFileTypes)
      ? acceptedFileTypes.join(',')
      : acceptedFileTypes;

    Object.entries(attrs).forEach(([key, value]) => {
      input[key] = value;
    });

    input.onchange = (event: Event) => {
      const { files } = event.target as HTMLInputElement;
      const validFiles: File[] = [];

      Array.from(files || []).forEach((file: File) => {
        if (!acceptedFileTypes.includes(file.type)) return;

        validFiles.push(file);
      });

      resolve(validFiles);
    };

    input.click();
  });
}

export function fileSaver(filename: string, data: string): void {
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = data;

  anchor.dispatchEvent(new MouseEvent('click'));
  anchor.remove();
}

export function countDuration(started: number, ended: number): string {
  const duration = Math.round((ended - started) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);

  const getText = (num, suffix) => (num > 0 ? `${num}${suffix}` : '');

  return `${getText(minutes, 'm')} ${seconds}s`;
}

export function toCamelCase(str: string, capitalize = false): string {
  const result = str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
    return index === 0 && !capitalize
      ? letter.toLowerCase()
      : letter.toUpperCase();
  });

  return result.replace(/\s+|[-]/g, '');
}

export function isObject(obj: unknown): obj is Record<string, any> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export function objectHasKey(obj: Record<string, any>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isWhitespace(str: string): boolean {
  return !/\S/.test(str);
}

export function debounce<T extends (...args: any[]) => any>(callback: T, time = 200): (...args: Parameters<T>) => Promise<void> {
  let interval: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>): Promise<void> => {
    clearTimeout(interval);

    return new Promise((resolve) => {
      interval = setTimeout(() => {
        interval = undefined;

        callback(...args);
        resolve();
      }, time);
    });
  };
}

export async function clearCache(workflow: any): Promise<boolean> {
  try {
    await BrowserAPIService.storage.local.remove(`state:${workflow.id}`);

    const flows = parseJSON<any>(workflow.drawflow, null);
    const blocks = flows && flows.drawflow.Home.data;

    if (blocks) {
      Object.values(blocks).forEach(({ name, id }) => {
        if (name !== 'loop-data') return;

        localStorage.removeItem(`index:${id}`);
      });
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function arraySorter<T extends Record<string, any>>({ data, key, order = 'asc' }: { data: T[]; key: string; order?: 'asc' | 'desc' }): T[] {
  let runCounts: Record<string, number> = {};
  const copyData = data.slice();

  if (key === 'mostUsed') {
    runCounts = parseJSON<Record<string, number>>(localStorage.getItem('runCounts') as string, {}) || {};
  }

  return copyData.sort((a: T, b: T) => {
    let comparison = 0;
    let itemA: any = (a as any)[key] || a;
    let itemB: any = (b as any)[key] || b;

    if (key === 'mostUsed') {
      itemA = runCounts[a.id] || 0;
      itemB = runCounts[b.id] || 0;
    }

    if (itemA > itemB) {
      comparison = 1;
    } else if (itemA < itemB) {
      comparison = -1;
    }

    return order === 'desc' ? comparison * -1 : comparison;
  });
}
