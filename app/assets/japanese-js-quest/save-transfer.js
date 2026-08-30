(function (root, factory) {
  const api = factory(root)
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.JSQuestSaveTransfer = api
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict'

  const QUEST_PREFIX = 'japanese-js-quest-'
  const SLOT_KEY = 'japanese-js-quest-save-slot-initialized-v1'
  const FORMAT = 'japanese-js-quest-save'
  const SCHEMA_VERSION = 1
  const JSON_FILENAME = 'progress.json'

  function questStorageEntries (storage) {
    const entries = {}
    if (!storage) return entries
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (!key || !key.startsWith(QUEST_PREFIX)) continue
      entries[key] = storage.getItem(key)
    }
    return entries
  }

  function hasMeaningfulLocalData (storage) {
    return Object.keys(questStorageEntries(storage)).length > 0
  }

  function backupPayload (storage, appVersion, now) {
    return {
      format: FORMAT,
      schemaVersion: SCHEMA_VERSION,
      appVersion: String(appVersion || 'unknown'),
      exportedAt: (now || new Date()).toISOString(),
      storage: questStorageEntries(storage),
    }
  }

  function validatePayload (payload) {
    if (!payload || typeof payload !== 'object') throw new Error('セーブデータを読み取れません。')
    if (payload.format !== FORMAT) throw new Error('このファイルは JavaScript クエストのセーブデータではありません。')
    if (Number(payload.schemaVersion) !== SCHEMA_VERSION) throw new Error('このセーブデータの形式にはまだ対応していません。')
    if (!payload.storage || typeof payload.storage !== 'object' || Array.isArray(payload.storage)) {
      throw new Error('セーブデータの中身が正しくありません。')
    }

    for (const [key, value] of Object.entries(payload.storage)) {
      if (!key.startsWith(QUEST_PREFIX)) throw new Error('セーブデータに不明な項目があります。')
      if (value !== null && typeof value !== 'string') throw new Error('セーブデータの値が正しくありません。')
    }
    return payload
  }

  function clearQuestStorage (storage) {
    const keys = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (key && key.startsWith(QUEST_PREFIX)) keys.push(key)
    }
    keys.forEach(key => storage.removeItem(key))
    return keys.length
  }

  function restorePayload (payload, storage) {
    validatePayload(payload)
    if (!storage) throw new Error('ブラウザーの保存領域を使えません。')

    clearQuestStorage(storage)
    let restored = 0
    for (const [key, value] of Object.entries(payload.storage)) {
      if (value === null) continue
      storage.setItem(key, value)
      restored++
    }
    storage.setItem(SLOT_KEY, '1')
    return restored
  }

  function crc32 (bytes) {
    let crc = 0xFFFFFFFF
    for (const byte of bytes) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++) {
        crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0)
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  function writeUint16 (view, offset, value) {
    view.setUint16(offset, value, true)
  }

  function writeUint32 (view, offset, value) {
    view.setUint32(offset, value >>> 0, true)
  }

  function concatBytes (parts) {
    const size = parts.reduce((total, part) => total + part.length, 0)
    const result = new Uint8Array(size)
    let offset = 0
    for (const part of parts) {
      result.set(part, offset)
      offset += part.length
    }
    return result
  }

  function createStoredZip (filename, text) {
    const encoder = new TextEncoder()
    const name = encoder.encode(filename)
    const data = encoder.encode(text)
    const checksum = crc32(data)

    const local = new Uint8Array(30 + name.length)
    const localView = new DataView(local.buffer)
    writeUint32(localView, 0, 0x04034B50)
    writeUint16(localView, 4, 20)
    writeUint16(localView, 6, 0x0800)
    writeUint16(localView, 8, 0)
    writeUint16(localView, 10, 0)
    writeUint16(localView, 12, 0)
    writeUint32(localView, 14, checksum)
    writeUint32(localView, 18, data.length)
    writeUint32(localView, 22, data.length)
    writeUint16(localView, 26, name.length)
    writeUint16(localView, 28, 0)
    local.set(name, 30)

    const centralOffset = local.length + data.length
    const central = new Uint8Array(46 + name.length)
    const centralView = new DataView(central.buffer)
    writeUint32(centralView, 0, 0x02014B50)
    writeUint16(centralView, 4, 20)
    writeUint16(centralView, 6, 20)
    writeUint16(centralView, 8, 0x0800)
    writeUint16(centralView, 10, 0)
    writeUint16(centralView, 12, 0)
    writeUint16(centralView, 14, 0)
    writeUint32(centralView, 16, checksum)
    writeUint32(centralView, 20, data.length)
    writeUint32(centralView, 24, data.length)
    writeUint16(centralView, 28, name.length)
    writeUint16(centralView, 30, 0)
    writeUint16(centralView, 32, 0)
    writeUint16(centralView, 34, 0)
    writeUint16(centralView, 36, 0)
    writeUint32(centralView, 38, 0)
    writeUint32(centralView, 42, 0)
    central.set(name, 46)

    const end = new Uint8Array(22)
    const endView = new DataView(end.buffer)
    writeUint32(endView, 0, 0x06054B50)
    writeUint16(endView, 4, 0)
    writeUint16(endView, 6, 0)
    writeUint16(endView, 8, 1)
    writeUint16(endView, 10, 1)
    writeUint32(endView, 12, central.length)
    writeUint32(endView, 16, centralOffset)
    writeUint16(endView, 20, 0)

    return concatBytes([local, data, central, end])
  }

  function parseStoredZip (input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const decoder = new TextDecoder('utf-8')
    const files = {}
    let offset = 0

    while (offset + 4 <= bytes.length && view.getUint32(offset, true) === 0x04034B50) {
      if (offset + 30 > bytes.length) throw new Error('ZIP ファイルが途中で切れています。')
      const flags = view.getUint16(offset + 6, true)
      const compression = view.getUint16(offset + 8, true)
      const compressedSize = view.getUint32(offset + 18, true)
      const uncompressedSize = view.getUint32(offset + 22, true)
      const nameLength = view.getUint16(offset + 26, true)
      const extraLength = view.getUint16(offset + 28, true)
      if (flags & 0x0008) throw new Error('この ZIP 形式には対応していません。')
      if (compression !== 0 || compressedSize !== uncompressedSize) {
        throw new Error('圧縮された ZIP には対応していません。クエストから書き出した ZIP を選んでください。')
      }

      const nameStart = offset + 30
      const dataStart = nameStart + nameLength + extraLength
      const dataEnd = dataStart + compressedSize
      if (dataEnd > bytes.length) throw new Error('ZIP ファイルが壊れています。')
      const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength))
      files[name] = bytes.slice(dataStart, dataEnd)
      offset = dataEnd
    }
    return files
  }

  function backupArchiveBytes (storage, appVersion, now) {
    const payload = backupPayload(storage, appVersion, now)
    const json = JSON.stringify(payload, null, 2) + '\n'
    return createStoredZip(JSON_FILENAME, json)
  }

  function timestampForFilename (date) {
    return (date || new Date()).toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
  }

  function downloadBytes (bytes, filename, mimeType) {
    if (!root || !root.document || !root.URL || typeof Blob === 'undefined') return false
    const blob = new Blob([bytes], { type: mimeType || 'application/octet-stream' })
    const url = root.URL.createObjectURL(blob)
    const link = root.document.createElement('a')
    link.href = url
    link.download = filename
    root.document.body.appendChild(link)
    link.click()
    link.remove()
    root.setTimeout(() => root.URL.revokeObjectURL(url), 1000)
    return true
  }

  function exportProgress (storage, appVersion, now) {
    const date = now || new Date()
    const bytes = backupArchiveBytes(storage, appVersion, date)
    const filename = 'javascript-quest-progress_' + timestampForFilename(date) + '.zip'
    downloadBytes(bytes, filename, 'application/zip')
    return { filename, bytes }
  }

  function parseBackupBytes (bytes) {
    const decoder = new TextDecoder('utf-8')
    let text
    if (bytes[0] === 0x7B) {
      text = decoder.decode(bytes)
    } else {
      const files = parseStoredZip(bytes)
      const jsonBytes = files[JSON_FILENAME]
      if (!jsonBytes) throw new Error('ZIP の中に progress.json がありません。')
      text = decoder.decode(jsonBytes)
    }
    let payload
    try {
      payload = JSON.parse(text)
    } catch (_) {
      throw new Error('progress.json を読み取れません。')
    }
    return validatePayload(payload)
  }

  async function importFile (file, storage) {
    if (!file || typeof file.arrayBuffer !== 'function') throw new Error('ファイルを選んでください。')
    const bytes = new Uint8Array(await file.arrayBuffer())
    const payload = parseBackupBytes(bytes)
    const restored = restorePayload(payload, storage)
    return { payload, restored }
  }

  return Object.freeze({
    QUEST_PREFIX,
    SLOT_KEY,
    FORMAT,
    SCHEMA_VERSION,
    JSON_FILENAME,
    questStorageEntries,
    hasMeaningfulLocalData,
    backupPayload,
    validatePayload,
    clearQuestStorage,
    restorePayload,
    crc32,
    createStoredZip,
    parseStoredZip,
    backupArchiveBytes,
    parseBackupBytes,
    exportProgress,
    importFile,
    downloadBytes,
  })
})
