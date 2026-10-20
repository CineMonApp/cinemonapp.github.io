---
title: Recording and capture
description: Save snapshots and video clips, choose capture formats, and review recording issues.
weight: 10
---

CineMon saves still frames and video clips from the monitored video. Choose a capture type:

- **Snapshot** saves the current frame as a still image. Snapshot is available with the CineMon **PRO Video Monitoring Pack** or a CineMon **PRO Pass** subscription.
- **Record** captures a video clip with audio, using the selected raw source or processed program image. Recording is available with the CineMon **PRO Recording Pack** or a CineMon **PRO Pass** subscription.

Both save into your Media Library with the active slate's metadata.

{{< screenshot name="recording-capture-overview" alt="Snapshot, slate, and record controls above the monitor image" caption="Snapshot and recording controls are grouped along the top of the Monitor." max-width="400px" >}}

## Capture your first clip or still

1. Add a source on **Home**, then select **Monitor** on its card.
2. Open **Settings → Capture** to choose the recording codec or snapshot format and capture mode.
3. If you use slates, check the active slate's production details and destination.
4. Select **Record** to start a clip and again to stop, or double-tap the monitor on iPad or double-click it on Mac to take a snapshot.
5. Open **Media Library** to preview the result.

Use [snapshot capture modes](#snapshot-capture-modes) or [recording capture modes](#recording-capture-modes) to decide which processing is saved.

## Choose what to capture

Outside Compare, capture uses the active video source. In Compare, **Processed Image** captures the combined program image. For recordings, this remains the Compare composite even when V2 is selected; **Raw Input** records the selected source instead. **Monitor View** snapshots capture the visible comparison with its monitor overlays. See the capture modes below before choosing what to save.

You need an active video source to record or take a snapshot. With no source connected, the capture controls are disabled.

### Capture settings

Capture formats live in **Settings → Capture**. From there you choose:

- **Video codec** for recordings: H.264, HEVC (H.265), three 10-bit HEVC options (HEVC 10-bit, HEVC 4:2:2 10-bit, HEVC 4:4:4 10-bit), and the ProRes family (Proxy, LT, 422, 422 HQ, 4444, 4444 XQ). H.264 and every HEVC option also offer a compression-quality setting; ProRes does not, because it is visually lossless and profile-driven. The 10-bit HEVC options appear only on devices whose encoder supports them.
- **Audio codec** for recordings: uncompressed PCM (16/24/32-bit), AAC, or Apple Lossless.
- **Image format** for snapshots: HEIC, JPEG, PNG, or TIFF. HEIC and JPEG add a compression-quality setting.
- **Record** source for video clips: **Raw Input** or **Processed Image** (see below).

The Capture screen also holds the timecode settings. See [Timecode & Sync](/docs/recording-media/timecode/).

### Bit depth

The 10-bit HEVC options keep more tonal precision than 8-bit, which matters most for grading and log footage. Only sources and processing that carry more than 8 bits benefit from it.

When you record the **Processed Image** with any codec deeper than 8 bits (the 10-bit HEVC options and the whole ProRes family), CineMon prepares the picture at full precision before encoding, to retain the available tonal precision. Banding in skies and gradients is reduced as a result. Raw Input recordings pass the source through untouched either way, and there is nothing to configure: it follows the codec you pick.

### Color tagging

Recordings include color metadata for editing and grading applications. Check the imported color interpretation against your intended workflow, especially when recording camera log formats.

**Raw Input** takes keep the source's own tags untouched, so an Apple Log source stays identified as Apple Log. **Processed Image** takes are tagged with the space CineMon actually produced (Rec. 709, SMPTE C, P3 D65, or Rec. 2020); if a Color Space Transform is applied, the tag describes its output. Camera and log gamuts with no standard code point are tagged Rec. 709 in the container, which is the long-standing convention, and the pixels themselves are not converted.

> Apple Log can only be recorded truthfully from **Raw Input**, with Apple Log-tagged source buffers. If you select Apple Log and try to record the Processed Image, CineMon refuses to start and asks you to choose a standard Rec.709-gamma profile instead.

## Take a snapshot

{{< pro-pill >}} Taking a snapshot requires the **PRO Video Monitoring Pack** or a **PRO Pass**.

Double-tap the monitor on iPad or double-click it on Mac to capture the current frame. See [monitor gestures](/docs/start-here/interface/#monitor-gestures) for the full list.

CineMon flashes the monitor to confirm the capture, then writes the still to your Media Library using the format chosen in **Settings → Capture**.

### Snapshot capture modes

A snapshot can save one of four things. Choose the mode in **Settings → Capture**:

- **Raw Input** saves the original signal exactly as it arrives from the source, before any processing.
- **Processed Image** (the default) saves the monitor image with the input profile, crop, orientation, desqueeze, color key, image adjustments, and LUT applied. Overlay assist tools (guides, focus assist, zebras, false color) are not captured.
- **Monitor View** captures the monitor view exactly as shown on screen, including floating scopes, guides, and Compare mode, without the surrounding toolbars. This is a screen capture saved at screen resolution, so its colors reflect the on-screen (display-managed) image. For exact signal color, use Processed Image instead.
- **All at Once** saves all three as a set: the raw input, the processed image, and the monitor view. They share one timestamp so they sort together. Raw and processed come from the same frame; the monitor view is a separate screen grab, so on moving video it can show a slightly different moment.

The monitor toolbars blink away for the instant of a Monitor View grab, which is expected. The capture excludes the toolbars, the window's close/minimize/zoom buttons and sidebar toggle, the mouse pointer, and anything belonging to other apps such as notification banners.

Monitor View and All at Once both use screen recording, so on {{< mac >}} CineMon asks for Screen Recording permission the first time you use them, in an **Enable Screen Recording?** prompt. You grant it in System Settings, and CineMon must be relaunched afterwards.

### Snapshot filenames and metadata

Every still records how it was captured, both in its metadata and in its filename:

| Mode | Filename suffix |
|------|-----------------|
| Raw Input | `_raw` |
| Processed Image | none |
| Monitor View | `_screen` |

The **Snapshot Source** is written into the file's metadata, displayed as a read-only row in the Media Library inspector, and available as a Smart Collection filter. Use it to filter stills by capture mode. See [Media Library](/docs/recording-media/library/).

If only part of an **All at Once** set saves, a brief notice appears over the monitor telling you how many made it (for example, "Saved 2 of 3 snapshots").

## Record a clip

{{< pro-pill >}} Recording a video clip requires the **PRO Recording Pack** or a **PRO Pass**.

1. Connect a video source and make it the active source.
2. Select **Record** control to start. CineMon writes a clip using the chosen recording capture mode, including audio from the mixer.
3. Select **Record** again to stop. The finished clip is saved to your Media Library.

While a recording is in progress, some controls are locked. You cannot change the Media Library destination mid-take, and you cannot switch the active video source. On {{< ipad >}}, sending CineMon to the background stops the recording.

After you stop a take, CineMon writes any remaining accepted media data before finalizing the file. Long takes may need a short wait to finish saving.

### Recording capture modes

Like snapshots, recordings can save either the raw or the processed signal. Set the **Record** source in **Settings → Capture**:

- **Raw Input** records the original signal exactly as it arrives from the source, before any processing.
- **Processed Image** records the monitor image with the input profile, crop, orientation, desqueeze, color key, image adjustments, and LUT applied. Overlay assist tools are not recorded.

In Compare, **Processed Image** records the composite, not two separate source files. Both sources must be ready before recording starts. **Raw Input** records only the selected source. For processed snapshots and recordings, the framing crop applies only when the **Framing** tool is enabled and Frame A is active; merely configuring a frame does not crop the saved image.

### Audio drift correction

Separate audio and video devices can run on slightly different clocks. Over long takes, that difference can cause audio to drift out of sync with the picture.

Set **Drift Correction** in **Settings → Capture**, under **Audio**:

| Setting | What it does |
|---------|--------------|
| **Off** (default) | Preserves continuous audio. Slow clock drift between independent devices is not corrected, so the recorded audio is exactly what arrived. |
| **Discrete** | Keeps long takes in sync using small, smoothed corrections spread across the take. |

Leave it **Off** to preserve the incoming audio, for example when syncing against a separate sound recording in post. Choose **Discrete** for long single-source takes that need to stay in sync on their own.

The setting is locked into a take when you press Record, so you cannot change it mid-recording.

> This corrects *audio clock* drift. It is unrelated to timecode. For how CineMon follows an external timecode source and reports its drift while freewheeling, see [Timecode & Sync](/docs/recording-media/timecode/).

### The recording border

While recording, a red border frames the picture, excluding letterbox and pillarbox bars. It remains visible above framing guides and the fullscreen audio waveform.

### Dropped-frame indicator

If CineMon has to drop frames during a recording, usually under heavy system load, a yellow warning appears beside the timecode pill. It stays visible after the take ends until you dismiss it or start a new recording. Select it to see frames recorded, frames dropped (split into those lost in **Processing** and those lost at the **Encoder / disk**), and the drop rate. It also suggests a remedy for whichever dominated: a lower monitor resolution or fewer processing stages when the losses were in processing, a lighter codec or faster destination when they were in writing.

### Review Recorded File

If a finished take has an issue that needs review, CineMon saves the file and then shows a **Review Recorded File** notice. The notice identifies what to check in the saved file before delivery. Typical cases are an audio dropout, several dropped video frames, a source frame rate or color description that changed mid-take, or a timecode sample that could not be written. A single isolated dropped frame does not trigger it.

### If a take is interrupted

If something interrupts capture mid-take, such as another app taking the camera, thermal pressure, or the system resetting media services, CineMon closes the take immediately and saves what it has. One message explains what happened, beginning "Recording stopped because...", and tells you whether the take was saved up to that point.

If a stop cannot complete cleanly, CineMon leaves the partial file on disk rather than deleting it, so you keep the footage you already shot.

When you are only monitoring rather than recording, interruptions do not raise an alert: the picture recovers on its own.

<!-- TODO(verify): confirm the exact label/icon of the Record control on the toolbar (code uses SF Symbol "record.circle"). -->
<!-- TODO(verify): confirm there is no separate "arm" step before recording; code shows a single start/stop toggle (toggleRecording). -->

> In External LTC timecode mode, recording will not start until the external timecode source is locked. See [Timecode & Sync](/docs/recording-media/timecode/).

## Where files go

Recordings and snapshots are saved into your **Media Library**, inside a production folder. By default this is the app's internal storage (Documents/Productions in the app's sandboxed folder). You can point the Media Library at a different folder, including an external drive.

In **Settings → Capture** you can also choose how files are arranged within a production:

- **Flat** keeps all media together in the production folder.
- **Subfolders** separates videos and stills into their own folders.

If your chosen library is offline (for example, a disconnected drive), CineMon falls back to internal storage and preserves your configured destination so it is used again once the drive returns.

For more on managing libraries, see [Libraries](/docs/customize/organizers/libraries/).

## Slates and metadata

The active **Slate** supplies capture metadata, including scene, take, reel, camera, and keywords. Captures also inherit its recording settings.

Slates are part of the **PRO Recording Pack**. Without the Recording Pack, captures use a temporary session Slate (labeled "Snapshots", tagged "SNP") and internal storage. Saved Slates are preserved and restored once you add the Recording Pack.

For more on slates and their fields, see [Slates](/docs/recording-media/slates/).

## Review captures as sources

By default, CineMon adds your most recent capture back into the source list so you can review it right away. Captures stay in the Media Library and are not added to Recent Files. You can turn off automatically adding the last capture as a source in Settings.
<!-- TODO(verify): exact label/location of the "add last capture as source" preference (key: addLastCaptureAsSource, default on). -->

To play back saved clips, see [Video Playback](/docs/monitoring/video/playback/).

## Feature access

| Capability | Access |
|------------|--------|
| Snapshot (still capture) | PRO Video Monitoring Pack or PRO Pass |
| Record (video clip capture) | PRO Recording Pack or PRO Pass |
| Slates and Libraries organizers | PRO Recording Pack or PRO Pass |
