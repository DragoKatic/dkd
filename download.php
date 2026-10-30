<?php
/*
 * Download counter of the Drago Katić Development site.
 * License: GPL-2.0-or-later (https://dkd.rs/LICENSE.txt)
 *
 * The download links of the site point straight at the files (the plugin ZIPs on GitHub) and carry
 * data-download="<id>"; on click, js/script.js (download-count.js) reports the download here with
 * navigator.sendBeacon (POST download.php?file=<id>, answered 204). A GET of download.php?file=<id>
 * counts and redirects to the file, for links shared elsewhere. Only the file, the day and the
 * number are stored - no IP address, no cookie, nothing about the visitor - in one SQLite file in
 * dkd-data/ outside the web root (or data/, closed to the web by .htaccess), so no MySQL database is used. Bots are not counted.
 *
 *   php download.php --stats    downloads per file (total, last 30 days), command line only
 */

declare(strict_types=1);

// Errors go to the server log, never to the visitor (the host's php.ini may have display_errors On)
ini_set('display_errors', '0');

// id => where the file is; a new download = a new line here + data-download="<id>" on its link
const FILES = [
    'barebones-popup'   => 'https://github.com/DragoKatic/barebones-popup/archive/refs/heads/main.zip',
    'earlycart-sold'    => 'https://github.com/DragoKatic/earlycart-sold/archive/refs/heads/main.zip',
    'humans-manifesto'  => 'https://github.com/DragoKatic/humans-manifesto/archive/refs/heads/main.zip',
    'robots-manifesto'  => 'https://github.com/DragoKatic/robots-manifesto/archive/refs/heads/main.zip',
];
// The counts live outside the web root when a sibling directory dkd-data exists (on the host:
// /home/<account>/dkd-data next to public_html); otherwise in data/ here (closed by .htaccess).
// Own file for this site only (Yoga Loznica has its own).
define('DATABASE', (is_dir(dirname(__DIR__) . '/dkd-data') ? dirname(__DIR__) . '/dkd-data' : __DIR__ . '/data') . '/dkd-downloads.sqlite');
const BOTS = '/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|curl|wget|python|java\/|go-http|headless/i';

if (PHP_SAPI === 'cli') {
    in_array('--stats', $argv, true) ? printStats() : fwrite(STDERR, "usage: php download.php --stats\n");
    exit;
}

header('X-Robots-Tag: noindex, nofollow');
$id = (string) ($_GET['file'] ?? '');
if (!isset(FILES[$id])) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    exit("Unknown file.\n");
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
$agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
if (in_array($method, ['GET', 'POST'], true) && $agent !== '' && !preg_match(BOTS, $agent)) {
    try {
        countDownload($id);
    } catch (Throwable $e) {
        error_log('download.php: ' . $e->getMessage());   // a failed count never blocks the download
    }
}

header('Cache-Control: no-store');
if ($method === 'POST') {
    http_response_code(204);   // the beacon of a click; the browser is already on its way to the file
    exit;
}
header('Location: ' . FILES[$id], true, 302);


function database(): PDO
{
    if (!is_dir(dirname(DATABASE))) {
        mkdir(dirname(DATABASE), 0750, true);
    }
    $db = new PDO('sqlite:' . DATABASE, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout = 3000');
    $db->exec('CREATE TABLE IF NOT EXISTS downloads (
        file TEXT NOT NULL,
        day  TEXT NOT NULL,
        n    INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (file, day)
    )');
    return $db;
}

function countDownload(string $id): void
{
    database()
        ->prepare('INSERT INTO downloads (file, day, n) VALUES (?, ?, 1)
                   ON CONFLICT (file, day) DO UPDATE SET n = n + 1')
        ->execute([$id, gmdate('Y-m-d')]);
}

function printStats(): void
{
    if (!is_file(DATABASE)) {
        echo "No downloads yet.\n";
        return;
    }
    $since = gmdate('Y-m-d', strtotime('-29 days'));
    $rows = database()->query("SELECT file, SUM(n) AS total,
                                      SUM(CASE WHEN day >= '$since' THEN n ELSE 0 END) AS last30
                               FROM downloads GROUP BY file ORDER BY total DESC")->fetchAll(PDO::FETCH_ASSOC);
    printf("%-20s %8s %14s\n", 'file', 'total', 'last 30 days');
    foreach ($rows as $r) {
        printf("%-20s %8d %14d\n", $r['file'], $r['total'], $r['last30']);
    }
}
