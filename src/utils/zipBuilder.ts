import { crc32 } from "./zip/crc32";
import { ZipFileEntry, createLocalHeader, createCentralHeader, createEndRecord } from "./zip/zipHeaders";

export function buildZipBlob(files: Record<string, string>): Blob {
  const encoder = new TextEncoder();
  const fileEntries: ZipFileEntry[] = [];
  let currentOffset = 0;
  const localParts: Uint8Array[] = [];

  for (const [filename, rawContent] of Object.entries(files)) {
    const dataBytes = encoder.encode(rawContent.replace(/\r?\n/g, "\r\n"));
    const nameBytes = encoder.encode(filename);
    const crc = crc32(dataBytes);
    const localHeader = createLocalHeader(nameBytes, dataBytes, crc);

    fileEntries.push({ nameBytes, dataBytes, crc, offset: currentOffset });
    localParts.push(localHeader, dataBytes);
    currentOffset += localHeader.length + dataBytes.length;
  }

  const centralParts: Uint8Array[] = [];
  let centralSize = 0;
  for (const entry of fileEntries) {
    const centralHeader = createCentralHeader(entry);
    centralParts.push(centralHeader);
    centralSize += centralHeader.length;
  }

  const endRecord = createEndRecord(fileEntries.length, centralSize, currentOffset);
  const totalLength = currentOffset + centralSize + endRecord.length;
  const finalBuffer = new Uint8Array(totalLength);

  let pos = 0;
  for (const part of [...localParts, ...centralParts, endRecord]) {
    finalBuffer.set(part, pos);
    pos += part.length;
  }

  return new Blob([finalBuffer.buffer as ArrayBuffer], { type: "application/zip" });
}
