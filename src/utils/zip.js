// Minimal zip writer (stored, no compression) — enough to bundle a .tex file with its images
// for Overleaf without pulling in a zip library.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function header(size) {
  const buf = new Uint8Array(size);
  return { buf, view: new DataView(buf.buffer) };
}

// files: [{ name: "main.tex", data: Uint8Array }]
export function makeZip(files) {
  const encoder = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;

  files.forEach(({ name, data }) => {
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);

    const local = header(30);
    local.view.setUint32(0, 0x04034b50, true);
    local.view.setUint16(4, 20, true);
    local.view.setUint16(6, 0x0800, true); // UTF-8 file names
    local.view.setUint32(14, crc, true);
    local.view.setUint32(18, data.length, true);
    local.view.setUint32(22, data.length, true);
    local.view.setUint16(26, nameBytes.length, true);
    parts.push(local.buf, nameBytes, data);

    const entry = header(46);
    entry.view.setUint32(0, 0x02014b50, true);
    entry.view.setUint16(4, 20, true);
    entry.view.setUint16(6, 20, true);
    entry.view.setUint16(8, 0x0800, true);
    entry.view.setUint32(16, crc, true);
    entry.view.setUint32(20, data.length, true);
    entry.view.setUint32(24, data.length, true);
    entry.view.setUint16(28, nameBytes.length, true);
    entry.view.setUint32(42, offset, true);
    central.push(entry.buf, nameBytes);

    offset += 30 + nameBytes.length + data.length;
  });

  const centralSize = central.reduce((n, b) => n + b.length, 0);
  const end = header(22);
  end.view.setUint32(0, 0x06054b50, true);
  end.view.setUint16(8, files.length, true);
  end.view.setUint16(10, files.length, true);
  end.view.setUint32(12, centralSize, true);
  end.view.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end.buf], { type: "application/zip" });
}
