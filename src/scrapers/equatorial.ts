import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const LOGIN_URL = 'https://goias.equatorialenergia.com.br';
const SEGUNDA_VIA_URL = 'https://goias.equatorialenergia.com.br/AgenciaGO/Servi%C3%A7os/aberto/SegundaVia.aspx';

export async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const { config } = await import('../config');
  const browser = await chromium.launch({ headless: config.HEADLESS });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  return { browser, page };
}

export async function login(page: Page, uc: string, cpf: string, dataNascimento: string): Promise<void> {
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

  await page.locator('#WEBDOOR_headercorporativogo_txtUC').click();
  await page.locator('#WEBDOOR_headercorporativogo_txtUC').pressSequentially(uc, { delay: 50 });
  await page.locator('#WEBDOOR_headercorporativogo_txtDocumento').click();
  await page.locator('#WEBDOOR_headercorporativogo_txtDocumento').pressSequentially(cpf, { delay: 50 });

  await page.locator('button:has-text("Entrar")').click();

  const campData = page.locator('#WEBDOOR_headercorporativogo_txtData');
  await campData.waitFor({ state: 'visible', timeout: 15000 });

  await campData.click();
  for (const char of dataNascimento.replace(/\//g, '')) {
    await page.keyboard.press(char, { delay: 100 });
    await page.waitForTimeout(100);
  }

  await page.locator('#WEBDOOR_headercorporativogo_btnValidar').click();
  await page.waitForLoadState('networkidle');

  const btnModal = page.locator('.btn.btn-info.ModalButton');
  await btnModal.waitFor({ state: 'visible', timeout: 10000 });
  await btnModal.click();
  await page.waitForLoadState('networkidle');
}

export async function listarFaturas(page: Page, uc: string, downloadDir: string): Promise<string> {
  fs.mkdirSync(downloadDir, { recursive: true });

  await page.goto(SEGUNDA_VIA_URL, { waitUntil: 'networkidle' });

  await page.locator('#CONTENT_comboBoxUC').selectOption(uc);
  await page.waitForLoadState('networkidle');

  await page.locator('#CONTENT_cbTipoEmissao').selectOption('completa');
  await page.locator('#CONTENT_cbMotivo').selectOption('ESV00');

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.locator('#CONTENT_btEnviar').click(),
  ]);

  const ext = path.extname(download.suggestedFilename()) || '.pdf';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const nomeArquivo = `equatorial_${timestamp}${ext}`;
  const destino = path.join(downloadDir, nomeArquivo);

  await download.saveAs(destino);
  return destino;
}
