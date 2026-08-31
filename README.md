# DSH | dsh-plugin-image-picker | A real "attach image" button for the composer

DSH's own web client only supports adding an image by paste or drag-and-drop (v1 scope, per its own upstream design notes). That's a real gap on touch devices with no drag-and-drop, and on iOS specifically, where there's no clipboard-image paste at all - there was simply no way to attach a photo from a phone. This plugin adds a plain file-picker button to the composer toolbar that does.

## What it looks like

![Composer toolbar with the image-attach button](./screenshots/image-picker.png)

Tapping it opens the native file picker; the chosen image is fed through the exact same attachment path DSH's own paste/drop handling already uses (a synthetic `DataTransfer`/drop event), so there's no separate code path to trust - if paste-and-drop works today, this works the same way.

## How it integrates with DSH

A pure client-side patch (`src/client.js`, no build step): registers a composer toolbar seat and, on file selection, synthesizes the same drop event DSH's own composer already handles. No host-side plugin behavior.

## Install

```sh
dsh plugin --profile web add @zg2017/dsh-plugin-image-picker
```

No configuration needed.

---
*Unofficial project, independently developed and maintained by a community member. Not affiliated with or endorsed by DeepSeek.*
