<?php
declare(strict_types=1);

// Errors go to the server log, never to the visitor (the host's php.ini may have display_errors On)
ini_set('display_errors', '0');

/**
 * Download counts of the WordPress plugins offered on ecommerce.html - a read-only view of the
 * SQLite file that download.php writes (file, day, n; days are UTC, no visitor data is stored).
 *
 * The page refuses to show anything unless the web server has authenticated a user: protect the
 * directory in cPanel (Directory Privacy) - the user name and password are chosen there and never
 * appear in this code. For development only: with the environment variable DKD_STATS_OPEN=1
 * (e.g. `DKD_STATS_OPEN=1 php -S 127.0.0.1:8098`) it is shown without a login.
 *
 * Address: https://dkd.rs/stats/downloads.php
 */

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');

$user = $_SERVER['REMOTE_USER'] ?? $_SERVER['REDIRECT_REMOTE_USER'] ?? $_SERVER['PHP_AUTH_USER'] ?? '';
if ($user === '' && getenv('DKD_STATS_OPEN') !== '1') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    exit("This page is shown only after a login.\nProtect the directory stats/ with Directory Privacy in cPanel.\n");
}

// Same place as download.php: dkd-data next to the web root when it exists, otherwise data/ in the site.
$root = dirname(__DIR__);
$database = (is_dir(dirname($root) . '/dkd-data') ? dirname($root) . '/dkd-data' : $root . '/data') . '/dkd-downloads.sqlite';

