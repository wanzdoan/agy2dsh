window.__ModuleLoader__.load({
  id: '@goodandready/dsh-subscriptions',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')
    const h = React.createElement

    /* ------------------------------------------------------------------ *
     * Localisation: English is the default; Vietnamese is opt-in through
     * the `language` setting and reflected in the session pill immediately.
     * ------------------------------------------------------------------ */

    const MESSAGES = {
      en: {
        // shared
        provider_antigravity: 'Antigravity',
        provider_codex: 'Codex',
        family_gemini: 'Gemini',
        family_claude: 'Claude',
        window_5h: '5h',
        window_7d: '7d',
        used: 'used',
        free: 'free',
        resetsIn: 'resets in',
        resetAt: 'resets',
        noData: 'no data',
        loading: 'Loading…',
        hostOffline: 'Host offline',
        retry: 'Retry',
        close: 'Close',
        cancel: 'Cancel',
        save: 'Save',
        saving: 'Saving…',
        saved: 'Saved',
        hubTitle: 'Subscription Hub',
        hubSubtitle: 'Consumer subscriptions routed through this plugin',
        // pill
        pillOpen: 'Open Subscription Hub',
        notConnected: 'Not connected',
        quota: 'Quota',
        accounts: 'accounts',
        account: 'account',
        // accounts
        accountList: 'Accounts',
        noAccounts: 'No account connected',
        noAccountsHint: 'Import the credentials that the vendor CLI already stored on this machine.',
        importFromCli: 'Import from CLI',
        importToken: 'Paste token',
        verify: 'Verify',
        syncModels: 'Sync models',
        signOut: 'Remove',
        connected: 'Connected',
        expired: 'Session expired',
        expiringSoon: 'Expires soon',
        cooldown: 'Cooling down',
        quarantined: 'Paused',
        needsAttention: 'Needs attention',
        plan: 'Plan',
        expires: 'Expires',
        models: 'models',
        importHint: 'Reads the token the CLI saved on this host. Nothing is written back.',
        importedOk: 'Account imported',
        tokenLabel: 'Refresh token or API key',
        tokenHint: 'For Codex paste the refresh token; for Antigravity an OAuth refresh token.',
        submit: 'Submit',
        // quota
        quotaTitle: 'Usage',
        quotaEmpty: 'Quota appears after the first successful request.',
        // settings
        settingsLanguage: 'Language',
        settingsLanguageHint: 'Applies to this panel and the session header.',
        settingsAccounts: 'Accounts and devices',
        settingsRotation: 'Rotation',
        settingsAdvanced: 'Advanced',
        rotationStrategy: 'Rotation strategy',
        rotationRoundRobin: 'Round robin',
        rotationLeastUsed: 'Least used',
        rotationSticky: 'Sticky until limited',
        cooldownMinutes: 'Failure cooldown (minutes)',
        cooldownHint: 'How long a failing account rests before it is tried again.',
        switchAt: 'Switch account at (% used)',
        switchAtHint: 'Rotate to a fresher account before this account is exhausted.',
        idleTimeout: 'Stream idle timeout (seconds)',
        idleTimeoutHint: 'Abort a silent stream after this long. 0 disables the cap.',
        clientVersion: 'Antigravity client version',
        clientVersionHint: 'User-Agent version sent to Google. Empty uses the built-in default.',
        privacyMask: 'Mask emails',
        privacyMaskHint: 'Hide account identity for screenshots and demos.',
        composerQuota: 'Composer quota',
        composerQuotaHint: 'Show live usage next to the message composer.',
        composerOff: 'Hidden',
        composerPercent: 'Percent',
        composerBar: 'Bar',
        notifyLimits: 'Notify near limits',
        notifyLimitsHint: 'Raise an alert when a window passes 90%.',
        samples: 'Model list',
        samplesHint: 'Leave empty to use the models the vendor publishes.',
        saveFailed: 'Could not save',
        loadedFromCli: 'Read CLI credentials again',
        refresh: 'Refresh',
        errorPrefix: 'Error',
        noChanges: 'Nothing to save',
      },
      vi: {
        provider_antigravity: 'Antigravity',
        provider_codex: 'Codex',
        family_gemini: 'Gemini',
        family_claude: 'Claude',
        window_5h: '5 giờ',
        window_7d: '7 ngày',
        used: 'đã dùng',
        free: 'còn lại',
        resetsIn: 'làm mới sau',
        resetAt: 'làm mới lúc',
        noData: 'chưa có dữ liệu',
        loading: 'Đang tải…',
        hostOffline: 'Máy chủ không phản hồi',
        retry: 'Thử lại',
        close: 'Đóng',
        cancel: 'Huỷ',
        save: 'Lưu',
        saving: 'Đang lưu…',
        saved: 'Đã lưu',
        hubTitle: 'Trung tâm Subscription',
        hubSubtitle: 'Các gói thuê bao được plugin này điều phối',
        pillOpen: 'Mở Trung tâm Subscription',
        notConnected: 'Chưa kết nối',
        quota: 'Hạn mức',
        accounts: 'tài khoản',
        account: 'tài khoản',
        accountList: 'Tài khoản',
        noAccounts: 'Chưa kết nối tài khoản nào',
        noAccountsHint: 'Nhập thông tin đăng nhập mà CLI của nhà cung cấp đã lưu sẵn trên máy này.',
        importFromCli: 'Nhập từ CLI',
        importToken: 'Dán token',
        verify: 'Kiểm tra',
        syncModels: 'Đồng bộ model',
        signOut: 'Xoá',
        connected: 'Đã kết nối',
        expired: 'Phiên đã hết hạn',
        expiringSoon: 'Sắp hết hạn',
        cooldown: 'Đang tạm nghỉ',
        quarantined: 'Đang tạm dừng',
        needsAttention: 'Cần xử lý',
        plan: 'Gói',
        expires: 'Hết hạn',
        models: 'model',
        importHint: 'Đọc token CLI đã lưu trên máy này. Không ghi ngược lại.',
        importedOk: 'Đã nhập tài khoản',
        tokenLabel: 'Refresh token hoặc API key',
        tokenHint: 'Codex: dán refresh token. Antigravity: dán OAuth refresh token.',
        submit: 'Gửi',
        quotaTitle: 'Mức sử dụng',
        quotaEmpty: 'Hạn mức sẽ hiện sau lần gọi thành công đầu tiên.',
        settingsLanguage: 'Ngôn ngữ',
        settingsLanguageHint: 'Áp dụng cho bảng cài đặt và thanh trên đầu khung chat.',
        settingsAccounts: 'Tài khoản và thiết bị',
        settingsRotation: 'Luân chuyển',
        settingsAdvanced: 'Nâng cao',
        rotationStrategy: 'Cách luân chuyển',
        rotationRoundRobin: 'Xoay vòng',
        rotationLeastUsed: 'Ít dùng nhất',
        rotationSticky: 'Giữ nguyên đến khi hết hạn mức',
        cooldownMinutes: 'Thời gian tạm nghỉ khi lỗi (phút)',
        cooldownHint: 'Khoảng nghỉ của một tài khoản lỗi trước khi thử lại.',
        switchAt: 'Chuyển tài khoản khi đã dùng (%)',
        switchAtHint: 'Đổi sang tài khoản khác trước khi tài khoản này cạn hạn mức.',
        idleTimeout: 'Thời gian chờ stream (giây)',
        idleTimeoutHint: 'Huỷ stream im lặng sau khoảng này. 0 là không giới hạn.',
        clientVersion: 'Phiên bản client Antigravity',
        clientVersionHint: 'Phiên bản gửi trong User-Agent cho Google. Để trống dùng mặc định.',
        privacyMask: 'Che email',
        privacyMaskHint: 'Ẩn danh tính tài khoản khi chụp màn hình.',
        composerQuota: 'Hạn mức ở ô soạn tin',
        composerQuotaHint: 'Hiện mức sử dụng ngay cạnh ô nhập tin nhắn.',
        composerOff: 'Ẩn',
        composerPercent: 'Phần trăm',
        composerBar: 'Thanh',
        notifyLimits: 'Báo khi gần cạn',
        notifyLimitsHint: 'Cảnh báo khi một mốc vượt 90%.',
        samples: 'Danh sách model',
        samplesHint: 'Để trống sẽ dùng danh sách nhà cung cấp công bố.',
        saveFailed: 'Không lưu được',
        loadedFromCli: 'Đọc lại thông tin từ CLI',
        refresh: 'Làm mới',
        errorPrefix: 'Lỗi',
        noChanges: 'Không có thay đổi',
      },
    }

    let currentT = (key) => key

    /** Translate `key` for `lang`, interpolating `{name}` placeholders. */
    function tx(lang, key, vars) {
      const dict = MESSAGES[lang] || MESSAGES.en
      const raw = dict[key] != null ? dict[key] : (MESSAGES.en[key] != null ? MESSAGES.en[key] : key)
      if (!vars) return raw
      return String(raw).replace(/\{(\w+)\}/g, (all, name) => (vars[name] != null ? String(vars[name]) : all))
    }

    const setT = (fn) => { currentT = fn }

    /* ------------------------------------------------------------------ *
     * Styles. One string, injected once, theme-variable driven so it
     * follows both light and dark DSH themes.
     * ------------------------------------------------------------------ */

    const CSS = [
      '.shub{--shub-gap:10px;font-size:12.5px;line-height:1.45;color:var(--dsw-alias-label-primary)}',
      '.shub *{box-sizing:border-box}',
      '.shub-tabular{font-variant-numeric:tabular-nums}',
      // pill
      '.shub-pill{appearance:none;display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 10px 0 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;transition:border-color .15s,background .15s,box-shadow .15s;max-width:100%}',
      '.shub-pill:hover{border-color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-3)}',
      '.shub-pill:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.shub-dot{width:7px;height:7px;border-radius:50%;flex:none;background:var(--dsw-alias-label-tertiary)}',
      '.shub-dot-ok{background:var(--dsw-alias-state-success-primary)}',
      '.shub-dot-warn{background:var(--dsw-alias-state-warn-primary)}',
      '.shub-dot-bad{background:var(--dsw-alias-state-error-primary)}',
      '.shub-pill-name{font-weight:600;letter-spacing:.01em}',
      '.shub-pill-sep{width:1px;height:14px;background:var(--dsw-alias-border-l2);flex:none}',
      '.shub-pill-quota{display:inline-flex;align-items:center;gap:5px;color:var(--dsw-alias-label-secondary)}',
      '.shub-pill-quota b{font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.shub-pill-meta{color:var(--dsw-alias-label-tertiary);font-size:11.5px}',
      // surfaces
      '.shub-panel{display:flex;flex-direction:column;gap:14px}',
      '.shub-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}',
      '.shub-title{font-size:15px;font-weight:650;letter-spacing:-.01em}',
      '.shub-sub{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:2px}',
      '.shub-card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);padding:12px 14px}',
      '.shub-card+.shub-card{margin-top:8px}',
      '.shub-card-head{display:flex;align-items:center;gap:10px;justify-content:space-between}',
      '.shub-ident{display:flex;align-items:center;gap:9px;min-width:0}',
      '.shub-avatar{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-size:11px;font-weight:700;flex:none;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1)}',
      '.shub-ident-text{min-width:0}',
      '.shub-ident-name{font-weight:600;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.shub-ident-sub{font-size:11.5px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.shub-tag{font-size:10.5px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:1px 5px}',
      // bars
      '.shub-bars{display:flex;flex-direction:column;gap:8px;margin-top:10px}',
      '.shub-bar-row{display:grid;grid-template-columns:74px 1fr auto;align-items:center;gap:9px}',
      '.shub-bar-label{font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
      '.shub-bar-track{height:5px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}',
      '.shub-bar-fill{height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary);transition:width .25s ease}',
      '.shub-bar-fill.warn{background:var(--dsw-alias-state-warn-primary)}',
      '.shub-bar-fill.full{background:var(--dsw-alias-state-error-primary)}',
      '.shub-bar-value{font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.shub-bar-value b{color:var(--dsw-alias-label-primary);font-weight:600}',
      // buttons
      '.shub-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
      '.shub-btn{appearance:none;font:inherit;font-size:11.5px;font-weight:500;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px 10px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);transition:background .14s,border-color .14s}',
      '.shub-btn:hover{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-label-tertiary)}',
      '.shub-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.shub-btn[disabled]{opacity:.5;cursor:default}',
      '.shub-btn-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}',
      '.shub-btn-primary:hover{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);filter:brightness(1.06)}',
      '.shub-btn-danger{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent)}',
      '.shub-btn-danger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent)}',
      // segmented + tabs
      '.shub-seg{display:inline-flex;padding:2px;gap:2px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}',
      '.shub-seg button{appearance:none;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer;border:0;border-radius:7px;padding:4px 11px;background:transparent;color:var(--dsw-alias-label-secondary);transition:background .14s,color .14s}',
      '.shub-seg button[aria-pressed="true"]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px color-mix(in srgb,black 18%,transparent)}',
      '.shub-tabs{display:flex;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l2);padding-bottom:0}',
      '.shub-tab{appearance:none;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;background:transparent;border:0;border-bottom:2px solid transparent;padding:7px 10px;color:var(--dsw-alias-label-secondary);transition:color .14s,border-color .14s}',
      '.shub-tab[aria-selected="true"]{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary)}',
      '.shub-tab:hover{color:var(--dsw-alias-label-primary)}',
      // fields
      '.shub-field{display:flex;flex-direction:column;gap:4px;margin-top:12px}',
      '.shub-field-label{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.shub-field-hint{font-size:11.5px;color:var(--dsw-alias-label-tertiary)}',
      '.shub-input,.shub-select{height:30px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;padding:0 8px}',
      '.shub-input:focus,.shub-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.shub-inline{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}',
      '.shub-check{display:flex;align-items:center;gap:8px;font-size:12px;margin-top:10px;cursor:pointer}',
      '.shub-advanced{margin-top:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-2)}',
      '.shub-advanced>summary{cursor:pointer;list-style:none;padding:9px 12px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);user-select:none}',
      '.shub-advanced>summary::-webkit-details-marker{display:none}',
      '.shub-advanced>summary:hover{color:var(--dsw-alias-label-primary)}',
      '.shub-advanced-body{padding:0 12px 12px;display:flex;flex-direction:column;gap:2px}',
      // messages
      '.shub-note{font-size:11.5px;color:var(--dsw-alias-label-tertiary)}',
      '.shub-ok{font-size:11.5px;color:var(--dsw-alias-state-success-primary)}',
      '.shub-err{font-size:11.5px;color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}',
      '.shub-empty{text-align:center;padding:18px 10px;color:var(--dsw-alias-label-secondary)}',
      '.shub-empty-title{font-weight:600;color:var(--dsw-alias-label-primary);margin-bottom:4px}',
      // modal
      '.shub-backdrop{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;background:color-mix(in srgb,black 58%,transparent);backdrop-filter:blur(8px)}',
      '.shub-modal{width:min(560px,94vw);max-height:min(86vh,760px);overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);box-shadow:0 24px 64px color-mix(in srgb,black 55%,transparent);padding:18px}',
      '.shub-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}',
      '.shub-icon-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);width:28px;height:28px;border-radius:8px;cursor:pointer;display:grid;place-items:center}',
      '.shub-icon-btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-tertiary)}',
      // toasts
      '.shub-toasts{position:fixed;top:16px;right:16px;z-index:10030;display:flex;flex-direction:column;gap:8px;pointer-events:none}',
      '.shub-toast{pointer-events:auto;min-width:240px;max-width:380px;padding:9px 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 8px 24px color-mix(in srgb,black 38%,transparent);font-size:12px;display:flex;gap:10px;align-items:center;justify-content:space-between}',
      '.shub-toast.err{border-color:var(--dsw-alias-state-error-primary)}',
      '.shub-toast.ok{border-color:var(--dsw-alias-state-success-primary)}',
      '.shub-toast button{background:none;border:0;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit}',
      '@media (max-width:520px){.shub-bar-row{grid-template-columns:64px 1fr auto}.shub-pill-meta{display:none}}',
    ].join('')

    const cssId = 'dsh-subscriptions/settings.module.css'
    if (typeof document !== 'undefined' && !document.querySelector('style[data-plugin-css="' + cssId + '"]')) {
      const tag = document.createElement('style')
      tag.textContent = CSS
      tag.setAttribute('data-plugin', 'dsh-subscriptions')
      tag.dataset.pluginCss = cssId
      tag.setAttribute('data-dsh-plugin', 'dsh-subscriptions')
      document.head.appendChild(tag)
    }

    const NS = 'dsh-subscriptions'
    const PKG = '@goodandready/dsh-subscriptions'
    const ROW_ID = 'dsh-subscriptions'
    const ROW_CONFIG_KEY = PKG + '#' + ROW_ID
    const PROVIDERS = ['antigravity', 'codex']

    /* ----------------------------- helpers ----------------------------- */

    function safeExternalUrl(raw) {
      if (typeof raw !== 'string' || !raw.trim()) return null
      try {
        const url = new URL(raw)
        return (url.protocol === 'https:' || url.protocol === 'http:') ? url.toString() : null
      } catch { return null }
    }

    function clampPercent(value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return null
      return Math.min(100, Math.max(0, n))
    }

    function toneClass(pct) {
      const n = clampPercent(pct)
      if (n == null) return ''
      if (n >= 95) return 'full'
      if (n >= 75) return 'warn'
      return ''
    }

    function dotClass(pct, configured) {
      const n = clampPercent(pct)
      if (!configured) return 'shub-dot'
      if (n == null) return 'shub-dot shub-dot-ok'
      if (n >= 95) return 'shub-dot shub-dot-bad'
      if (n >= 75) return 'shub-dot shub-dot-warn'
      return 'shub-dot shub-dot-ok'
    }

    function pad2(n) { return (n < 10 ? '0' : '') + n }

    /** Compact countdown: 4h 12m / 12m 05s / 45s. */
    function countdown(ms, lang) {
      const total = Math.max(0, Math.round(Number(ms) / 1000))
      const d = Math.floor(total / 86400)
      const h = Math.floor((total % 86400) / 3600)
      const m = Math.floor((total % 3600) / 60)
      const s = total % 60
      if (d > 0) return lang === 'vi' ? `${d} ngày ${h} giờ` : `${d}d ${h}h`
      if (h > 0) return `${h}h ${pad2(m)}m`
      if (m > 0) return `${m}m ${pad2(s)}s`
      return `${s}s`
    }

    function formatDate(ms, lang) {
      const n = Number(ms)
      if (!Number.isFinite(n) || n <= 0) return ''
      try {
        return new Date(n).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
      } catch { return new Date(n).toISOString().slice(0, 10) }
    }

    function providerLabel(provider, lang) {
      return tx(lang, 'provider_' + String(provider || '').toLowerCase())
    }

    function providerInitial(provider) {
      const name = String(provider || '?')
      return name.slice(0, 1).toUpperCase()
    }

    function windowLabel(id, fallback, lang) {
      const key = 'family_' + String(id || '')
      const translated = tx(lang, key)
      if (translated !== key) return translated
      const wkey = 'window_' + String(id || '')
      const win = tx(lang, wkey)
      if (win !== wkey) return win
      return fallback || id || ''
    }

    function maskEmail(value) {
      const text = String(value || '')
      const at = text.indexOf('@')
      if (at <= 0) return text
      const name = text.slice(0, at)
      const domain = text.slice(at + 1)
      const head = name.slice(0, 1)
      const tail = name.length > 2 ? name.slice(-1) : ''
      return head + '***' + tail + '@' + domain
    }

    function cleanError(err) {
      const raw = err && err.message ? String(err.message) : String(err || '')
      return raw.replace(/\s+/g, ' ').trim().slice(0, 300)
    }

    async function postJson(path, body) {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.ok === false) {
        const detail = data && data.error
        const message = typeof detail === 'string' ? detail : (detail && (detail.message || detail.code)) || `HTTP ${res.status}`
        throw new Error(String(message))
      }
      return data
    }

    /* --------------------------- data loading -------------------------- */

    const emptyData = {
      loading: true,
      error: '',
      language: 'en',
      revision: 0,
      config: {},
      accounts: [],
      providers: PROVIDERS.map((id) => ({ id, name: id })),
      status: {},
      modelsCatalog: [],
    }

    function useHubData(pollMs) {
      const [data, setData] = React.useState(emptyData)
      const load = React.useCallback(async () => {
        try {
          const [cfgRes, statusRes] = await Promise.all([
            fetch('/dsh-subscriptions/config', { cache: 'no-store' }),
            fetch('/dsh-subscriptions/status', { cache: 'no-store' }),
          ])
          const cfg = await cfgRes.json().catch(() => ({}))
          const status = await statusRes.json().catch(() => ({}))
          const config = (cfg && cfg.config) || {}
          const language = (status && status.language) || config.language || 'en'
          setData({
            loading: false,
            error: '',
            language: language === 'vi' ? 'vi' : 'en',
            revision: (cfg && cfg.revision) || 0,
            config,
            accounts: (cfg && cfg.accounts) || [],
            providers: (cfg && Array.isArray(cfg.providers) && cfg.providers.length) ? cfg.providers : emptyData.providers,
            status: status || {},
            modelsCatalog: (cfg && cfg.modelsCatalog) || [],
          })
        } catch (err) {
          setData((prev) => ({ ...prev, loading: false, error: cleanError(err) }))
        }
      }, [])
      React.useEffect(() => {
        let alive = true
        const tick = () => { if (alive) load() }
        tick()
        if (!pollMs) return () => { alive = false }
        const id = setInterval(tick, pollMs)
        return () => { alive = false; clearInterval(id) }
      }, [load, pollMs])
      return [data, load]
    }

    /* ---------------------------- primitives --------------------------- */

    function Bar(props) {
      const pct = clampPercent(props.value)
      const width = pct == null ? 0 : pct
      return h('div', { className: 'shub-bar-track' },
        h('div', { className: 'shub-bar-fill ' + toneClass(pct), style: { width: width + '%' } }),
      )
    }

    function QuotaRows(props) {
      const { windows, usagePercent, lang, now } = props
      const list = (Array.isArray(windows) ? windows : []).filter((w) => w && Number.isFinite(Number(w.usedPercent)))
      if (!list.length) {
        if (usagePercent == null) return null
        return h('div', { className: 'shub-bars' },
          h('div', { className: 'shub-bar-row' },
            h('span', { className: 'shub-bar-label' }, tx(lang, 'quota')),
            h(Bar, { value: usagePercent }),
            h('span', { className: 'shub-bar-value shub-tabular' }, h('b', null, Math.round(usagePercent) + '%')),
          ),
        )
      }
      return h('div', { className: 'shub-bars' }, list.map((w, i) => {
        const pct = clampPercent(w.usedPercent)
        const reset = Number(w.resetAt) > now ? countdown(Number(w.resetAt) - now, lang) : ''
        return h('div', { className: 'shub-bar-row', key: String(w.id || i) },
          h('span', { className: 'shub-bar-label' }, windowLabel(w.id, w.label, lang)),
          h(Bar, { value: pct }),
          h('span', { className: 'shub-bar-value shub-tabular' },
            h('b', null, pct == null ? '—' : Math.round(pct) + '%'),
            reset ? h('span', { className: 'shub-pill-meta' }, ' · ' + reset) : null,
          ),
        )
      }))
    }

    function Icon(props) {
      const size = props.size || 14
      const common = { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }
      if (props.name === 'close') return h('svg', common, h('path', { d: 'M4 4l8 8M12 4l-8 8' }))
      if (props.name === 'hub') return h('svg', common, h('path', { d: 'M2.5 6.5h11M2.5 10h11M6 3v10' }))
      return null
    }

    function accountIdentity(account, lang) {
      const masked = account._masked
      const email = masked ? maskEmail(account.email || account.label) : (account.email || account.label || '')
      const plan = account.paidTierName || account.plan || ''
      const name = email || tx(lang, 'account') + ' ' + (account.index || '')
      return { name, plan }
    }

    function accountState(account, now, lang) {
      const cooldownUntil = Number(account.cooldownUntil) || 0
      const quarantineUntil = Number(account.quarantineUntil) || 0
      const expiresAt = Number(account.expiresAt) || 0
      if (quarantineUntil > now) return { key: 'quarantined', label: tx(lang, 'quarantined') }
      if (cooldownUntil > now) return { key: 'cooldown', label: tx(lang, 'cooldown') }
      if (account.validationUrl) return { key: 'needsAttention', label: tx(lang, 'needsAttention') }
      if (expiresAt && expiresAt <= now) return { key: 'expired', label: tx(lang, 'expired') }
      if (expiresAt && expiresAt - now <= 3 * 86400000) return { key: 'expiringSoon', label: tx(lang, 'expiringSoon') }
      if (!account.configured) return { key: 'notConnected', label: tx(lang, 'notConnected') }
      return { key: 'connected', label: tx(lang, 'connected') }
    }

    /* ----------------------------- account card ------------------------ */

    function AccountCard(props) {
      const { account, lang, now, busy, onAction } = props
      const ident = accountIdentity(account, lang)
      const state = accountState(account, now, lang)
      const pct = account.usagePercent
      return h('div', { className: 'shub-card' },
        h('div', { className: 'shub-card-head' },
          h('div', { className: 'shub-ident' },
            h('div', { className: 'shub-avatar' }, providerInitial(account.provider)),
            h('div', { className: 'shub-ident-text' },
              h('div', { className: 'shub-ident-name' }, ident.name || tx(lang, 'account')),
              h('div', { className: 'shub-ident-sub' },
                [state.label, ident.plan].filter(Boolean).join(' · '),
                account.email && account._masked === false && ident.plan ? '' : '',
              ),
            ),
          ),
          h('span', {
            className: dotClass(pct, account.configured),
            'aria-label': state.label,
            role: 'img',
          }),
        ),
        h(QuotaRows, { windows: account.usage, usagePercent: pct, lang, now }),
        account.error ? h('div', { className: 'shub-err', style: { marginTop: 8 } }, account.error) : null,
        h('div', { className: 'shub-actions' },
          h('button', {
            className: 'shub-btn',
            disabled: busy,
            onClick: () => onAction('check', account),
            title: tx(lang, 'verify'),
          }, tx(lang, 'verify')),
          h('button', {
            className: 'shub-btn',
            disabled: busy,
            onClick: () => onAction('sync', account),
            title: tx(lang, 'syncModels'),
          }, tx(lang, 'syncModels')),
          h('button', {
            className: 'shub-btn shub-btn-danger',
            disabled: busy,
            onClick: () => onAction('logout', account),
          }, tx(lang, 'signOut')),
        ),
      )
    }

    /* ------------------------------- panel ----------------------------- */

    function HubPanel(props) {
      const { lang, data, reload, variant } = props
      const [tab, setTab] = React.useState((data.accounts[0] && data.accounts[0].provider) || PROVIDERS[0])
      const [busy, setBusy] = React.useState(false)
      const [notice, setNotice] = React.useState({ kind: '', message: '' })
      const now = Date.now()

      const accounts = (data.accounts || []).filter((a) => a.provider === tab)
      const configured = accounts.filter((a) => a.configured)

      const act = React.useCallback(async (kind, account) => {
        if (busy) return
        setBusy(true)
        setNotice({ kind: '', message: '' })
        try {
          const index = Number(account && account.index) || 1
          if (kind === 'check') await postJson('/dsh-subscriptions/check', { provider: tab, index })
          else if (kind === 'sync') await postJson('/dsh-subscriptions/accounts/sync-models', { provider: tab, index })
          else if (kind === 'logout') await postJson('/dsh-subscriptions/logout', { provider: tab, index })
          else if (kind === 'import') await postJson('/dsh-subscriptions/import-local', { provider: tab, index })
          else if (kind === 'token') await postJson('/dsh-subscriptions/import-token', { provider: tab, index, refreshToken: String((account && account.token) || '').trim() })
          if (kind === 'import') setNotice({ kind: 'ok', message: tx(lang, 'importedOk') })
          await reload()
        } catch (err) {
          setNotice({ kind: 'err', message: tx(lang, 'errorPrefix') + ': ' + cleanError(err) })
        } finally {
          setBusy(false)
        }
      }, [busy, lang, reload, tab])

      const tokenInputRef = React.useRef(null)

      return h('div', { className: 'shub shub-panel' },
        variant === 'modal'
          ? null
          : h('div', { className: 'shub-head' },
            h('div', null,
              h('div', { className: 'shub-title' }, tx(lang, 'hubTitle')),
              h('div', { className: 'shub-sub' }, tx(lang, 'hubSubtitle')),
            ),
          ),
        h('div', { className: 'shub-tabs', role: 'tablist' }, PROVIDERS.map((id) => {
          const rows = (data.accounts || []).filter((a) => a.provider === id && a.configured)
          return h('button', {
            key: id,
            className: 'shub-tab',
            role: 'tab',
            'aria-selected': tab === id ? 'true' : 'false',
            onClick: () => setTab(id),
          }, providerLabel(id, lang) + (rows.length ? ' · ' + rows.length : ''))
        })),
        accounts.length
          ? h('div', null, accounts.map((account, i) => h(AccountCard, {
            key: (account.ref || i) + '',
            account: {
              ...account,
              _masked: Boolean(data.config && data.config.privacyMask),
              error: account.refreshError || '',
            },
            lang,
            now,
            busy,
            onAction: (kind, acc) => { act(kind, acc) },
          })))
          : h('div', { className: 'shub-empty' },
            h('div', { className: 'shub-empty-title' }, tx(lang, 'noAccounts')),
            h('div', null, tx(lang, 'noAccountsHint')),
          ),
        h('div', { className: 'shub-actions' },
          h('button', {
            className: 'shub-btn shub-btn-primary',
            disabled: busy,
            onClick: () => act('import', accounts[0] || { index: 1 }),
            title: tx(lang, 'importHint'),
          }, tx(lang, 'importFromCli')),
          h('button', {
            className: 'shub-btn',
            disabled: busy,
            onClick: () => {
              const el = tokenInputRef.current
              if (!el) return
              const value = String(el.value || '').trim()
              if (!value) { if (typeof el.focus === 'function') el.focus(); return }
              act('token', { index: (accounts[0] && accounts[0].index) || 1, token: value })
              el.value = ''
            },
          }, tx(lang, 'importToken')),
          h('button', { className: 'shub-btn', disabled: busy, onClick: () => { reload() } }, tx(lang, 'refresh')),
        ),
        h('input', {
          className: 'shub-input',
          ref: tokenInputRef,
          type: 'password',
          placeholder: tx(lang, 'tokenLabel'),
          'aria-label': tx(lang, 'tokenLabel'),
          style: { marginTop: 0, width: '100%' },
        }),
        h('div', { className: 'shub-note' }, tx(lang, 'tokenHint')),
        notice.message ? h('div', { className: notice.kind === 'ok' ? 'shub-ok' : 'shub-err' }, notice.message) : null,
        configured.length === 0 ? h('div', { className: 'shub-note' }, tx(lang, 'quotaEmpty')) : null,
        data.error ? h('div', { className: 'shub-err' }, tx(lang, 'hostOffline') + ': ' + data.error) : null,
      )
    }

    /* ------------------------------- modal ----------------------------- */

    function HubModal(props) {
      const { lang, data, reload, onClose } = props
      React.useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
      }, [onClose])
      return h('div', {
        className: 'shub-backdrop',
        role: 'presentation',
        onMouseDown: (e) => { if (e.target === e.currentTarget) onClose() },
      },
      h('div', { className: 'shub-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': tx(lang, 'hubTitle') },
        h('div', { className: 'shub-modal-head' },
          h('div', null,
            h('div', { className: 'shub-title' }, tx(lang, 'hubTitle')),
            h('div', { className: 'shub-sub' }, tx(lang, 'hubSubtitle')),
          ),
          h('button', { className: 'shub-icon-btn', onClick: onClose, 'aria-label': tx(lang, 'close') }, h(Icon, { name: 'close' })),
        ),
        h(HubPanel, { lang, data, reload, variant: 'modal' }),
      ))
    }

    /* -------------------------------- pill ----------------------------- */

    function activeAccount(data) {
      const status = data.status || {}
      const active = status.active
      if (active && active.provider) {
        const list = (data.accounts || []).filter((a) => a.provider === active.provider && a.configured)
        const byIndex = active.index ? list.find((a) => Number(a.index) === Number(active.index)) : null
        const account = byIndex || list[0]
        if (account) return { account, provider: active.provider, windows: Array.isArray(active.windows) && active.windows.length ? active.windows : account.usage, usagePercent: active.usagePercent != null ? active.usagePercent : account.usagePercent }
        return { account: null, provider: active.provider, windows: active.windows, usagePercent: active.usagePercent }
      }
      for (const provider of PROVIDERS) {
        const list = (data.accounts || []).filter((a) => a.provider === provider && a.configured)
        if (list.length) return { account: list[0], provider, windows: list[0].usage, usagePercent: list[0].usagePercent }
      }
      return { account: null, provider: '', windows: [], usagePercent: null }
    }

    function HubPill(props) {
      const { lang, data, onOpen } = props
      const [open, setOpen] = React.useState(false)
      const now = Date.now()
      const current = activeAccount(data)
      const configuredCount = (data.accounts || []).filter((a) => a.configured).length
      const windows = (Array.isArray(current.windows) ? current.windows : []).slice(0, 2)
      const nearestReset = windows
        .map((w) => Number(w && w.resetAt) || 0)
        .filter((n) => n > now)
        .sort((a, b) => a - b)[0]
      const openHub = () => { setOpen(true); if (typeof onOpen === 'function') onOpen() }

      return h(React.Fragment, null,
        h('button', {
          className: 'shub shub-pill',
          onClick: openHub,
          title: tx(lang, 'pillOpen'),
          'aria-label': tx(lang, 'pillOpen'),
        },
        h('span', { className: dotClass(current.usagePercent, configuredCount > 0), 'aria-hidden': 'true' }),
        current.provider
          ? h('span', { className: 'shub-pill-name' }, providerLabel(current.provider, lang))
          : h('span', { className: 'shub-pill-name' }, tx(lang, 'notConnected')),
        windows.length
          ? h('span', { className: 'shub-pill-sep', 'aria-hidden': 'true' })
          : null,
        windows.map((w, i) => {
          const pct = clampPercent(w.usedPercent)
          return h(React.Fragment, { key: String(w.id || i) },
            i > 0 ? h('span', { className: 'shub-pill-meta', 'aria-hidden': 'true' }, '·') : null,
            h('span', { className: 'shub-pill-quota' },
              h('span', null, windowLabel(w.id, w.label, lang)),
              h('b', { className: 'shub-tabular' }, pct == null ? '—' : Math.round(pct) + '%'),
            ),
          )
        }),
        nearestReset
          ? h('span', { className: 'shub-pill-meta shub-tabular' }, tx(lang, 'resetsIn') + ' ' + countdown(nearestReset - now, lang))
          : null,
        configuredCount > 1 ? h('span', { className: 'shub-pill-meta' }, '+ ' + (configuredCount - 1) + ' ' + tx(lang, 'accounts')) : null,
        ),
        open
          ? h(HubModal, {
            lang,
            data,
            reload: () => { if (typeof props.reload === 'function') props.reload() },
            onClose: () => setOpen(false),
          })
          : null,
      )
    }

    /* --------------------------- settings panel ------------------------ */

    function Field(props) {
      return h('label', { className: 'shub-field' },
        h('span', { className: 'shub-field-label' }, props.label),
        props.children,
        props.hint ? h('span', { className: 'shub-field-hint' }, props.hint) : null,
      )
    }

    function Segmented(props) {
      const { options, value, onChange, lang } = props
      return h('div', { className: 'shub-seg', role: 'group' }, options.map((opt) => h('button', {
        key: opt.value,
        type: 'button',
        'aria-pressed': String(value) === String(opt.value) ? 'true' : 'false',
        onClick: () => onChange(opt.value),
      }, opt.key ? tx(lang, opt.key) : opt.label)))
    }

    function SettingsCard(props) {
      const { lang, data, reload } = props
      const [draft, setDraft] = React.useState(null)
      const [status, setStatus] = React.useState({ saving: false, message: '', kind: '' })
      const config = data.config || {}

      React.useEffect(() => { setDraft(null) }, [lang])

      const value = (key, fallback) => {
        if (draft && draft[key] != null) return draft[key]
        if (config[key] != null) return config[key]
        return fallback
      }
      const edit = (key, next) => {
        setDraft((prev) => ({ ...(prev || {}), [key]: next }))
        setStatus({ saving: false, message: '', kind: '' })
      }

      const save = async () => {
        if (!draft) { setStatus({ saving: false, message: tx(lang, 'noChanges'), kind: '' }); return }
        setStatus({ saving: true, message: tx(lang, 'saving'), kind: '' })
        try {
          const res = await fetch('/dsh-subscriptions/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ revision: data.revision, config: { ...config, ...draft } }),
          })
          const body = await res.json().catch(() => ({}))
          if (!res.ok || body.ok === false) {
            const detail = body && body.error
            throw new Error(typeof detail === 'string' ? detail : (detail && detail.message) || 'HTTP ' + res.status)
          }
          setDraft(null)
          setStatus({ saving: false, message: tx(lang, 'saved'), kind: 'ok' })
          await reload()
        } catch (err) {
          setStatus({ saving: false, message: tx(lang, 'saveFailed') + ': ' + cleanError(err), kind: 'err' })
        }
      }

      const seconds = Math.round((Number(value('streamIdleTimeoutMs', 180000)) || 0) / 1000)

      return h('div', { className: 'shub shub-panel' },
        h(HubPanel, { lang, data, reload, variant: 'settings' }),
        h('div', { className: 'shub-inline', style: { justifyContent: 'space-between' } },
          h('span', { className: 'shub-field-label' }, tx(lang, 'settingsLanguage')),
          h(Segmented, {
            lang,
            value: value('language', 'en'),
            options: [{ value: 'en', label: 'English' }, { value: 'vi', label: 'Tiếng Việt' }],
            onChange: (next) => edit('language', next),
          }),
        ),
        h('div', { className: 'shub-field-hint' }, tx(lang, 'settingsLanguageHint')),
        h('details', { className: 'shub-advanced' },
          h('summary', null, tx(lang, 'settingsRotation')),
          h('div', { className: 'shub-advanced-body' },
            h(Field, { label: tx(lang, 'rotationStrategy') },
              h('select', {
                className: 'shub-select',
                value: value('rotationStrategy', 'round-robin'),
                onChange: (e) => edit('rotationStrategy', e.target.value),
              },
              h('option', { value: 'round-robin' }, tx(lang, 'rotationRoundRobin')),
              h('option', { value: 'least-used' }, tx(lang, 'rotationLeastUsed')),
              h('option', { value: 'sticky' }, tx(lang, 'rotationSticky')),
              )),
            h(Field, { label: tx(lang, 'switchAt'), hint: tx(lang, 'switchAtHint') },
              h('input', {
                className: 'shub-input',
                type: 'number',
                min: 0,
                max: 100,
                value: value('switchAtRemaining', 0),
                onChange: (e) => edit('switchAtRemaining', Number(e.target.value)),
              })),
            h(Field, { label: tx(lang, 'cooldownMinutes'), hint: tx(lang, 'cooldownHint') },
              h('input', {
                className: 'shub-input',
                type: 'number',
                min: 0,
                value: Math.round((Number(value('cooldownMs', 1800000)) || 0) / 60000),
                onChange: (e) => edit('cooldownMs', Number(e.target.value) * 60000),
              })),
          ),
        ),
        h('details', { className: 'shub-advanced' },
          h('summary', null, tx(lang, 'settingsAdvanced')),
          h('div', { className: 'shub-advanced-body' },
            h(Field, { label: tx(lang, 'idleTimeout'), hint: tx(lang, 'idleTimeoutHint') },
              h('input', {
                className: 'shub-input',
                type: 'number',
                min: 0,
                value: seconds,
                onChange: (e) => edit('streamIdleTimeoutMs', Math.max(0, Number(e.target.value)) * 1000),
              })),
            h(Field, { label: tx(lang, 'clientVersion'), hint: tx(lang, 'clientVersionHint') },
              h('input', {
                className: 'shub-input',
                type: 'text',
                placeholder: '1.18.3',
                value: value('antigravityClientVersion', ''),
                onChange: (e) => edit('antigravityClientVersion', e.target.value),
              })),
            h(Field, { label: tx(lang, 'composerQuota'), hint: tx(lang, 'composerQuotaHint') },
              h('select', {
                className: 'shub-select',
                value: value('composerQuota', 'off'),
                onChange: (e) => edit('composerQuota', e.target.value),
              },
              h('option', { value: 'off' }, tx(lang, 'composerOff')),
              h('option', { value: 'percent' }, tx(lang, 'composerPercent')),
              h('option', { value: 'bar' }, tx(lang, 'composerBar')),
              )),
            h('label', { className: 'shub-check' },
              h('input', {
                type: 'checkbox',
                checked: Boolean(value('privacyMask', false)),
                onChange: (e) => edit('privacyMask', e.target.checked),
              }),
              h('span', null, tx(lang, 'privacyMask')),
            ),
            h('div', { className: 'shub-field-hint' }, tx(lang, 'privacyMaskHint')),
            h('label', { className: 'shub-check' },
              h('input', {
                type: 'checkbox',
                checked: Boolean(value('notifyLimits', true)),
                onChange: (e) => edit('notifyLimits', e.target.checked),
              }),
              h('span', null, tx(lang, 'notifyLimits')),
            ),
            h('div', { className: 'shub-field-hint' }, tx(lang, 'notifyLimitsHint')),
          ),
        ),
        h('div', { className: 'shub-actions', style: { justifyContent: 'flex-end' } },
          status.message ? h('span', { className: status.kind === 'err' ? 'shub-err' : 'shub-ok' }, status.message) : null,
          h('button', {
            className: 'shub-btn shub-btn-primary',
            disabled: status.saving || !draft,
            onClick: save,
          }, status.saving ? tx(lang, 'saving') : tx(lang, 'save')),
        ),
      )
    }

    function PluginCard(props) {
      const { lang, data, reload } = props
      const [open, setOpen] = React.useState(false)
      const configured = (data.accounts || []).filter((a) => a.configured).length
      return h('div', { className: 'shub' },
        h('button', {
          className: 'shub-pill',
          style: { width: '100%', justifyContent: 'space-between', height: 40, borderRadius: 12, padding: '0 14px' },
          onClick: () => setOpen((v) => !v),
          'aria-expanded': open ? 'true' : 'false',
        },
        h('span', { className: 'shub-ident' },
          h('span', { className: 'shub-ident-name' }, tx(lang, 'hubTitle')),
          h('span', { className: 'shub-pill-meta' }, configured + ' ' + (configured === 1 ? tx(lang, 'account') : tx(lang, 'accounts'))),
        ),
        h('span', { className: 'shub-pill-meta' }, open ? '−' : '+'),
        ),
        open ? h('div', { style: { marginTop: 12 } }, h(SettingsCard, { lang, data, reload })) : null,
      )
    }

    /* --------------------------- composer quota ------------------------ */

    function ComposerQuota(props) {
      const { lang, data } = props
      const mode = String((data.config && data.config.composerQuota) || 'off')
      const current = activeAccount(data)
      const pct = clampPercent(current.usagePercent)
      if (mode === 'off' || pct == null) return null
      const label = current.provider ? providerLabel(current.provider, lang) : tx(lang, 'quota')
      return h('div', { className: 'shub shub-pill-quota', title: label + ' ' + Math.round(pct) + '%' },
        h('span', { className: dotClass(pct, true), 'aria-hidden': 'true' }),
        h('span', null, label),
        mode === 'bar'
          ? h('span', { style: { width: 48, display: 'inline-block' } }, h(Bar, { value: pct }))
          : h('b', { className: 'shub-tabular' }, Math.round(pct) + '%'),
      )
    }

    /* ------------------------- slot registration ----------------------- */

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false, message: '' }
      }
      static getDerivedStateFromError(error) {
        return { failed: true, message: String((error && error.message) || error || 'unknown error') }
      }
      componentDidCatch(error) {
        try { console.error('[dsh-subscriptions] ui error', error) } catch { /* ignore */ }
      }
      render() {
        if (this.state.failed) {
          return h('div', { className: 'shub shub-card' },
            h('div', { className: 'shub-ident-name' }, 'Subscriptions UI error'),
            h('div', { className: 'shub-err' }, this.state.message),
            h('div', { className: 'shub-actions' },
              h('button', { className: 'shub-btn', onClick: () => this.setState({ failed: false, message: '' }) }, 'Retry'),
            ),
          )
        }
        return this.props.children
      }
    }

    /** Slot host: loads hub data once and feeds the requested surface. */
    function SlotHost(props) {
      const [data, reload] = useHubData(props.pollMs)
      const lang = data.language
      const t = React.useCallback((key, vars) => tx(lang, key, vars), [lang])
      if (props.surface === 'pill') return h(HubPill, { lang, data, reload, t })
      if (props.surface === 'composer') return h(ComposerQuota, { lang, data, t })
      return h(PluginCard, { lang, data, reload, t })
    }

    function registerSettings(ctx) {
      const addLocale = (locale, dictionary) => {
        try { return ctx.locale.register(NS, locale, dictionary) } catch { return () => {} }
      }
      ctx.effect(() => {
        const undo = [addLocale('en', MESSAGES.en), addLocale('vi', MESSAGES.vi)]
        return () => { for (const off of undo) { try { off() } catch { /* ignore */ } } }
      }, 'dsh-subscriptions: locales')
      setT(ctx.locale.bind(NS))
      ctx.effect(() => {
        const cleanups = []
        try {
          if (ctx.slots && typeof ctx.slots.inject === 'function') {
            const seats = [
              { name: 'plugins.item', id: ROW_ID, order: 60 },
              { name: 'plugins.bundle.config', key: PKG },
              { name: 'plugins.row.config', key: ROW_CONFIG_KEY },
              { name: 'plugins.row.config', key: ROW_ID + '#' + ROW_ID },
              { name: 'plugins.row.config', key: ROW_ID },
            ]
            for (const seat of seats) {
              const off = ctx.slots.inject(seat.name, () => ctx.slots.register(
                {
                  name: seat.name,
                  ...(seat.id ? { id: seat.id } : {}),
                  ...(seat.key ? { key: seat.key } : {}),
                  order: seat.order,
                  label: () => currentT('hubTitle') || 'Subscriptions',
                  locale: NS,
                  inject: () => ({ ctx }),
                },
                (slotProps) => h(ErrorBoundary, null, h(SlotHost, { ...slotProps, surface: 'card', pollMs: 25000 })),
              ))
              if (typeof off === 'function') cleanups.push(off)
            }
          }
        } catch { /* slot system unavailable (headless) */ }
        return () => { for (const off of cleanups) { try { off() } catch { /* ignore */ } } }
      }, 'dsh-subscriptions: settings slots')
    }

    function registerSubsPill(ctx) {
      ctx.effect(() => {
        ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register(
          {
            name: 'conversation.session.header.actions',
            id: 'dsh-subscriptions-subs-pill',
            order: 15,
            locale: NS,
          },
          (slotProps) => h(ErrorBoundary, null, h(SlotHost, { ...slotProps, surface: 'pill', pollMs: 25000 })),
        ))
      }, 'dsh-subscriptions: session pill')
    }

    function registerComposerQuota(ctx) {
      ctx.effect(() => {
        ctx.slots.inject('conversation.input.right', () => ctx.slots.register(
          {
            name: 'conversation.input.right',
            id: 'dsh-subscriptions-composer-quota',
            order: 5,
            locale: NS,
          },
          (slotProps) => h(ErrorBoundary, null, h(SlotHost, { ...slotProps, surface: 'composer', pollMs: 30000 })),
        ))
      }, 'dsh-subscriptions: composer quota')
    }

    function registerSlashCommands(ctx) {
      ctx.effect(() => {
        const triggers = ctx.get('inputTriggers')
        if (!triggers) return () => {}
        const providerMatch = new RegExp('^(' + PROVIDERS.join('|') + ')$')
        const run = (cmd, line) => {
          const args = line.trim().replace(/^\/\S+\s*/, '').split(/\s+/).filter(Boolean)
          const provider = args[0]
          if (cmd === 'logout') {
            if (!provider || !providerMatch.test(provider)) return
            postJson('/dsh-subscriptions/logout', { provider, index: 1 }).catch(() => {})
            return
          }
          if (!provider || !providerMatch.test(provider)) return
          fetch('/dsh-subscriptions/oauth/start?provider=' + encodeURIComponent(provider) + '&index=1', { cache: 'no-store' })
            .then((res) => res.json())
            .then((payload) => {
              const target = payload && safeExternalUrl(payload.url)
              if (!target) return
              const popup = window.open(target, '_blank', 'noopener')
              if (!popup && navigator.clipboard) navigator.clipboard.writeText(target).catch(() => {})
            })
            .catch(() => {})
        }
        const sources = [
          { name: 'login', descriptionKey: 'hubTitle' },
          { name: 'logout', descriptionKey: 'signOut' },
        ]
        const disposers = sources.map((src) => triggers.registerSource({
          trigger: '/',
          name: src.name,
          order: 40,
          description: currentT(src.descriptionKey),
          candidates: (_session, req) => {
            if (req.position !== 'leading') return Promise.resolve([])
            const query = String(req.query || '').trim().toLowerCase()
            if (query !== '' && !src.name.startsWith(query)) return Promise.resolve([])
            return Promise.resolve([{ name: src.name, description: currentT(src.descriptionKey) }])
          },
          matchEnter: (_session, rawLine) => {
            const text = String(rawLine || '').trim()
            const token = text.split(/\s+/)[0]
            if (token !== '/' + src.name) return Promise.resolve(undefined)
            if (src.name === 'login' && /\bstatus\b/.test(text)) {
              return fetch('/dsh-subscriptions/status', { cache: 'no-store' })
                .then((res) => res.json())
                .then((payload) => {
                  const loggedIn = (payload && payload.loggedIn) || {}
                  const connected = PROVIDERS.filter((id) => loggedIn[id])
                  return { text: 'Connected: ' + (connected.length ? connected.join(', ') : 'none') }
                })
                .catch(() => ({ text: 'Connected: unknown' }))
            }
            run(src.name, text)
            return Promise.resolve('handled')
          },
        }))
        return () => { for (const off of disposers) { try { off() } catch { /* ignore */ } } }
      }, 'dsh-subscriptions: slash commands')
    }

    exports.inject = ['slots', 'locale']
    exports.apply = function apply(ctx) {
      if (typeof window !== 'undefined') { window.__dshCtx = ctx }
      setT(ctx.locale.bind(NS))
      try { ctx.inject(['pluginNavigation'], (navCtx) => { ctx.pluginNavigation = navCtx.pluginNavigation }) } catch { /* optional */ }
      try { ctx.inject(['layout'], (layoutCtx) => { ctx.layout = layoutCtx.layout }) } catch { /* optional */ }
      registerSettings(ctx)
      registerSubsPill(ctx)
      registerComposerQuota(ctx)
      registerSlashCommands(ctx)
    }
    return module.exports
  },
})
