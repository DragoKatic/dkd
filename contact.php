<?php
/*
 * Contact form handler of the Drago Katić Development site.
 * License: GPL-2.0-or-later (https://dkd.rs/LICENSE.txt)
 *
 * The form (partials/contact.html, on every page) posts Name, Email, Services[], Message,
 * the page it was sent from (page) and the honeypot "website", which people never see.
 * With JS (js/script.js, Accept: application/json) the answer is JSON shown under the form;
 * without JS the answer is a short page with a link back.
 */

declare(strict_types=1);

// Errors go to the server log, never to the visitor (the host's php.ini may have display_errors On)
ini_set('display_errors', '0');

// Where the messages go, and the sender: an address of the site's own domain, so SPF/DKIM pass
const MAIL_TO = 'contact@dkd.rs';
const MAIL_FROM = 'noreply@dkd.rs';
const SITE_NAME = 'Drago Katić Development';

const SERVICES = ['Websites', 'Research Papers', 'eCommerce', 'SEO'];
const MAX_LENGTH = ['Name' => 100, 'Email' => 254, 'Message' => 5000];
// At most this many messages from one address in RATE_WINDOW seconds
const RATE_LIMIT = 5;
const RATE_WINDOW = 600;

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Please use the contact form.');
}

// Only this site's own pages may post here
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== $host) {
    respond(403, false, 'The message could not be sent.');
}

// Bots fill in every field; people never see this one. Pretend it worked.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    respond(200, true, thanks(''));
}

$name = clean($_POST['Name'] ?? '');
$email = clean($_POST['Email'] ?? '');
$message = trim(str_replace("\r\n", "\n", (string) ($_POST['Message'] ?? '')));
$services = array_values(array_intersect(SERVICES, (array) ($_POST['Services'] ?? [])));

$errors = [];
if ($name === '' || mb_strlen($name) > MAX_LENGTH['Name']) {
    $errors[] = 'your name';
}
if (mb_strlen($email) > MAX_LENGTH['Email'] || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'a valid email address';
}
if ($message === '' || mb_strlen($message) > MAX_LENGTH['Message']) {
    $errors[] = 'a message (up to ' . MAX_LENGTH['Message'] . ' characters)';
}
if ($errors) {
    respond(422, false, 'Please enter ' . implode(', ', $errors) . '.');
}

if (!withinRateLimit($_SERVER['REMOTE_ADDR'] ?? '')) {
    respond(429, false, 'Too many messages in a short time. Please try again in a few minutes.');
}

$body = "Name: $name\nEmail: $email\nServices: " . ($services ? implode(', ', $services) : '-')
    . "\nPage: " . backPage() . "\n\n$message\n";
$headers = [
    'From' => encodeHeader(SITE_NAME) . ' <' . MAIL_FROM . '>',
    'Reply-To' => $email,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
];
$sent = mail(MAIL_TO, encodeHeader('Website enquiry from ' . $name), $body, $headers, '-f' . MAIL_FROM);

if (!$sent) {
    error_log('contact.php: mail() failed');
    respond(500, false, 'The message could not be sent. Please send an email to ' . MAIL_TO . '.');
}
respond(200, true, thanks($name));


/** One line of text: no control characters (no header injection), trimmed. */
function clean(mixed $value): string
{
    return trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', is_string($value) ? $value : '') ?? '');
}

function thanks(string $name): string
{
    return 'Thank you' . ($name !== '' ? ', ' . $name : '') . '! Your message has been sent, and an answer will follow as soon as possible.';
}

/** RFC 2047 encoded header text, so names with č, ć, š, ž, đ arrive intact. */
function encodeHeader(string $text): string
{
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

/** The page the form was sent from (a page of this site), for the link back. */
function backPage(): string
{
    $page = (string) ($_POST['page'] ?? '');
    return preg_match('/^[a-z0-9-]+\.html$/', $page) && is_file(__DIR__ . '/' . $page) ? $page : 'index.html';
}

function withinRateLimit(string $ip): bool
{
    $file = sys_get_temp_dir() . '/dkd-contact-' . hash('sha256', $ip);
    $now = time();
    $times = array_filter(
        is_file($file) ? array_map('intval', file($file, FILE_IGNORE_NEW_LINES) ?: []) : [],
        fn (int $t): bool => $t > $now - RATE_WINDOW
    );
    if (count($times) >= RATE_LIMIT) {
        return false;
    }
    $times[] = $now;
    @file_put_contents($file, implode("\n", $times), LOCK_EX);
    return true;
}

/** Answers with JSON (fetch from the page) or a short page (form posted without JS), then stops. */
function respond(int $status, bool $ok, string $message): never
{
    global $wantsJson;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
    header('Content-Type: text/html; charset=UTF-8');
    $back = ($ok ? backPage() : backPage() . '#contact-form');
    $title = $ok ? 'Message sent' : 'Message not sent';
    $e = fn (string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    echo <<<HTML
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="noindex">
        <title>{$e($title)} | Drago Katić Development</title>
        <link rel="icon" href="favicon.svg" type="image/svg+xml">
        <link rel="stylesheet" href="css/style.css">
    </head>
    <body class="contact-result">
        <main class="contact-result-card">
            <h1 class="h3">{$e($title)}</h1>
            <p>{$e($message)}</p>
            <a class="dkd-btn outline-btn btn" href="{$e($back)}">Back to the site</a>
        </main>
    </body>
    </html>
    HTML;
    exit;
}
