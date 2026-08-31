// Client half of @gz2016/dsh-plugin-image-picker. Hand-written, no build
// step - a hand-written client.js keeps the build graph simple for a small DOM patch.
//
// PROTOTYPE, not yet the final implementation - see the plan discussion
// this was built from. DSH's web client only supports paste and drag-and-
// drop for image attachments; file-picking is an explicit, documented v1
// scope exclusion upstream (.agents/notes/implemented/feature/2026-07-22-
// web-multimodal-image-input-and-durable-attachments.md in the
// deepseek-harness submodule), not a bug or something disabled here.
//
// Investigated the real slot wiring before writing this (not guessed):
// - `conversation.input.left`/`.right` (rendered inside InputBar's own
//   toolbar) give NO props path to add an image - only a session/input
//   snapshot and inputActions, which needs an already-minted
//   DraftAttachmentId, not a raw File. The File -> id minting method
//   (ConversationController.createDraftImages) is deliberately excluded
//   from the public IConversation service face.
// - `conversation.input.attachments` DOES receive the real
//   onAddImages(files) callback (the same intakeImages used by paste/
//   drop) - but it's currently occupied by DSH's own ComposerAttachments
//   component (the drag-drop overlay + thumbnail rail + lightbox), which
//   isn't exported for composition. Taking that slot over means fully
//   reimplementing that UI, not just adding a button to it.
//
// This prototype takes the cheaper path instead, explicitly to test
// whether it's viable before committing to the bigger rebuild: place a
// plain button via `conversation.input.left` (a real, safe slot
// registration - no DOM-selector guessing for placement), and on file
// selection, feed the files into the EXISTING attachment pipeline by
// synthesizing the same `drop` DragEvent packages/client/ui-attachment's
// ComposerAttachments already listens for at the document level
// (unconditional `document.addEventListener('drop', ...)`, gated only on
// `dataTransfer.types.includes('Files')` - confirmed by reading that
// listener directly). This leaves DSH's own rail/preview/lightbox UI
// completely untouched - the dropped-in files flow through the exact same
// code path a real drag-and-drop would.
//
// Known open question this prototype exists to answer: `DataTransfer`
// construction and `.items.add()` support is inconsistent on Safari and
// specifically unreliable on iOS Safari - untested until now. If it
// doesn't work reliably there, this approach should be abandoned in favor
// of properly reimplementing the attachment rail against
// `conversation.input.attachments` instead.
window.__ModuleLoader__.load({
  id: '@gz2016/dsh-plugin-image-picker',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports

    var ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'

    // Dispatches a synthetic drop carrying `files` at the document level -
    // the same event ComposerAttachments.tsx's own listener consumes for a
    // real drag-and-drop. dragenter/dragover precede it (harmless if
    // unneeded) in case any internal state depends on seeing them first,
    // not just the terminal drop.
    function dispatchSyntheticDrop(files) {
      var dt
      try {
        dt = new DataTransfer()
        for (var i = 0; i < files.length; i++) dt.items.add(files[i])
      } catch (e) {
        // DataTransfer construction / .items.add(File) unsupported here
        // (the exact Safari risk this prototype is testing for) - fail
        // loudly to the console rather than silently doing nothing, so a
        // failure is easy to spot while testing.
        console.error('[alice-image-picker] DataTransfer construction failed - synthetic drop unsupported in this browser', e)
        return false
      }
      var opts = { bubbles: true, cancelable: true, dataTransfer: dt }
      document.dispatchEvent(new DragEvent('dragenter', opts))
      document.dispatchEvent(new DragEvent('dragover', opts))
      document.dispatchEvent(new DragEvent('drop', opts))
      return true
    }

    function ImagePickerButton() {
      var React = require('react')
      var inputRef = React.useRef(null)

      var onChange = function (e) {
        var files = e.target.files
        if (files && files.length > 0) dispatchSyntheticDrop(files)
        // Reset so picking the same file again still fires onChange.
        e.target.value = ''
      }

      // Flat outline SVG, not an emoji - matches the mic button's own icon
      // (dsh-ears' MicrophoneIcon, node_modules/dsh-ears/lib/client.js):
      // 16x16 viewBox, stroke="currentColor", strokeWidth 1.4, fill none,
      // rounded caps/joins. A simple picture-frame glyph in the same
      // language (rounded-rect frame, a "sun" circle, a mountain fold).
      var icon = React.createElement(
        'svg',
        { 'aria-hidden': 'true', width: '16', height: '16', viewBox: '0 0 16 16', fill: 'none' },
        React.createElement('rect', {
          x: '2', y: '3', width: '12', height: '10', rx: '1.5',
          stroke: 'currentColor', strokeWidth: '1.4',
        }),
        React.createElement('circle', {
          cx: '6', cy: '6.5', r: '1.1', stroke: 'currentColor', strokeWidth: '1.4',
        }),
        React.createElement('path', {
          d: 'M3.5 11.5 6.5 8.5 8.5 10.5 11 7.5 12.5 9.5',
          stroke: 'currentColor', strokeWidth: '1.4', strokeLinecap: 'round', strokeLinejoin: 'round',
        }),
      )

      return React.createElement(
        React.Fragment,
        null,
        React.createElement('input', {
          ref: inputRef,
          type: 'file',
          accept: ACCEPT,
          multiple: true,
          style: { display: 'none' },
          onChange: onChange,
        }),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'alice-image-picker-button',
            'aria-label': 'Attach image',
            onClick: function () {
              if (inputRef.current) inputRef.current.click()
            },
          },
          icon,
        ),
      )
    }

    // Same "poll until the slots service shows up" approach as
    // dsh-plugin-mobile-ui's registerBrandMark - ctx.get('slots') reliably
    // returns undefined on the very first tick even though the service
    // exists moments later (confirmed live in that plugin, not assumed
    // true here too).
    function registerButton(ctx) {
      var attempts = 0
      var timer = setInterval(function () {
        attempts += 1
        var slots
        try {
          slots = ctx.get ? ctx.get('slots') : undefined
        } catch (e) {
          slots = undefined
        }
        if (!slots) {
          if (attempts >= 100) clearInterval(timer) // ~10s cap
          return
        }
        clearInterval(timer)
        // .right (not .left) - user asked for this button to sit directly
        // next to the mic button, which dsh-ears registers into .right
        // (docs/adr/0005-switch-to-dsh-ears-for-stt.md). .left renders on
        // the opposite end of the toolbar row (InputBar.tsx), before the
        // access-mode/plan chips - nowhere near the mic.
        slots.inject('conversation.input.right', function* () {
          yield slots.register({ name: 'conversation.input.right', id: 'alice-image-picker' }, ImagePickerButton)
        })
      }, 100)
      ctx.effect(function () {
        return function () { clearInterval(timer) }
      })
    }

    function apply(ctx) {
      var style = document.createElement('style')
      style.dataset.plugin = 'alice-image-picker'
      // Sizing/shape/color matched to the mic button's own rendered style
      // (computed live: 28x28px, border-radius 50%, color rgb(97,102,107))
      // rather than guessed - "Start voice input" in dsh-ears' own
      // VoiceRecognitionBar is the reference this was checked against.
      style.textContent = [
        '.alice-image-picker-button {',
        '  display: inline-flex; align-items: center; justify-content: center;',
        '  width: 28px; height: 28px; border-radius: 50%; border: none;',
        '  background: transparent; cursor: pointer;',
        '  color: var(--dsw-alias-label-secondary, rgb(97, 102, 107));',
        '}',
        '.alice-image-picker-button:hover { background: var(--dsw-alias-fill-hover, rgba(0,0,0,0.06)); }',
      ].join('\n')
      document.head.append(style)

      registerButton(ctx)

      ctx.effect(function () {
        return function () { style.remove() }
      })
    }

    exports.apply = apply
    return module.exports
  },
})