$rows = [];
if (is_file($database)) {
    $db = new PDO('sqlite:' . $database, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA query_only = ON');
    $db->exec('PRAGMA busy_timeout = 3000');
    $rows = $db->query('SELECT file, day, n FROM downloads ORDER BY day')->fetchAll(PDO::FETCH_ASSOC);
}

$today = gmdate('Y-m-d');
$from7 = gmdate('Y-m-d', strtotime('-6 days'));
$from30 = gmdate('Y-m-d', strtotime('-29 days'));

$files = [];   // file => [total, last30, last7, today, first, last]
$daily = [];   // day => n (all files), last 30 days
for ($i = 29; $i >= 0; $i--) {
    $daily[gmdate('Y-m-d', strtotime("-$i days"))] = 0;
}
foreach ($rows as $r) {
    $f = &$files[$r['file']];
    $f ??= ['total' => 0, 'last30' => 0, 'last7' => 0, 'today' => 0, 'first' => $r['day'], 'last' => $r['day']];
    $n = (int) $r['n'];
    $f['total'] += $n;
    $f['first'] = min($f['first'], $r['day']);
    $f['last'] = max($f['last'], $r['day']);
    if ($r['day'] >= $from30) {
        $f['last30'] += $n;
        $daily[$r['day']] += $n;
    }
    if ($r['day'] >= $from7) {
        $f['last7'] += $n;
    }
    if ($r['day'] === $today) {
        $f['today'] += $n;
    }
    unset($f);
}
uasort($files, static fn(array $a, array $b): int => $b['total'] <=> $a['total']);

$sum = static fn(string $key): int => array_sum(array_column($files, $key));
$max = max(1, ...array_values($daily));
$h = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Download counts</title>
<style>
@font-face { font-family: "JetBrains Mono"; src: url("../fonts/JetBrainsMono-Regular.woff2") format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "JetBrains Mono"; src: url("../fonts/JetBrainsMono-Bold.woff2") format("woff2"); font-weight: 700; font-display: swap; }
:root { --bg: #0d1321; --panel: #151d33; --line: #2a3454; --text: #e8ebf5; --muted: #98a2c3; --orange: #ff911c; }
* { box-sizing: border-box; }
body { margin: 0; padding: 2rem 1rem 3rem; background: var(--bg); color: var(--text); font: 400 1rem/1.5 "JetBrains Mono", ui-monospace, monospace; }
main { max-width: 56rem; margin: 0 auto; }
h1 { margin: 0 0 .25rem; font-size: 1.5rem; }
h2 { margin: 2.25rem 0 .75rem; font-size: 1.1rem; color: var(--orange); }
p { margin: 0 0 1rem; color: var(--muted); }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .75rem; margin: 1.5rem 0 0; }
.card { padding: .9rem 1rem; background: var(--panel); border: 1px solid var(--line); border-radius: .5rem; }
.card b { display: block; font-size: 1.75rem; line-height: 1.2; }
.card span { color: var(--muted); font-size: .85rem; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: var(--panel); border: 1px solid var(--line); }
th, td { padding: .55rem .75rem; text-align: right; border-bottom: 1px solid var(--line); white-space: nowrap; }
th:first-child, td:first-child { text-align: left; }
th { color: var(--muted); font-weight: 400; font-size: .85rem; }
tbody tr:last-child td { border-bottom: 0; }
svg { display: block; width: 100%; height: auto; background: var(--panel); border: 1px solid var(--line); border-radius: .5rem; }
.bar { fill: var(--orange); }
.bar.zero { fill: var(--line); }
.axis { fill: var(--muted); font-size: 11px; font-family: inherit; }
.note { font-size: .85rem; }
a { color: var(--orange); }
</style>
</head>
<body>
<main>
<h1>Download counts</h1>
<p>The WordPress plugins offered on ecommerce.html. Days are UTC; one count is one click with JavaScript on, without bots.<?= $user !== '' ? ' Signed in as ' . $h($user) . '.' : '' ?></p>

<?php if (!$files): ?>
<p>No downloads have been counted yet.</p>
<?php else: ?>
<div class="cards">
    <div class="card"><b><?= $sum('total') ?></b><span>all time</span></div>
    <div class="card"><b><?= $sum('last30') ?></b><span>last 30 days</span></div>
    <div class="card"><b><?= $sum('last7') ?></b><span>last 7 days</span></div>
    <div class="card"><b><?= $sum('today') ?></b><span>today (UTC)</span></div>
</div>

<h2>By plugin</h2>
<div class="table-wrap">
<table>
    <thead><tr><th scope="col">Plugin</th><th scope="col">Total</th><th scope="col">30 days</th><th scope="col">7 days</th><th scope="col">Today</th><th scope="col">First</th><th scope="col">Last</th></tr></thead>
    <tbody>
<?php foreach ($files as $name => $f): ?>
        <tr><th scope="row"><?= $h($name) ?></th><td><?= $f['total'] ?></td><td><?= $f['last30'] ?></td><td><?= $f['last7'] ?></td><td><?= $f['today'] ?></td><td><?= $h($f['first']) ?></td><td><?= $h($f['last']) ?></td></tr>
<?php endforeach; ?>
    </tbody>
</table>
</div>

<h2>Last 30 days</h2>
<?php
$w = 720; $ht = 180; $pad = 24; $slot = ($w - 2 * $pad) / 30; $bw = $slot * .7;
?>
<svg viewBox="0 0 <?= $w ?> <?= $ht ?>" role="img" aria-label="Downloads per day over the last 30 days, all plugins together; the table below lists the same numbers">
<?php $i = 0; foreach ($daily as $day => $n):
    $bh = $n > 0 ? max(3, ($ht - 2 * $pad) * $n / $max) : 2;
    $x = $pad + $i * $slot + ($slot - $bw) / 2; $y = $ht - $pad - $bh; ?>
    <rect class="bar<?= $n ? '' : ' zero' ?>" x="<?= round($x, 1) ?>" y="<?= round($y, 1) ?>" width="<?= round($bw, 1) ?>" height="<?= round($bh, 1) ?>"><title><?= $h($day) ?>: <?= $n ?></title></rect>
<?php $i++; endforeach; ?>
    <text class="axis" x="<?= $pad ?>" y="<?= $ht - 6 ?>"><?= $h(array_key_first($daily)) ?></text>
    <text class="axis" x="<?= $w - $pad ?>" y="<?= $ht - 6 ?>" text-anchor="end"><?= $h(array_key_last($daily)) ?></text>
    <text class="axis" x="<?= $pad ?>" y="14">max <?= $max ?> per day</text>
</svg>
<p class="note">The same numbers as a table, newest day first (only days with downloads):</p>
<div class="table-wrap">
<table>
    <thead><tr><th scope="col">Day (UTC)</th><th scope="col">Downloads</th></tr></thead>
    <tbody>
<?php foreach (array_reverse($daily, true) as $day => $n): if ($n === 0) { continue; } ?>
        <tr><th scope="row"><?= $h($day) ?></th><td><?= $n ?></td></tr>
<?php endforeach; ?>
    </tbody>
</table>
</div>
<?php endif; ?>

<p class="note" style="margin-top:2rem">Counts are written by download.php; clicks without JavaScript and bots are not counted. Nothing about the visitor is stored.</p>
</main>
</body>
</html>
