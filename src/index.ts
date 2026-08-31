/**
 * Host half - no-op discovery anchor, same role as dsh-plugin-mobile-ui's
 * own host half. All real behavior is client-side (see client.js);
 * ctx.clientModules's scan reads the host Loader's registered entries, not
 * npm install state, so this apply() needs to exist purely for that scan to
 * discover this package's dsh.client declaration and bundle/serve
 * ./src/client.js.
 */
import type { Context } from '@deepseek-ai/cordis'

export function apply(_ctx: Context): void {}
