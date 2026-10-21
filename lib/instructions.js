export const INSTRUCTIONS = {
  codex: {
    title: "OpenAI / ChatGPT Codex",
    stepsEn: [
      "1. Log in via CLI on server: run \"codex login\" in terminal.",
      "2. Click \"📥 From CLI\" to auto-import ~/.codex/auth.json.",
      "3. Or click \"Device Login\" above and enter the code at auth.openai.com.",
    ],
    stepsZh: [
      "1. 在服务器上通过 CLI 登录：在终端运行 \"codex login\"。",
      "2. 点击 \"📥 从 CLI 导入\" 自动读取 ~/.codex/auth.json。",
      "3. 或者点击上方的 \"设备码登录\" (Device Login) 并在 auth.openai.com 输入代码。",
    ],
    link: "https://chatgpt.com",
  },
  antigravity: {
    title: "Google Antigravity / Gemini",
    stepsEn: [
      "1. Easiest way: click \"📥 From CLI\" — server already has active token in ~/.gemini/antigravity-cli/antigravity-oauth-token.",
      "2. Clicking \"📥 From CLI\" instantly loads fresh credentials.",
      "3. Manual: paste session JSON or OAuth tokens and click \"Save token\".",
      "Note: \"Connect\" button requires custom Google client_id in plugin settings; use \"📥 From CLI\" for seamless login!",
    ],
    stepsZh: [
      "1. 推荐方式：点击 \"📥 从 CLI 导入\" — 服务器已保存 ~/.gemini/antigravity-cli/antigravity-oauth-token 会话。",
      "2. 点击 \"📥 从 CLI 导入\" 可即时加载最新的凭据与 refresh_token。",
      "3. 手动输入：将会话 JSON 或 OAuth access_token/refresh_token 粘贴至输入框并保存。",
      "注：\"连接\" 按钮需要自定义 Google OAuth Client ID，推荐直接使用 \"📥 从 CLI 导入\"！",
    ],
    link: "https://antigravity.google",
  },
}
