import { test, expect } from '@playwright/test';

test('real API: create expense, export, reload and delete', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('Dados locais', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Novo lançamento', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrição').fill('Café de teste');
  await dialog.getByLabel('Valor (R$)').fill('12,50');
  await dialog.getByLabel('Categoria', { exact: true }).fill('Alimentação');
  await dialog.getByLabel('Instituição', { exact: true }).fill('Banco de teste');
  await dialog.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('Café de teste', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Café de teste', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Movimentações', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar' }).click();
  expect((await download).suggestedFilename()).toContain('lastro-movimentacoes');
  await page.getByRole('button', { name: 'Excluir Café de teste', exact: true }).click();
  await page.getByRole('button', { name: 'Manter registro' }).click();
  await expect(page.getByText('Café de teste', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Excluir Café de teste', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir registro', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('Café de teste', { exact: true })).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('investment and wish forms persist to the real API', async ({ page }) => {
  await page.goto('/#investments');
  await expect(page.getByText('Dados locais', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Registrar investimento', exact: true }).first().click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome do ativo').fill('CDB de teste');
  await dialog.getByLabel('Valor (R$)').fill('1000,00');
  await dialog.getByLabel('Instituição', { exact: true }).fill('Corretora teste');
  await dialog.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByText('CDB de teste', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Excluir CDB de teste', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir registro', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('CDB de teste', { exact: true })).not.toBeVisible();
  await page.getByRole('link', { name: 'Meus desejos', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar desejo', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('O que você quer realizar?').fill('Viagem de teste');
  await dialog.getByLabel('Preço máximo (R$)').fill('4800');
  await dialog.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByRole('heading', { name: 'Viagem de teste' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Viagem de teste' })).toBeVisible();
  await page.getByRole('button', { name: 'Excluir Viagem de teste', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir registro', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Viagem de teste' })).not.toBeVisible();
});

test('demo, filters, privacy, keyboard and desktop layout', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demonstração', exact: true }).first().click();
  await expect(
    page.getByText('Você está explorando dados fictícios.', { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('desktop-overview.png'), fullPage: true });
  await page.getByRole('button', { name: 'Ocultar valores', exact: true }).click();
  await expect(page.locator('.stat-value').first()).toHaveText('R$ •••••');
  await page.getByRole('button', { name: 'Mostrar valores', exact: true }).click();
  await page.getByRole('link', { name: 'Movimentações', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar movimentações' }).fill('Aluguel');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Receitas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nenhum resultado por aqui.' })).toBeVisible();
  await page.getByRole('button', { name: 'Novo lançamento', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Meus desejos', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('desktop-wishes.png'), fullPage: true });
});

test('mobile navigation and no horizontal page overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await page.getByRole('button', { name: 'Explorar demonstração', exact: true }).first().click();
  await page.getByRole('link', { name: 'Visão geral', exact: true }).click();
  await expect(page.locator('.sidebar')).not.toHaveClass(/is-open/);
  await page.screenshot({ path: testInfo.outputPath('mobile-overview.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Novo lançamento', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mobile-form.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
});

test('connection failures are explicit and demo does not write to API', async ({ page }) => {
  let writes = 0;
  await page.route('**/api/**', (route) => {
    if (route.request().method() !== 'GET') writes++;
    return route.fulfill({ status: 503, body: 'offline' });
  });
  await page.goto('/');
  await expect(page.getByText('Vamos conectar seu espaço.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explorar demonstração', exact: true }).first().click();
  await page.getByRole('button', { name: 'Novo lançamento', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrição').fill('Somente demonstração');
  await dialog.getByLabel('Valor (R$)').fill('10');
  await dialog.getByLabel('Categoria', { exact: true }).fill('Outros');
  await dialog.getByLabel('Instituição', { exact: true }).fill('Teste');
  await dialog.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(dialog).not.toBeVisible();
  expect(writes).toBe(0);
});
