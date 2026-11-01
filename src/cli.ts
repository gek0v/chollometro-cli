import { Command } from "commander";
import ora from "ora";
import open from "open";
import chalk from "chalk";
import { ChollometroClient } from "./lib/client.js";
import { searchDeals } from "./lib/search.js";
import { resolveMerchantUrl } from "./lib/url-cleaner.js";
import { renderDealsTable, renderSearchTable, renderDealDetail } from "./lib/ui.js";

const program = new Command();

program
  .name("chollometro")
  .description("CLI rápido y limpio para consultar y buscar ofertas en Chollometro")
  .version("0.1.0");

// 1. Comando HOT (Chollos más calientes)
program
  .command("hot")
  .description("Muestra las ofertas más destacadas y calientes del momento")
  .option("-l, --limit <number>", "Número máximo de resultados", "15")
  .option("-m, --min-temp <number>", "Temperatura mínima para filtrar", "0")
  .option("--json", "Salida en formato JSON crudo")
  .action(async (options) => {
    const spinner = ora("Consultando ofertas destacadas...").start();
    try {
      const client = new ChollometroClient();
      let deals = await client.getHotDeals(parseInt(options.limit, 10));

      const minTemp = parseInt(options.minTemp, 10);
      if (minTemp > 0) {
        deals = deals.filter((d) => d.temperature >= minTemp);
      }

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(deals, null, 2));
      } else {
        renderDealsTable(deals);
      }
    } catch (error: any) {
      spinner.fail(`Error al obtener ofertas: ${error.message}`);
      process.exit(1);
    }
  });

// 2. Comando NEW (Últimos chollos cronológicos)
program
  .command("new")
  .description("Muestra las últimas ofertas recién publicadas por los usuarios")
  .option("-l, --limit <number>", "Número máximo de resultados", "15")
  .option("--json", "Salida en formato JSON crudo")
  .action(async (options) => {
    const spinner = ora("Obteniendo últimos chollos...").start();
    try {
      const client = new ChollometroClient();
      const deals = await client.getNewDeals(parseInt(options.limit, 10));
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(deals, null, 2));
      } else {
        renderDealsTable(deals);
      }
    } catch (error: any) {
      spinner.fail(`Error al obtener novedades: ${error.message}`);
      process.exit(1);
    }
  });

// 3. Comando SEARCH (Búsqueda por texto)
program
  .command("search <query>")
  .description("Busca ofertas por palabra clave o producto")
  .option("-p, --page <number>", "Número de página", "1")
  .option("--hide-expired", "Ocultar ofertas marcadas como expiradas")
  .option("--json", "Salida en formato JSON crudo")
  .action(async (query, options) => {
    const spinner = ora(`Buscando ofertas para "${query}"...`).start();
    try {
      const results = await searchDeals(query, {
        page: parseInt(options.page, 10),
        hideExpired: options.hideExpired,
      });
      spinner.stop();

      if (results.length === 0) {
        console.log(chalk.yellow(`No se encontraron ofertas para "${query}".`));
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        renderSearchTable(results);
      }
    } catch (error: any) {
      spinner.fail(`Error en la búsqueda: ${error.message}`);
      process.exit(1);
    }
  });

// 4. Comando INFO (Ficha técnica del chollo)
program
  .command("info <threadId>")
  .description("Muestra el detalle completo, cupones y condiciones de un chollo")
  .option("--json", "Salida en formato JSON crudo")
  .action(async (threadId, options) => {
    const spinner = ora(`Obteniendo detalles del chollo #${threadId}...`).start();
    try {
      const client = new ChollometroClient();
      const deal = await client.getDealDetail(threadId);
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(deal, null, 2));
      } else {
        renderDealDetail(deal);
      }
    } catch (error: any) {
      spinner.fail(`Error al obtener detalle del chollo: ${error.message}`);
      process.exit(1);
    }
  });

// 5. Comando OPEN (Abre o extrae la URL directa a la tienda)
program
  .command("open <threadId>")
  .description("Resuelve la tienda real y abre la oferta en el navegador")
  .option("-p, --print", "Imprime la URL directa en lugar de abrir el navegador")
  .option("--no-clean", "Conserva los códigos y rastreadores de afiliado originales")
  .action(async (threadId, options) => {
    const spinner = ora(`Resolviendo tienda para #${threadId}...`).start();
    try {
      const finalUrl = await resolveMerchantUrl(threadId, { clean: options.clean !== false });
      spinner.succeed(`Enlace resuelto: ${finalUrl}`);

      if (options.print) {
        console.log(finalUrl);
      } else {
        console.log(chalk.gray("Abriendo en el navegador predeterminado..."));
        await open(finalUrl);
      }
    } catch (error: any) {
      spinner.fail(`Error al abrir oferta: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
