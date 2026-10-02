/**
 * Чистый генератор стандартного ZIP-архива в браузере (Store / без сжатия, 100% совместимость с Проводником Windows).
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function buildZipBlob(files: Record<string, string>): Blob {
  const encoder = new TextEncoder();
  const fileEntries: {
    nameBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  let currentOffset = 0;
  const localParts: Uint8Array[] = [];

  for (const [filename, rawContent] of Object.entries(files)) {
    // Гарантируем CRLF (\r\n) для всех файлов под Windows
    const normalizedContent = rawContent.replace(/\r?\n/g, "\r\n");
    const nameBytes = encoder.encode(filename);
    const dataBytes = encoder.encode(normalizedContent);
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed to extract
    view.setUint16(6, 0x0800, true); // General purpose bit flag (UTF-8 filename)
    view.setUint16(8, 0, true); // Compression method (0 = store)
    view.setUint16(10, 0, true); // Last mod file time
    view.setUint16(12, 0x5421, true); // Last mod file date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, dataBytes.length, true); // Compressed size
    view.setUint32(22, dataBytes.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    fileEntries.push({
      nameBytes,
      dataBytes,
      crc,
      offset: currentOffset,
    });

    localParts.push(localHeader, dataBytes);
    currentOffset += localHeader.length + dataBytes.length;
  }

  const centralParts: Uint8Array[] = [];
  let centralSize = 0;

  for (const entry of fileEntries) {
    const centralHeader = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(centralHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central file header signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed to extract
    view.setUint16(8, 0x0800, true); // UTF-8 flag
    view.setUint16(10, 0, true); // Compression method (0 = store)
    view.setUint16(12, 0, true); // Time
    view.setUint16(14, 0x5421, true); // Date
    view.setUint32(16, entry.crc, true); // CRC-32
    view.setUint32(20, entry.dataBytes.length, true); // Compressed size
    view.setUint32(24, entry.dataBytes.length, true); // Uncompressed size
    view.setUint16(28, entry.nameBytes.length, true); // File name length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, entry.offset, true); // Relative offset of local header
    centralHeader.set(entry.nameBytes, 46);

    centralParts.push(centralHeader);
    centralSize += centralHeader.length;
  }

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true); // End of central dir signature
  endView.setUint16(4, 0, true); // Number of this disk
  endView.setUint16(6, 0, true); // Disk where central directory starts
  endView.setUint16(8, fileEntries.length, true); // Entries on this disk
  endView.setUint16(10, fileEntries.length, true); // Total entries
  endView.setUint32(12, centralSize, true); // Size of central directory
  endView.setUint32(16, currentOffset, true); // Offset of start of central directory
  endView.setUint16(20, 0, true); // ZIP file comment length

  const totalLength = currentOffset + centralSize + endRecord.length;
  const finalBuffer = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of localParts) {
    finalBuffer.set(part, pos);
    pos += part.length;
  }
  for (const part of centralParts) {
    finalBuffer.set(part, pos);
    pos += part.length;
  }
  finalBuffer.set(endRecord, pos);

  return new Blob([finalBuffer.buffer as ArrayBuffer], {
    type: "application/zip",
  });
}
