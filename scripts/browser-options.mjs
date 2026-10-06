// Edge remains the default. Cloud/Linux runners may select an installed browser.
export const browserOptions = {
  channel: process.env.LUMEN_BROWSER_EXECUTABLE ? undefined : (process.env.LUMEN_BROWSER_CHANNEL || 'msedge'),
  executablePath: process.env.LUMEN_BROWSER_EXECUTABLE,
  args: process.env.LUMEN_BROWSER_ARGS ? JSON.parse(process.env.LUMEN_BROWSER_ARGS) : undefined,
};
