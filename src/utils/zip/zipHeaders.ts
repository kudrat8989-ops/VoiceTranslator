export interface ZipFileEntry {
  nameBytes: Uint8Array;
  dataBytes: Uint8Array;
  crc: number;
  offset: number;
}

export function createLocalHeader(nameBytes: Uint8Array, dataBytes: Uint8Array, crc: number): Uint8Array {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0x5421, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, dataBytes.length, true);
  view.setUint32(22, dataBytes.length, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(nameBytes, 30);
  return header;
}

export function createCentralHeader(entry: ZipFileEntry): Uint8Array {
  const header = new Uint8Array(46 + entry.nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0x5421, true);
  view.setUint32(16, entry.crc, true);
  view.setUint32(20, entry.dataBytes.length, true);
  view.setUint32(24, entry.dataBytes.length, true);
  view.setUint16(28, entry.nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, entry.offset, true);
  header.set(entry.nameBytes, 46);
  return header;
}

export function createEndRecord(entriesCount: number, centralSize: number, currentOffset: number): Uint8Array {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entriesCount, true);
  view.setUint16(10, entriesCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, currentOffset, true);
  view.setUint16(20, 0, true);
  return record;
}
