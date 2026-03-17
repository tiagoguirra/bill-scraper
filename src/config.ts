import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
  return value;
}

function optional(key: string): string | undefined {
  return process.env[key];
}

function resolveDir(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  return path.resolve(raw.replace(/^~/, os.homedir()));
}

export const config = {
  CPF_CNPJ: required('CPF_CNPJ'),
  SENHA: required('SENHA'),
  DOWNLOAD_DIR: resolveDir(optional('DOWNLOAD_DIR'), path.join(os.homedir(), 'Downloads', 'faturas')),
  EQUATORIAL_UC: optional('EQUATORIAL_UC'),
  EQUATORIAL_DATA_NASCIMENTO: optional('EQUATORIAL_DATA_NASCIMENTO'),
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  HEADLESS: process.env.HEADLESS !== 'false',
};
