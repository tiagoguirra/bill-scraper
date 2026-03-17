import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'https://agencia-virtual.saneago.com.br';

export interface Fatura {
  idx: number;
  referencia: string;
  vencimento: string;
  valor: string;
}

export async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const { config } = await import('../config');
  const browser = await chromium.launch({ headless: config.HEADLESS });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  return { browser, page };
}

export async function login(page: Page, cpfCnpj: string, senha: string): Promise<void> {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

  const btnAceitar = page.locator('ion-button:has-text("Aceitar")');
  try {
    await btnAceitar.waitFor({ state: 'visible', timeout: 5000 });
    await btnAceitar.click();
    await page.waitForTimeout(500);
  } catch {
    // botão não apareceu, segue sem aceitar
  }

  await page.fill('[name="cpfCnpj"], #cpfCnpj, input[placeholder*="CPF"], input[placeholder*="cnpj"]', cpfCnpj);
  await page.fill('[name="senha"], #senha, input[type="password"]', senha);

  await page.click('button[type="submit"], input[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { waitUntil: 'networkidle', timeout: 15000 });
}

export async function navegarParaSegundaVia(page: Page): Promise<void> {
  const menuBtn = page.locator('ion-menu-button, [menu-toggle], button[aria-label*="menu"]').first();
  if (await menuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await menuBtn.click();
    await page.waitForTimeout(500);
  }

  await page.locator('ion-item[router-link="/segundaVia"], ion-item[href="/segundaVia"]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('table.p-datatable-table', { timeout: 15000 });
}

export async function listarFaturas(page: Page): Promise<Fatura[]> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('tbody.p-datatable-tbody tr.p-selectable-row')).map((tr, idx) => {
      const cells = Array.from(tr.querySelectorAll('td[role="cell"]')) as HTMLElement[];
      const [, referencia, vencimento, valor] = cells.map(td => td.innerText.trim());
      return { idx, referencia, vencimento, valor };
    });
  });
}

export async function selecionarFatura(page: Page, idx: number): Promise<void> {
  const checkboxes = page.locator('tbody.p-datatable-tbody tr.p-selectable-row .p-checkbox-box');
  await checkboxes.nth(idx).click();
}

export async function gerarEBaixar(page: Page, downloadDir: string): Promise<string> {
  fs.mkdirSync(downloadDir, { recursive: true });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.locator('button:has-text("Gerar fatura")').click(),
  ]);

  const ext = path.extname(download.suggestedFilename()) || '.pdf';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const nomeArquivo = `saneago_${timestamp}${ext}`;
  const destino = path.join(downloadDir, nomeArquivo);

  await download.saveAs(destino);
  return destino;
}
