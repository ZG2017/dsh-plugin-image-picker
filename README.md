# DSH | dsh-plugin-image-picker | A real "attach image" button for the composer

DSH's own web client only supports adding an image by paste or drag-and-drop (v1 scope, per its own upstream design notes). That's a real gap on touch devices with no drag-and-drop, and on iOS specifically, where there's no clipboard-image paste at all - there was simply no way to attach a photo from a phone. This plugin adds a plain file-picker button to the composer toolbar that does.

## What it looks like

![Composer toolbar with the image-attach button](./screenshots/image-picker.png)

Tapping it opens the native file picker; the chosen image is fed through the exact same attachment path DSH's own paste/drop handling already uses (a synthetic `DataTransfer`/drop event), so there's no separate code path to trust - if paste-and-drop works today, this works the same way.

## How it integrates with DSH

A pure client-side patch (`src/client.js`, no build step): registers a composer toolbar seat and, on file selection, synthesizes the same drop event DSH's own composer already handles. No host-side plugin behavior.

## Install

Requires DeepSeek Harness **0.2.1-alpha.2 or newer** (see [DSH 0.2 update](#dsh-02-update)).

**From the app:** Plugins → install `@gz2016/dsh-plugin-image-picker`. Installing from the Plugins page also turns the bundle on.

**From the CLI:**

```sh
dsh plugin --profile web add @gz2016/dsh-plugin-image-picker
```

`dsh plugin add` only runs `pnpm add`. Also add `"@gz2016/dsh-plugin-image-picker"` to `dsh.profile.bundles` in `~/.dsh/profiles/web/package.json`, then restart. DSH 0.2 loads a profile package only when it is selected as a bundle; it then applies this package's `cordis.patch.yml`.

No configuration needed.


## DSH 0.2 update

DeepSeek Harness 0.2 (0.2.1-alpha.2) changed several plugin APIs this package used, so the 0.1 release does not load on it: DSH disables it at startup because its peer versions are pinned to 0.1.1-rc.2. This release targets 0.2.1-alpha.2.

What changed:

- Client `inject` list: the removed `@deepseek-ai/dsh-client-runtime` is replaced by the packages that now provide each service (`slots` → `dsh-client-ui-renderer`).
- `peerDependencies` now name the 0.2.1-alpha.2 packages.
- Ships a `cordis.patch.yml` bundle layer (`dsh.bundle.patch`). DSH 0.2 only loads profile packages that are selected bundles, so install instructions changed (see [Install](#install)).

---
*Unofficial project, independently developed and maintained by a community member. Not affiliated with or endorsed by DeepSeek.*
