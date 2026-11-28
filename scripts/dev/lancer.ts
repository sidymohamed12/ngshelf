import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `npm start` : démarre ensemble le site (port 4200) et l'application d'aperçus (port 4201) pour que les
 * cases du catalogue et les fiches montrent leurs aperçus vivants. Le site relaie `/apercu` vers le port
 * 4201 (proxy.conf.mjs). Aucune dépendance : deux `ng serve`, sorties préfixées, arrêt commun sur Ctrl+C
 * ou dès que l'un des deux s'arrête. Le registre est déjà construit par le script `prestart`.
 * `PORT_SITE` change le port du site si le 4200 est pris (le port des aperçus, 4201, est fixé par le proxy).
 */
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const NG = join(RACINE, 'node_modules/@angular/cli/bin/ng.js');

interface Serveur {
  readonly nom: string;
  readonly projet: string;
  readonly options: readonly string[];
}

function portSite(): readonly string[] {
  const port = process.env['PORT_SITE'];
  return port && /^\d+$/.test(port) ? ['--port', port] : [];
}

const SERVEURS: readonly Serveur[] = [
  { nom: 'site', projet: 'ngshelf', options: portSite() },
  { nom: 'apercus', projet: 'apercus', options: [] },
];

const enfants: ChildProcess[] = [];
let arret = false;

function arreterTout(code: number): void {
  if (arret) return;
  arret = true;
  for (const enfant of enfants) enfant.kill('SIGTERM');
  process.exitCode = code;
}

function relayer(flux: NodeJS.ReadableStream, sortie: NodeJS.WriteStream, nom: string): void {
  const lecteur = createInterface({ input: flux });
  lecteur.on('line', (ligne) => sortie.write(`[${nom}] ${ligne}\n`));
}

function lancer({ nom, projet, options }: Serveur): void {
  const enfant = spawn(process.execPath, [NG, 'serve', projet, ...options], {
    cwd: RACINE,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  enfants.push(enfant);
  if (enfant.stdout) relayer(enfant.stdout, process.stdout, nom);
  if (enfant.stderr) relayer(enfant.stderr, process.stderr, nom);
  enfant.on('exit', (code) => {
    if (arret) return;
    process.stderr.write(
      `[${nom}] arrêté (code ${code ?? 'inconnu'}) : arrêt de l'autre serveur.\n`,
    );
    arreterTout(code ?? 1);
  });
}

process.on('SIGINT', () => arreterTout(0));
process.on('SIGTERM', () => arreterTout(0));
process.stdout.write('Site : http://localhost:4200/   Aperçus : http://localhost:4201/apercu/\n');
SERVEURS.forEach(lancer);
