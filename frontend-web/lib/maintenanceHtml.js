/**
 * HTML Template for Maintenance Mode
 * Self-contained with responsive CSS and dark mode support.
 * Returns HTTP 503 for SEO compliance.
 */
export function getMaintenanceHtml(retryAfterSeconds = 1800) {
    const retryMinutes = Math.round(retryAfterSeconds / 60);

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sedang Dalam Pemeliharaan | JBook</title>
    <meta name="robots" content="noindex, nofollow" />
    <link rel="icon" href="/favicon.ico" />
    <style>
        :root {
            --bg: #f7f5f0;
            --card-bg: #ffffff;
            --text-main: #1c1c1f;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --accent-red: #e43b35;
            --accent-red-light: #fff1ef;
            --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #0b0b0d;
                --card-bg: #131317;
                --text-main: #f2f2f7;
                --text-muted: #94a3b8;
                --border: #212127;
                --accent-red: #ff746d;
                --accent-red-light: #2a1515;
                --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
            }
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 540px;
            width: 100%;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 40px 32px;
            box-shadow: var(--shadow);
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-red), #fbbf24, var(--accent-red));
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--accent-red-light);
            color: var(--accent-red);
            font-size: 13px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: 9999px;
            margin-bottom: 24px;
            letter-spacing: 0.5px;
        }

        .pulse-dot {
            width: 8px;
            height: 8px;
            background-color: var(--accent-red);
            border-radius: 50%;
            animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.3); }
        }

        .icon-wrap {
            margin: 0 auto 20px;
            width: 72px;
            height: 72px;
            background: var(--accent-red-light);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent-red);
        }

        h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--text-main);
        }

        .jp-sub {
            font-size: 15px;
            color: var(--accent-red);
            font-weight: 600;
            margin-bottom: 16px;
            letter-spacing: 1px;
        }

        p.desc {
            font-size: 15px;
            color: var(--text-muted);
            margin-bottom: 28px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 28px;
            text-align: left;
        }

        .info-card {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 12px 14px;
        }

        .info-label {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 600;
            color: var(--text-muted);
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .info-val {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-main);
        }

        .actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .btn-reload {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background-color: var(--accent-red);
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            padding: 12px 24px;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.1s;
        }

        .btn-reload:hover {
            opacity: 0.9;
        }

        .btn-reload:active {
            transform: scale(0.98);
        }

        .footer-note {
            margin-top: 24px;
            font-size: 12px;
            color: var(--text-muted);
        }

        @media (max-width: 480px) {
            .container {
                padding: 30px 20px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            h1 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <main class="container">
        <div class="badge">
            <span class="pulse-dot"></span>
            <span>SISTEM DALAM PEMELIHARAAN</span>
        </div>

        <div class="icon-wrap" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
        </div>

        <h1>JBook Sedang Diperbarui</h1>
        <div class="jp-sub">メンテナンス中 • しばらくお待ちください</div>

        <p class="desc">
            Kami sedang melakukan peningkatan performa dan pemeliharaan server berkala agar proses belajar bahasa Jepang Anda semakin nyaman dan lancar.
        </p>

        <div class="info-grid">
            <div class="info-card">
                <div class="info-label">Status Progres</div>
                <div class="info-val">Aman & Tersimpan</div>
            </div>
            <div class="info-card">
                <div class="info-label">Estimasi</div>
                <div class="info-val">~${retryMinutes} Menit</div>
            </div>
        </div>

        <div class="actions">
            <button class="btn-reload" onclick="window.location.reload()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                </svg>
                Coba Muat Ulang
            </button>
        </div>

        <div class="footer-note">
            HTTP 503 • JBook Platform Pembelajaran Bahasa Jepang
        </div>
    </main>
</body>
</html>`;
}
