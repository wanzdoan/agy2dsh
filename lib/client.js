window.__ModuleLoader__.load({
  id: 'agy2dsh',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')
    const h = React.createElement

    // A portal keeps the hub entirely out of the session header's DOM. The module
    // is optional: without it the plain <dialog> still sits in the top layer.
    let ReactDOM = null
    try { ReactDOM = require('react-dom') } catch { ReactDOM = null }
    const createPortal = ReactDOM && typeof ReactDOM.createPortal === 'function' ? ReactDOM.createPortal : null

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
        weekly: 'Weekly',
        familyHint: '{name} left — weekly|5h',
        fiveHour: '5h',
        importAll: 'Import all from CLI',
        importAllOk: 'Imported {n} account(s)',
        quotaPending: 'Quota not fetched yet',
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
        imageGeneration: 'Image generation',
        imageGenerationHint: 'Adds the generate_image tool, so the agent draws pictures with the Google image model included in your subscription instead of writing code to make them.',
        imageModel: 'Image model',
        imageModelHint: 'Detected from your account; the tool does not hardcode it.',
        imageOff: 'disabled',
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
        weekly: 'Tuần',
        familyHint: '{name} còn lại — tuần|5 giờ',
        fiveHour: '5 giờ',
        importAll: 'Nhập tất cả từ CLI',
        importAllOk: 'Đã nhập {n} tài khoản',
        quotaPending: 'Chưa lấy được hạn mức',
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
        imageGeneration: 'Tạo ảnh bằng AI',
        imageGenerationHint: 'Thêm tool generate_image để agent tạo ảnh bằng model ảnh của Google đi kèm subscription, thay vì viết code vẽ ảnh.',
        imageModel: 'Model tạo ảnh',
        imageModelHint: 'Lấy tự động từ tài khoản, không hardcode.',
        imageOff: 'đang tắt',
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
      '.shub-pill{appearance:none;display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;line-height:1;cursor:pointer;transition:border-color .15s,background .15s,box-shadow .15s;max-width:100%;flex-shrink:1;white-space:nowrap;user-select:none}',
      '.shub-pill:hover{border-color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-3)}',
      '.shub-pill:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.shub-dot{width:6px;height:6px;border-radius:50%;flex:none;background:var(--dsw-alias-label-tertiary)}',
      '.shub-dot-ok{background:var(--dsw-alias-state-success-primary)}',
      '.shub-dot-warn{background:var(--dsw-alias-state-warn-primary)}',
      '.shub-dot-bad{background:var(--dsw-alias-state-error-primary)}',
      '.shub-pill-name{font-weight:600;font-size:11px;letter-spacing:.01em}',
      '.shub-pill-sep{width:1px;height:10px;background:var(--dsw-alias-border-l2);flex:none}',
      '.shub-pill-quota{display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-secondary);font-size:11px}',
      '.shub-pill-quota b{font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.shub-pill-meta{color:var(--dsw-alias-label-tertiary);font-size:10.5px}',
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
      '.shub-dialog{border:1px solid var(--dsw-alias-border-l1)}',
      '.shub-dialog::backdrop{background:color-mix(in srgb,black 55%,transparent);backdrop-filter:blur(6px)}',
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

    // The tag id must be unique per UI generation: reusing the id of the previous
    // bundle made the guard below skip injection while an older, differently
    // classed stylesheet was still in the DOM, and the whole panel rendered as
    // naked text. Every load now removes the previous tags and installs one.
    const UI_CSS_ID = 'dsh-subscriptions/ui.css/v2'
    const UI_TAG_SELECTOR = 'style[data-plugin="dsh-subscriptions"]'
    function installStyles() {
      if (typeof document === 'undefined' || !document.head) return
      for (const stale of Array.from(document.querySelectorAll(UI_TAG_SELECTOR))) {
        if (stale.dataset && stale.dataset.pluginCss === UI_CSS_ID) continue
        stale.parentNode && stale.parentNode.removeChild(stale)
      }
      if (document.querySelector('style[data-plugin-css="' + UI_CSS_ID + '"]')) return
      const tag = document.createElement('style')
      tag.textContent = CSS
      tag.setAttribute('data-plugin', 'dsh-subscriptions')
      tag.dataset.pluginCss = UI_CSS_ID
      tag.setAttribute('data-dsh-plugin', 'dsh-subscriptions')
      document.head.appendChild(tag)
    }
    installStyles()

    // Inline fallbacks for the structural containers. These say the same thing as
    // the stylesheet, but they travel with the elements: if a host rewrites or
    // blocks injected CSS the panel is still laid out instead of collapsing into
    // a column of bare words.
    const S = {
      panel: { display: 'flex', flexDirection: 'column', gap: 14 },
      head: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
      pill: {
        appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, height: 24,
        padding: '0 7px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 999,
        background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)',
        font: 'inherit', fontSize: 11, cursor: 'pointer', maxWidth: '100%', flexShrink: 1,
        whiteSpace: 'nowrap', userSelect: 'none',
      },
      headerRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        width: '100%', padding: '10px 14px', border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: 12, background: 'var(--dsw-alias-bg-layer-2)', color: 'inherit',
        font: 'inherit', cursor: 'pointer', textAlign: 'left',
      },
      card: {
        border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12,
        background: 'var(--dsw-alias-bg-layer-2)', padding: '12px 14px',
      },
      cardHead: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
      ident: { display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 },
      avatar: {
        width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center',
        fontSize: 11, fontWeight: 700, flex: 'none', background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-secondary)', border: '1px solid var(--dsw-alias-border-l1)',
      },
      grow: { minWidth: 0, flex: 1 },
      bars: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 },
      barRow: { display: 'grid', gridTemplateColumns: '74px 1fr auto', alignItems: 'center', gap: 9 },
      track: { height: 5, borderRadius: 999, background: 'var(--dsw-alias-bg-layer-1)', overflow: 'hidden' },
      btn: {
        appearance: 'none', font: 'inherit', fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
        border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 8, padding: '4px 10px',
        background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)',
      },
      btnPrimary: {
        appearance: 'none', font: 'inherit', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
        border: '1px solid var(--dsw-alias-brand-primary)', borderRadius: 8, padding: '4px 10px',
        background: 'var(--dsw-alias-brand-primary)', color: 'var(--dsw-alias-label-primary-foreground)',
      },
      btnDanger: {
        appearance: 'none', font: 'inherit', fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
        border: '1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent)',
        borderRadius: 8, padding: '4px 10px', background: 'transparent',
        color: 'var(--dsw-alias-state-error-primary)',
      },
      input: {
        height: 30, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 8,
        background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)',
        font: 'inherit', fontSize: 12, padding: '0 8px', width: '100%',
      },
      actions: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' },
      backdrop: {
        position: 'fixed', inset: 0, zIndex: 10020, display: 'grid', placeItems: 'center',
        background: 'color-mix(in srgb, black 58%, transparent)', backdropFilter: 'blur(8px)',
      },
      modal: {
        width: 'min(560px, 94vw)', maxHeight: 'min(86vh, 760px)', overflow: 'auto',
        border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 16,
        background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)',
        boxShadow: '0 24px 64px color-mix(in srgb, black 55%, transparent)', padding: 18,
      },
      title: { fontSize: 15, fontWeight: 650, letterSpacing: '-.01em' },
      sub: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginTop: 2 },
      tabs: { display: 'flex', gap: 4, borderBottom: '1px solid var(--dsw-alias-border-l2)' },
      field: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 },
      label: { fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' },
      hint: { fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary)' },
      note: { fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary)' },
      err: { fontSize: 11.5, color: 'var(--dsw-alias-state-error-primary)', overflowWrap: 'anywhere' },
      ok: { fontSize: 11.5, color: 'var(--dsw-alias-state-success-primary)' },
      empty: { textAlign: 'center', padding: '18px 10px', color: 'var(--dsw-alias-label-secondary)' },
      advanced: {
        border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 10,
        background: 'var(--dsw-alias-bg-layer-2)', padding: '4px 12px 12px',
      },
    }

    function dotStyle(kind) {
      const base = { width: 6, height: 6, borderRadius: '50%', flex: 'none', background: 'var(--dsw-alias-label-tertiary)' }
      if (kind === 'ok') base.background = 'var(--dsw-alias-state-success-primary)'
      else if (kind === 'warn') base.background = 'var(--dsw-alias-state-warn-primary)'
      else if (kind === 'bad') base.background = 'var(--dsw-alias-state-error-primary)'
      return base
    }

    const NS = 'dsh-subscriptions'
    const PKG = 'agy2dsh'
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
      if (id === 'weekly') return tx(lang, 'weekly')
      if (id === '5h') return tx(lang, 'fiveHour')
      return fallback || id || ''
    }

    const FAMILY_ORDER = ['gemini', 'claude']
    const WINDOW_ORDER = ['weekly', '5h']

    /** Window ids look like "gemini-weekly" / "claude-5h"; recover the parts. */
    function windowParts(win) {
      const id = String((win && win.id) || '')
      const family = typeof win.family === 'string' && win.family
        ? win.family
        : (/^gemini/i.test(id) ? 'gemini' : /^(claude|3p)/i.test(id) ? 'claude' : '')
      const window = typeof win.window === 'string' && win.window
        ? win.window
        : (/weekly/i.test(id) ? 'weekly' : /(5h|five)/i.test(id) ? '5h' : '')
      return { family, window }
    }

    /**
     * Antigravity meters two families, each with a weekly and a 5-hour window.
     * The host sends them flat, so fold them back into the pair the UI shows and
     * recover family/window from the id when the payload left them out.
     */
    function groupWindows(windows) {
      const list = (Array.isArray(windows) ? windows : []).filter((w) => w && Number.isFinite(Number(w.usedPercent)))
      const families = []
      const byFamily = new Map()
      const loose = []
      for (const win of list) {
        const parts = windowParts(win)
        const tagged = { ...win, family: parts.family, window: parts.window || 'pool' }
        if (!parts.family) { loose.push(tagged); continue }
        if (!byFamily.has(parts.family)) {
          const group = { id: parts.family, windows: [] }
          byFamily.set(parts.family, group)
          families.push(group)
        }
        byFamily.get(parts.family).windows.push(tagged)
      }
      families.sort((a, b) => FAMILY_ORDER.indexOf(a.id) - FAMILY_ORDER.indexOf(b.id))
      for (const group of families) {
        group.windows.sort((a, b) => WINDOW_ORDER.indexOf(a.window) - WINDOW_ORDER.indexOf(b.window))
      }
      return { families, loose }
    }

    /** What is LEFT of a window; the CLI reports the same number. */
    function remainingOf(win) {
      const used = Number(win && win.usedPercent)
      if (!Number.isFinite(used)) return null
      return Math.min(100, Math.max(0, 100 - used))
    }

    function percentText(value) {
      if (value == null) return '—'
      return (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10) + '%'
    }
    /** Full precision, matching what `agy /usage` prints (e.g. 93.96%). */
    function percentExact(value) {
      if (value == null) return '—'
      return (Math.round(value * 100) / 100) + '%'
    }

    /** Compact remaining text for the header pill: e.g. "74%" or "62|74%" */
    function familyPair(group) {
      const pick = (id) => {
        const hit = group.windows.find((w) => w.window === id)
        return hit ? percentText(remainingOf(hit)) : null
      }
      const weekly = pick('weekly')
      const fiveHour = pick('5h')
      if (fiveHour && weekly) return { text: fiveHour + ' · ' + weekly, compact: fiveHour }
      if (fiveHour || weekly) return { text: fiveHour || weekly, compact: fiveHour || weekly }
      const only = group.windows[0]
      const t = percentText(only ? remainingOf(only) : null)
      return { text: t, compact: t }
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
      // The gauge shows the remaining allowance, so low values are the bad ones.
      const fillColor = pct == null
        ? 'var(--dsw-alias-label-tertiary)'
        : pct <= 5 ? 'var(--dsw-alias-state-error-primary)'
          : pct <= 25 ? 'var(--dsw-alias-state-warn-primary)'
            : 'var(--dsw-alias-state-success-primary)'
      return h('div', { className: 'shub-bar-track', style: S.track },
        h('div', {
          className: 'shub-bar-fill',
          style: { width: width + '%', height: '100%', borderRadius: 999, background: fillColor, transition: 'width .25s ease' },
        }),
      )
    }

    function QuotaRows(props) {
      const { windows, usagePercent, lang, now } = props
      const labelStyle = { fontSize: 11.5, fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' }
      const valueStyle = { fontSize: 11.5, color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }
      const grouped = groupWindows(windows)
      const resetHint = (win) => {
        const resetAt = Number(win && win.resetAt) || 0
        return resetAt > now ? countdown(resetAt - now, lang) : ''
      }
      const row = (key, mark, label, win) => {
        const left = remainingOf(win)
        const reset = resetHint(win)
        return h('div', { className: 'shub-bar-row', style: S.barRow, key },
          h('span', { className: 'shub-bar-label', style: { ...labelStyle, display: 'inline-flex', alignItems: 'center', gap: 4 } },
            mark ? h(BrandMark, { name: mark, size: 11 }) : null,
            label,
          ),
          h(Bar, { value: left }),
          h('span', { className: 'shub-bar-value', style: valueStyle },
            h('b', { style: { color: 'var(--dsw-alias-label-primary)', fontWeight: 600 } }, percentExact(left)),
            reset ? h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11 } }, ' · ' + reset) : null,
          ),
        )
      }

      if (!grouped.families.length && !grouped.loose.length) {
        if (usagePercent == null) return null
        const left = 100 - clampPercent(usagePercent)
        return h('div', { className: 'shub-bars', style: S.bars },
          h('div', { className: 'shub-bar-row', style: S.barRow },
            h('span', { className: 'shub-bar-label', style: labelStyle }, tx(lang, 'quota')),
            h(Bar, { value: left }),
            h('span', { className: 'shub-bar-value', style: valueStyle }, h('b', null, percentExact(left))),
          ),
        )
      }

      const rows = []
      for (const group of grouped.families) {
        for (const win of group.windows) {
          rows.push(row(
            group.id + '-' + win.window,
            group.id,
            windowLabel(group.id, group.id, lang) + ' · ' + windowLabel(win.window, win.window, lang),
            win,
          ))
        }
      }
      for (const win of grouped.loose) {
        rows.push(row('loose-' + String(win.id), '', windowLabel(win.id, win.label, lang), win))
      }
      return h('div', { className: 'shub-bars', style: S.bars }, rows)
    }

    function Icon(props) {
      const size = props.size || 14
      const common = { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }
      if (props.name === 'close') return h('svg', common, h('path', { d: 'M4 4l8 8M12 4l-8 8' }))
      return null
    }

    function accountIdentity(account, lang) {
      const email = account._masked
        ? maskEmail(account.email || account.label)
        : (account.email || account.label || '')
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

    function dotKind(pct, configured) {
      if (!configured) return 'off'
      const n = clampPercent(pct)
      if (n == null) return 'ok'
      if (n >= 95) return 'bad'
      if (n >= 75) return 'warn'
      return 'ok'
    }

    /**
     * Brand marks. Two small glyphs, drawn inline so they follow the theme and
     * need no assets: a four-point spark for Gemini, a sunburst for Claude.
     */
    function BrandMark(props) {
      const name = String((props && props.name) || '')
      const size = Number(props && props.size) || 12
      const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': 'true', style: { flex: 'none', display: 'block' } }
      if (name === 'gemini') {
        return h('svg', common, h('path', {
          d: 'M12 1.6c.86 5.12 3.57 7.83 8.7 8.7-5.13.86-7.84 3.57-8.7 8.69-.86-5.12-3.57-7.83-8.7-8.7 5.13-.86 7.84-3.57 8.7-8.69z',
          fill: '#4C8DF6',
        }))
      }
      if (name === 'claude') {
        return h('svg', common,
          h('g', { stroke: '#D97757', strokeWidth: 2.1, strokeLinecap: 'round', fill: 'none' },
            h('path', { d: 'M12 3.2v17.6' }),
            h('path', { d: 'M4.4 7.6l15.2 8.8' }),
            h('path', { d: 'M19.6 7.6L4.4 16.4' }),
          ),
        )
      }
      return null
    }

    /* ----------------------------- account card ------------------------ */

    function AccountCard(props) {
      const { account, lang, now, busy, onAction } = props
      const ident = accountIdentity(account, lang)
      const state = accountState(account, now, lang)
      const pct = account.usagePercent
      return h('div', { className: 'shub-card', style: { ...S.card, marginTop: 8 } },
        h('div', { className: 'shub-card-head', style: S.cardHead },
          h('div', { className: 'shub-ident', style: S.ident },
            h('div', { className: 'shub-avatar', style: S.avatar }, providerInitial(account.provider)),
            h('div', { className: 'shub-ident-text', style: S.grow },
              h('div', {
                className: 'shub-ident-name',
                style: { fontWeight: 600, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
              }, ident.name || tx(lang, 'account')),
              h('div', {
                className: 'shub-ident-sub',
                style: { fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
              }, [state.label, ident.plan].filter(Boolean).join(' · ')),
            ),
          ),
          h('span', {
            className: 'shub-dot',
            style: dotStyle(dotKind(pct, account.configured)),
            'aria-label': state.label,
            role: 'img',
          }),
        ),
        h(QuotaRows, { windows: account.usage, usagePercent: pct, lang, now }),
        account.error ? h('div', { className: 'shub-err', style: { ...S.err, marginTop: 8 } }, account.error) : null,
        h('div', { className: 'shub-actions', style: S.actions },
          h('button', {
            className: 'shub-btn',
            style: S.btn,
            disabled: busy,
            onClick: () => onAction('check', account),
            title: tx(lang, 'verify'),
          }, tx(lang, 'verify')),
          h('button', {
            className: 'shub-btn',
            style: S.btn,
            disabled: busy,
            onClick: () => onAction('sync', account),
            title: tx(lang, 'syncModels'),
          }, tx(lang, 'syncModels')),
          h('button', {
            className: 'shub-btn shub-btn-danger',
            style: S.btnDanger,
            disabled: busy,
            onClick: () => onAction('logout', account),
          }, tx(lang, 'signOut')),
        ),
      )
    }

    /* ------------------------------- panel ----------------------------- */

    function HubPanel(props) {
      const { lang, data, reload, variant } = props
      const firstAccount = (data.accounts || []).find((a) => a && a.provider)
      const [tab, setTab] = React.useState((firstAccount && firstAccount.provider) || PROVIDERS[0])
      const [busy, setBusy] = React.useState(false)
      const [notice, setNotice] = React.useState({ kind: '', message: '' })
      const [token, setToken] = React.useState('')
      const now = Date.now()

      // Config carries one empty placeholder slot per provider; those are not
      // accounts and must never be listed as "account 1".
      const accounts = (data.accounts || []).filter((a) => a && a.provider === tab && a.configured)
      const configured = accounts

      const act = async (kind, account) => {
        if (busy) return
        setBusy(true)
        setNotice({ kind: '', message: '' })
        try {
          const index = Number(account && account.index) || 1
          if (kind === 'check') await postJson('/dsh-subscriptions/check', { provider: tab, index })
          else if (kind === 'sync') await postJson('/dsh-subscriptions/accounts/sync-models', { provider: tab, index })
          else if (kind === 'logout') await postJson('/dsh-subscriptions/logout', { provider: tab, index })
          else if (kind === 'import') await postJson('/dsh-subscriptions/import-local', { provider: tab, index })
          else if (kind === 'importAll') {
            const result = await postJson('/dsh-subscriptions/import-local-all', { provider: tab })
            const count = Array.isArray(result.imported) ? result.imported.length : 0
            setNotice({ kind: 'ok', message: tx(lang, 'importAllOk', { n: count }) })
          }
          else if (kind === 'token') await postJson('/dsh-subscriptions/import-token', { provider: tab, index, refreshToken: String(token || '').trim() })
          if (kind === 'import') setNotice({ kind: 'ok', message: tx(lang, 'importedOk') })
          if (kind === 'token') setToken('')
          await reload()
        } catch (err) {
          setNotice({ kind: 'err', message: tx(lang, 'errorPrefix') + ': ' + cleanError(err) })
        } finally {
          setBusy(false)
        }
      }

      return h('div', { className: 'shub shub-panel', style: S.panel },
        variant === 'modal'
          ? null
          : h('div', { className: 'shub-head', style: S.head },
            h('div', null,
              h('div', { className: 'shub-title', style: S.title }, tx(lang, 'hubTitle')),
              h('div', { className: 'shub-sub', style: S.sub }, tx(lang, 'hubSubtitle')),
            ),
          ),
        h('div', { className: 'shub-tabs', style: S.tabs, role: 'tablist' }, PROVIDERS.map((id) => {
          const rows = (data.accounts || []).filter((a) => a.provider === id && a.configured)
          const selected = tab === id
          return h('button', {
            key: id,
            className: 'shub-tab',
            style: {
              appearance: 'none', font: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              background: 'transparent', border: 0, padding: '7px 10px',
              borderBottom: '2px solid ' + (selected ? 'var(--dsw-alias-brand-primary)' : 'transparent'),
              color: selected ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
            },
            role: 'tab',
            'aria-selected': selected ? 'true' : 'false',
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
            onAction: act,
          })))
          : h('div', { className: 'shub-empty', style: S.empty },
            h('div', { className: 'shub-empty-title', style: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)', marginBottom: 4 } }, tx(lang, 'noAccounts')),
            h('div', null, tx(lang, 'noAccountsHint')),
          ),
        h('div', { className: 'shub-actions', style: S.actions },
          h('button', {
            className: 'shub-btn shub-btn-primary',
            style: S.btnPrimary,
            disabled: busy,
            onClick: () => act('import', accounts[0] || { index: 1 }),
            title: tx(lang, 'importHint'),
          }, tx(lang, 'importFromCli')),
          h('button', {
            className: 'shub-btn',
            style: S.btn,
            disabled: busy,
            onClick: () => act('importAll', { index: 1 }),
            title: tx(lang, 'importAll'),
          }, tx(lang, 'importAll')),
          h('button', {
            className: 'shub-btn',
            style: S.btn,
            disabled: busy,
            onClick: () => { if (String(token).trim()) act('token', { index: (accounts[0] && accounts[0].index) || 1 }) },
          }, tx(lang, 'importToken')),
          h('button', { className: 'shub-btn', style: S.btn, disabled: busy, onClick: () => { reload() } }, tx(lang, 'refresh')),
        ),
        h('input', {
          className: 'shub-input',
          style: S.input,
          type: 'password',
          value: token,
          placeholder: tx(lang, 'tokenLabel'),
          'aria-label': tx(lang, 'tokenLabel'),
          onChange: (e) => setToken(e.target.value),
        }),
        h('div', { className: 'shub-note', style: S.note }, tx(lang, 'tokenHint')),
        notice.message ? h('div', { style: notice.kind === 'ok' ? S.ok : S.err }, notice.message) : null,
        configured.length === 0 ? h('div', { className: 'shub-note', style: S.note }, tx(lang, 'quotaPending')) : null,
        data.error ? h('div', { style: S.err }, tx(lang, 'hostOffline') + ': ' + data.error) : null,
      )
    }

    /**
     * The hub overlay. It renders through a portal into <body> when the host
     * exposes react-dom, so it never shares the session header's stacking or
     * layout context; the <dialog> element itself then sits in the browser's top
     * layer. Two rules matter for stability:
     *   - the open/close effect has no dependencies, and the close callback is
     *     read through a ref, so a polling re-render can never run its cleanup
     *     (that is what made the panel close itself);
     *   - focus is taken with preventScroll, so opening the hub cannot scroll the
     *     conversation underneath.
     */
    function HubDialog(props) {
      const { lang, data, reload, onClose } = props
      const ref = React.useRef(null)
      const closeRef = React.useRef(onClose)
      closeRef.current = onClose

      React.useEffect(() => {
        const el = ref.current
        if (!el) return undefined
        try { if (typeof el.showModal === 'function' && !el.open) el.showModal() } catch { /* already open */ }
        try { el.focus({ preventScroll: true }) } catch { /* older engines */ }
        const onCancel = (event) => {
          if (event && typeof event.preventDefault === 'function') event.preventDefault()
          closeRef.current()
        }
        el.addEventListener('cancel', onCancel)
        return () => {
          el.removeEventListener('cancel', onCancel)
          try { if (el.open) el.close() } catch { /* ignore */ }
        }
      }, [])

      const node = h('dialog', {
        ref,
        className: 'shub shub-dialog',
        style: {
          margin: 'auto',
          padding: 18,
          width: 'min(560px, 94vw)',
          maxWidth: 'min(560px, 94vw)',
          maxHeight: 'min(88vh, 780px)',
          overflow: 'auto',
          border: '1px solid var(--dsw-alias-border-l1)',
          borderRadius: 16,
          background: 'var(--dsw-alias-bg-layer-3)',
          color: 'var(--dsw-alias-label-primary)',
          boxShadow: '0 24px 64px color-mix(in srgb, black 55%, transparent)',
        },
        onClick: (event) => { if (event.target === ref.current) closeRef.current() },
      },
      h('div', { className: 'shub-modal-head', style: { ...S.head, marginBottom: 14 } },
        h('div', null,
          h('div', { className: 'shub-title', style: S.title }, tx(lang, 'hubTitle')),
          h('div', { className: 'shub-sub', style: S.sub }, tx(lang, 'hubSubtitle')),
        ),
        h('button', {
          className: 'shub-icon-btn',
          style: {
            appearance: 'none', width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
            display: 'grid', placeItems: 'center', background: 'var(--dsw-alias-bg-layer-2)',
            border: '1px solid var(--dsw-alias-border-l2)', color: 'var(--dsw-alias-label-secondary)',
          },
          onClick: () => closeRef.current(),
          'aria-label': tx(lang, 'close'),
        }, h(Icon, { name: 'close' })),
      ),
      h(HubPanel, { lang, data, reload, variant: 'modal' }),
      )

      if (typeof document === 'undefined') return node
      const mount = document.body || document.documentElement || document.head
      if (createPortal && mount) return createPortal(node, mount)
      return node
    }

    /* -------------------------------- pill ----------------------------- */

    function activeAccount(data) {
      const status = data.status || {}
      const active = status.active
      const configured = (p) => (data.accounts || []).filter((a) => a && a.configured && a.provider === p)
      if (active && active.provider) {
        const list = configured(active.provider)
        const byIndex = active.index ? list.find((a) => Number(a.index) === Number(active.index)) : null
        const account = byIndex || list[0] || null
        const windows = Array.isArray(active.windows) && active.windows.length ? active.windows : (account ? account.usage : null)
        const usagePercent = active.usagePercent != null ? active.usagePercent : (account ? account.usagePercent : null)
        return { account, provider: active.provider, windows: windows || [], usagePercent }
      }
      for (const provider of PROVIDERS) {
        const list = configured(provider)
        if (list.length) return { account: list[0], provider, windows: list[0].usage || [], usagePercent: list[0].usagePercent }
      }
      return { account: null, provider: '', windows: [], usagePercent: null }
    }

    function HubPill(props) {
      const { lang, data, reload } = props
      const [open, setOpen] = React.useState(false)
      const close = React.useCallback(() => setOpen(false), [])
      const current = activeAccount(data)
      const configuredCount = (data.accounts || []).filter((a) => a && a.configured).length
      const grouped = groupWindows(current.windows)

      const chipNodes = []
      grouped.families.forEach((group, index) => {
        const pair = familyPair(group)
        if (index > 0) chipNodes.push(h('span', { key: 'sep-' + index, style: { color: 'var(--dsw-alias-label-tertiary)', opacity: 0.6, fontSize: 10 }, 'aria-hidden': 'true' }, '•'))
        chipNodes.push(h('span', {
          key: 'fam-' + group.id,
          style: { display: 'inline-flex', alignItems: 'center', gap: 3.5, color: 'var(--dsw-alias-label-secondary)', fontSize: 11, whiteSpace: 'nowrap' },
          title: tx(lang, 'familyHint', { name: windowLabel(group.id, group.id, lang) }),
        },
        h(BrandMark, { name: group.id, size: 11 }),
        h('b', { style: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)', fontVariantNumeric: 'tabular-nums' } }, pair.compact || pair.text),
        ))
      })
      grouped.loose.forEach((win) => {
        const left = remainingOf(win)
        chipNodes.push(h('span', {
          key: 'loose-' + String(win.id),
          style: { display: 'inline-flex', alignItems: 'center', gap: 3.5, color: 'var(--dsw-alias-label-secondary)', fontSize: 11, whiteSpace: 'nowrap' },
        },
        h('span', null, windowLabel(win.id, win.label, lang)),
        h('b', { style: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)', fontVariantNumeric: 'tabular-nums' } }, percentText(left)),
        ))
      })

      // The dot tracks the 5-hour Gemini window: >=60% left is healthy, below 60
      // is a warning, below 20 is critical. Falls back to the other family when
      // the account has no Gemini window at all.
      const fiveHourLeft = (() => {
        const family = grouped.families.find((group) => group.id === 'gemini')
        const fiveHour = family ? family.windows.find((w) => w.window === '5h') : null
        if (fiveHour) return remainingOf(fiveHour)
        // Other providers (codex) have no families: use their 5-hour window, or
        // the tightest window they do have, so the dot still means something.
        const looseFive = grouped.loose.find((w) => /5h/i.test(String(w.id) + String(w.window)))
        if (looseFive) return remainingOf(looseFive)
        const looseLefts = grouped.loose.map((w) => remainingOf(w)).filter((n) => n != null)
        if (looseLefts.length) return Math.min(...looseLefts)
        return current.usagePercent == null ? null : 100 - clampPercent(current.usagePercent)
      })()
      const dot = configuredCount === 0 || fiveHourLeft == null
        ? (configuredCount === 0 ? 'off' : 'ok')
        : fiveHourLeft >= 60 ? 'ok' : fiveHourLeft >= 20 ? 'warn' : 'bad'

      return h('span', { className: 'shub', style: { display: 'inline-flex', alignItems: 'center' } },
        h('button', {
          className: 'shub-pill',
          style: S.pill,
          onClick: () => setOpen(true),
          title: tx(lang, 'pillOpen'),
          'aria-label': tx(lang, 'pillOpen'),
          'aria-expanded': open ? 'true' : 'false',
        },
        h('span', { style: dotStyle(dot), 'aria-hidden': 'true' }),
        h('span', { style: { fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' } },
          current.provider ? providerLabel(current.provider, lang) : tx(lang, 'notConnected')),
        chipNodes.length ? h('span', { style: { width: 1, height: 10, background: 'var(--dsw-alias-border-l2)', flex: 'none' }, 'aria-hidden': 'true' }) : null,
        chipNodes,
        configuredCount > 1
          ? h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 10 } }, '+' + (configuredCount - 1))
          : null,
        ),
        open ? h(HubDialog, { lang, data, reload, onClose: close }) : null,
      )
    }

    /* --------------------------- settings panel ------------------------ */

    function Field(props) {
      return h('label', { className: 'shub-field', style: S.field },
        h('span', { className: 'shub-field-label', style: S.label }, props.label),
        props.children,
        props.hint ? h('span', { className: 'shub-field-hint', style: S.hint }, props.hint) : null,
      )
    }

    function Segmented(props) {
      const { options, value, onChange } = props
      return h('div', {
        className: 'shub-seg',
        style: { display: 'inline-flex', padding: 2, gap: 2, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 9, background: 'var(--dsw-alias-bg-layer-1)' },
        role: 'group',
      }, options.map((opt) => {
        const selected = String(value) === String(opt.value)
        return h('button', {
          key: String(opt.value),
          type: 'button',
          'aria-pressed': selected ? 'true' : 'false',
          style: {
            appearance: 'none', font: 'inherit', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
            border: 0, borderRadius: 7, padding: '4px 11px',
            background: selected ? 'var(--dsw-alias-bg-layer-3)' : 'transparent',
            color: selected ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
          },
          onClick: () => onChange(opt.value),
        }, opt.label)
      }))
    }

    function CheckRow(props) {
      return h('label', {
        className: 'shub-check',
        style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginTop: 10, cursor: 'pointer' },
      },
      h('input', { type: 'checkbox', checked: Boolean(props.checked), onChange: (e) => props.onChange(e.target.checked) }),
      h('span', null, props.label),
      )
    }

    function SettingsCard(props) {
      const { lang, data, reload } = props
      const [draft, setDraft] = React.useState(null)
      const [status, setStatus] = React.useState({ saving: false, message: '', kind: '' })
      const config = data.config || {}
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
      // What /status reports for the image tool: the model id the backend
      // publishes for this account, so the panel can name it.
      const imageState = (data && data.status && data.status.image) || {}

      return h('div', { className: 'shub shub-panel', style: S.panel },
        h(HubPanel, { lang, data, reload, variant: 'settings' }),
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 } },
          h('span', { style: S.label }, tx(lang, 'settingsLanguage')),
          h(Segmented, {
            value: value('language', 'en'),
            options: [{ value: 'en', label: 'English' }, { value: 'vi', label: 'Tiếng Việt' }],
            onChange: (next) => edit('language', next),
          }),
        ),
        h('div', { style: S.hint }, tx(lang, 'settingsLanguageHint')),
        h('details', { className: 'shub-advanced', style: S.advanced, open: false },
          h('summary', { style: { cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-label-secondary)', padding: '8px 0' } }, tx(lang, 'settingsRotation')),
          h(Field, { label: tx(lang, 'rotationStrategy') },
            h('select', {
              style: S.input,
              value: value('rotationStrategy', 'round-robin'),
              onChange: (e) => edit('rotationStrategy', e.target.value),
            },
            h('option', { value: 'round-robin' }, tx(lang, 'rotationRoundRobin')),
            h('option', { value: 'least-used' }, tx(lang, 'rotationLeastUsed')),
            h('option', { value: 'sticky' }, tx(lang, 'rotationSticky')),
            )),
          h(Field, { label: tx(lang, 'switchAt'), hint: tx(lang, 'switchAtHint') },
            h('input', {
              style: S.input,
              type: 'number',
              min: 0,
              max: 100,
              value: value('switchAtRemaining', 0),
              onChange: (e) => edit('switchAtRemaining', Number(e.target.value)),
            })),
          h(Field, { label: tx(lang, 'cooldownMinutes'), hint: tx(lang, 'cooldownHint') },
            h('input', {
              style: S.input,
              type: 'number',
              min: 0,
              value: Math.round((Number(value('cooldownMs', 1800000)) || 0) / 60000),
              onChange: (e) => edit('cooldownMs', Number(e.target.value) * 60000),
            })),
        ),
        h('details', { className: 'shub-advanced', style: { ...S.advanced, marginTop: 8 } },
          h('summary', { style: { cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-label-secondary)', padding: '8px 0' } }, tx(lang, 'settingsAdvanced')),
          h(Field, { label: tx(lang, 'idleTimeout'), hint: tx(lang, 'idleTimeoutHint') },
            h('input', {
              style: S.input,
              type: 'number',
              min: 0,
              value: seconds,
              onChange: (e) => edit('streamIdleTimeoutMs', Math.max(0, Number(e.target.value)) * 1000),
            })),
          h(Field, { label: tx(lang, 'clientVersion'), hint: tx(lang, 'clientVersionHint') },
            h('input', {
              style: S.input,
              type: 'text',
              placeholder: '1.18.3',
              value: value('antigravityClientVersion', ''),
              onChange: (e) => edit('antigravityClientVersion', e.target.value),
            })),
          h(Field, { label: tx(lang, 'composerQuota'), hint: tx(lang, 'composerQuotaHint') },
            h('select', {
              style: S.input,
              value: value('composerQuota', 'off'),
              onChange: (e) => edit('composerQuota', e.target.value),
            },
            h('option', { value: 'off' }, tx(lang, 'composerOff')),
            h('option', { value: 'percent' }, tx(lang, 'composerPercent')),
            h('option', { value: 'bar' }, tx(lang, 'composerBar')),
            )),
          h(CheckRow, {
            label: tx(lang, 'privacyMask'),
            checked: Boolean(value('privacyMask', false)),
            onChange: (next) => edit('privacyMask', next),
          }),
          h('div', { style: S.hint }, tx(lang, 'privacyMaskHint')),
          h(CheckRow, {
            label: tx(lang, 'notifyLimits'),
            checked: Boolean(value('notifyLimits', true)),
            onChange: (next) => edit('notifyLimits', next),
          }),
          h('div', { style: S.hint }, tx(lang, 'notifyLimitsHint')),
          h(CheckRow, {
            label: tx(lang, 'imageGeneration'),
            checked: value('imageGeneration', true) !== false,
            onChange: (next) => edit('imageGeneration', next),
          }),
          h('div', { style: S.hint }, tx(lang, 'imageGenerationHint')),
          h('div', { style: S.hint },
            tx(lang, 'imageModel') + ': ' + (
              imageState.enabled === false || value('imageGeneration', true) === false
                ? tx(lang, 'imageOff')
                : (imageState.model || tx(lang, 'loading'))
            ) + ' — ' + tx(lang, 'imageModelHint'),
          ),
        ),
        h('div', { style: { ...S.actions, justifyContent: 'flex-end', marginTop: 12 } },
          status.message ? h('span', { style: status.kind === 'err' ? S.err : S.ok }, status.message) : null,
          h('button', {
            className: 'shub-btn shub-btn-primary',
            style: S.btnPrimary,
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
      return h('div', { className: 'shub', style: { display: 'block' } },
        h('div', {
          className: 'shub-headerRow',
          style: S.headerRow,
          role: 'button',
          tabIndex: 0,
          'aria-expanded': open ? 'true' : 'false',
          onClick: () => setOpen((v) => !v),
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v) }
          },
        },
        h('span', { style: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 } },
          h('span', { style: { fontWeight: 600, fontSize: 12.5 } }, tx(lang, 'hubTitle')),
          h('span', { style: { fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary)' } },
            configured + ' ' + (configured === 1 ? tx(lang, 'account') : tx(lang, 'accounts'))),
        ),
        h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 14 } }, open ? '–' : '+'),
        ),
        open
          ? h('div', { style: { marginTop: 12 } }, h(SettingsCard, { lang, data, reload }))
          : null,
      )
    }

    /* --------------------------- composer quota ------------------------ */

    function ComposerQuota(props) {
      const { lang, data } = props
      const mode = String((data.config && data.config.composerQuota) || 'off')
      if (mode === 'off') return null
      const current = activeAccount(data)
      const grouped = groupWindows(current.windows)
      const lefts = [...grouped.families.flatMap((g) => g.windows.map((w) => remainingOf(w))), ...grouped.loose.map((w) => remainingOf(w))]
        .filter((n) => n != null)
      const left = lefts.length ? Math.min(...lefts) : (current.usagePercent != null ? 100 - clampPercent(current.usagePercent) : null)
      if (left == null) return null
      const label = current.provider ? providerLabel(current.provider, lang) : tx(lang, 'quota')
      return h('div', {
        className: 'shub',
        style: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--dsw-alias-label-secondary)' },
        title: tx(lang, 'familyHint', { name: label }) + ' ' + percentText(left),
      },
      h('span', { style: dotStyle(left <= 5 ? 'bad' : left <= 25 ? 'warn' : 'ok'), 'aria-hidden': 'true' }),
      h('span', null, label),
      mode === 'bar'
        ? h('span', { style: { width: 48, display: 'inline-block' } }, h(Bar, { value: left }))
        : h('b', { style: { fontVariantNumeric: 'tabular-nums', color: 'var(--dsw-alias-label-primary)' } }, percentText(left)),
      )
    }

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
              { name: 'plugins.item', id: PKG, order: 60 },
              { name: 'plugins.bundle.config', key: PKG },
              { name: 'plugins.bundle.config', key: ROW_ID },
              { name: 'plugins.row.config', key: ROW_CONFIG_KEY },
              { name: 'plugins.row.config', key: PKG + '#' + PKG },
              { name: 'plugins.row.config', key: ROW_ID + '#' + ROW_ID },
              { name: 'plugins.row.config', key: ROW_ID },
              { name: 'plugins.row.config', key: PKG },
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
