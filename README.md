# bill-scraper

API para download automatizado de boletos de água (Saneago) e energia (Equatorial) via web scraping com Playwright.

## Stack

- **Runtime**: Node.js + TypeScript
- **API**: Fastify
- **Automação**: Playwright (Chromium)

## Instalação

```bash
npm install
npx playwright install chromium
```

## Configuração

Crie o arquivo `.env` na raiz do projeto:

```env
SANEAGO_CPF_CNPJ=seu_cpf_ou_cnpj
SANEAGO_SENHA=sua_senha

EQUATORIAL_CPF=seu_cpf
EQUATORIAL_UC=numero_da_unidade_consumidora
EQUATORIAL_DATA_NASCIMENTO=DD/MM/AAAA

DOWNLOAD_DIR=~/Downloads/faturas
HEADLESS=true
PORT=3000
```

| Variável                      | Descrição                                                   | Obrigatório     |
|-------------------------------|-------------------------------------------------------------|-----------------|
| `SANEAGO_CPF_CNPJ`            | CPF ou CNPJ do titular (Saneago)                            | Sim             |
| `SANEAGO_SENHA`               | Senha do portal Saneago                                     | Sim             |
| `EQUATORIAL_CPF`              | CPF do titular (Equatorial)                                 | Para Equatorial |
| `EQUATORIAL_UC`               | Número da Unidade Consumidora (Equatorial)                  | Para Equatorial |
| `EQUATORIAL_DATA_NASCIMENTO`  | Data de nascimento no formato `DD/MM/AAAA` (Equatorial)    | Para Equatorial |
| `DOWNLOAD_DIR`                | Pasta onde os PDFs serão salvos (padrão: `~/Downloads/faturas`) | Não         |
| `HEADLESS`                    | Roda o navegador sem interface gráfica (padrão: `true`)     | Não             |
| `PORT`                        | Porta da API (padrão: `3000`)                               | Não             |

## Rodando a API

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build && npm start
```

## Endpoints

### Saneago (água)

| Método | Endpoint                   | Descrição                              |
|--------|----------------------------|----------------------------------------|
| GET    | `/saneago/list`            | Retorna JSON com faturas em aberto     |
| GET    | `/saneago/download/:num`   | Retorna PDF da fatura pelo número      |
| GET    | `/saneago/download-all`    | Retorna PDF com todas as faturas       |

### Equatorial (energia)

| Método | Endpoint           | Descrição                              |
|--------|--------------------|----------------------------------------|
| GET    | `/equatorial/list` | Emite e retorna PDF da fatura atual    |

## CLI (bill.sh)

O script `bill.sh` facilita o uso da API no terminal. Configure o arquivo `bill.conf` na raiz do projeto:

```bash
BILL_URL=http://localhost:3000
DOWNLOAD_DIR=/caminho/para/downloads
```

### Comandos disponíveis

```bash
# Listar faturas em aberto
./bill.sh saneago:list

# Baixar fatura específica (use list para ver os números)
./bill.sh saneago:download 1

# Baixar todas as faturas em aberto
./bill.sh saneago:download-all
```

Saída dos comandos de download:
```
Fatura Saneago #1:
MEDIA:/caminho/para/saneago-20260317143000.pdf
```

## Provedores suportados

| Provedor   | Serviço | Portal                                          |
|------------|---------|-------------------------------------------------|
| Saneago    | Água    | agencia-virtual.saneago.com.br                  |
| Equatorial | Energia | goias.equatorialenergia.com.br                  |
