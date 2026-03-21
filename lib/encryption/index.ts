import CryptoJS from "crypto-js"

const getKey = () => {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 32) throw new Error("ENCRYPTION_KEY must be exactly 32 characters")
  return key
}

export const encrypt = (value: string): string =>
  CryptoJS.AES.encrypt(value, getKey()).toString()

export const decrypt = (encrypted: string): string =>
  CryptoJS.AES.decrypt(encrypted, getKey()).toString(CryptoJS.enc.Utf8)

export const encryptIfExists = (value?: string | null): string | null =>
  value ? encrypt(value) : null

export const decryptIfExists = (value?: string | null): string | null =>
  value ? decrypt(value) : null
