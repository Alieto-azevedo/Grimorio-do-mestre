// Leitor de arquivos .zip mínimo (sem dependências), suficiente para exportações do Notion.
// Suporta entradas armazenadas (0) e comprimidas com deflate (8), nomes UTF-8 e ZIP64.
const zlib = require('zlib');

function lerZip(buf) {
  // Localiza o registro "End of Central Directory"
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Arquivo .zip inválido ou corrompido.');

  let total = buf.readUInt16LE(eocd + 10);
  let inicioCD = buf.readUInt32LE(eocd + 16);

  // ZIP64
  if (inicioCD === 0xffffffff || total === 0xffff) {
    const loc = eocd - 20;
    if (loc >= 0 && buf.readUInt32LE(loc) === 0x07064b50) {
      const eocd64 = Number(buf.readBigUInt64LE(loc + 8));
      total = Number(buf.readBigUInt64LE(eocd64 + 32));
      inicioCD = Number(buf.readBigUInt64LE(eocd64 + 48));
    }
  }

  const entradas = [];
  let p = inicioCD;
  for (let n = 0; n < total; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const flags = buf.readUInt16LE(p + 8);
    const metodo = buf.readUInt16LE(p + 10);
    let tamComp = buf.readUInt32LE(p + 20);
    let tamOrig = buf.readUInt32LE(p + 24);
    const lenNome = buf.readUInt16LE(p + 28);
    const lenExtra = buf.readUInt16LE(p + 30);
    const lenComent = buf.readUInt16LE(p + 32);
    let offsetLocal = buf.readUInt32LE(p + 42);
    const nomeBuf = buf.subarray(p + 46, p + 46 + lenNome);
    const nome = (flags & 0x800) ? nomeBuf.toString('utf8') : decodificarNome(nomeBuf);

    // Campo extra ZIP64
    let e = p + 46 + lenNome;
    const fimExtra = e + lenExtra;
    while (e + 4 <= fimExtra) {
      const idCampo = buf.readUInt16LE(e);
      const tam = buf.readUInt16LE(e + 2);
      if (idCampo === 0x0001) {
        let q = e + 4;
        if (tamOrig === 0xffffffff) { tamOrig = Number(buf.readBigUInt64LE(q)); q += 8; }
        if (tamComp === 0xffffffff) { tamComp = Number(buf.readBigUInt64LE(q)); q += 8; }
        if (offsetLocal === 0xffffffff) { offsetLocal = Number(buf.readBigUInt64LE(q)); q += 8; }
      }
      e += 4 + tam;
    }

    entradas.push({ nome, metodo, tamComp, tamOrig, offsetLocal, pasta: nome.endsWith('/') });
    p = fimExtra + lenComent;
  }

  return entradas.map(ent => ({
    nome: ent.nome,
    pasta: ent.pasta,
    tamanho: ent.tamOrig,
    ler() {
      const o = ent.offsetLocal;
      if (buf.readUInt32LE(o) !== 0x04034b50) throw new Error('Entrada corrompida: ' + ent.nome);
      const ini = o + 30 + buf.readUInt16LE(o + 26) + buf.readUInt16LE(o + 28);
      const dados = buf.subarray(ini, ini + ent.tamComp);
      if (ent.metodo === 0) return Buffer.from(dados);
      if (ent.metodo === 8) return zlib.inflateRawSync(dados);
      throw new Error('Método de compressão não suportado em ' + ent.nome);
    }
  }));
}

// Nomes sem a flag UTF-8: tenta UTF-8 e cai para latin1 (cp437 aproximado)
function decodificarNome(b) {
  const s = b.toString('utf8');
  return s.includes('�') ? b.toString('latin1') : s;
}

module.exports = { lerZip };
