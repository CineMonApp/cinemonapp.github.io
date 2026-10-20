---
title: Video playback
description: Review media with playback controls, frame stepping, shuttle speeds, and embedded timecode.
weight: 20
---

Play recorded media files with the same monitoring tools used for live sources.

{{< screenshot name="video-playback-transport" alt="Video playback controls below a paused source" caption="The floating transport shows the source, playback and frame-step buttons, timecode, and scrubber." >}}

## Open and play a file

1. On **Home**, choose **Add Source → Media File**. You can also drag a media file onto CineMon, or use **File → Open Media as Source…** (`⌘O`) on Mac or on iPad with a hardware keyboard.
2. Select **Monitor** on its source card to view the picture.
3. Select **Play** on the transport bar. Drag the scrubber to review another point, or use the frame-step buttons for a closer look.
4. If several playable sources are loaded, use the source picker on the transport bar to choose which one to control.

## Transport controls

When you load a video or audio file, a floating transport bar appears at the bottom of the Monitor. The bar contains a source pill, playback buttons, a scrubber, and timecode labels.

### Buttons

The transport bar provides five buttons:

| Button | Action |
|--------|--------|
| Reverse (backward arrow) | Play in reverse. Press again to increase reverse speed: -1x, -2x, -4x, -8x. Pressing past -8x loops back to -1x. |
| Previous Frame | Step back one frame. |
| Play / Pause | Toggle playback. |
| Next Frame | Step forward one frame. |
| Forward (forward arrow) | Play forward. Press again to increase speed: 1x, 2x, 4x, 8x. Pressing past 8x loops back to 1x. |

A loop toggle also appears on the bar. When loop is on, playback restarts from the beginning when it reaches the end.

The current shuttle speed (for example, "2x" or "-4x") is shown beneath the forward or reverse button when active.

### Scrubber

The scrubber shows your position within the file. You can drag anywhere along the track, not just the thumb, to seek.

When you begin dragging, playback pauses automatically. When you release, playback resumes from the released position at the same rate and direction it was running before the drag. If you were in reverse or at a shuttle speed other than 1x, that rate is preserved.

The thumb stays at your released position while the seek completes.

### Compact layout

The scrubber appears inline when the bar has enough horizontal room. On a narrow Monitor (or a small window on Mac), the bar switches to a compact two-row layout: the scrubber moves to its own row above the buttons. The scrubber is always visible in the compact layout regardless of width.

<!-- TODO(verify): confirm the iOS scrubber-in-full-row threshold is 620 pt and Mac is 560 pt -->

### Visibility

The transport bar auto-hides while the file is playing and reappears on interaction:

- **iPad:** the bar hides after 3 seconds of inactivity. Tap the Monitor to show or hide it.
- **Mac:** the bar appears whenever the pointer is inside the window, then fades out 3 seconds after the pointer leaves. Hovering over the bar itself pauses the countdown.

When the file is stopped or paused, the bar stays visible until you dismiss it.

You can drag the bar up or down to reposition it within the Monitor. It clamps at the top and bottom edges.

### Source picker

The leading pill identifies the source controlled by the transport bar (for example, "V1" or "A1"). If you have more than one playable source loaded, the pill becomes a menu so you can switch between them. The current source is marked with a checkmark, and a small TV icon marks whichever source is currently on the monitor. Changing the transport target does not change which source is displayed on the Monitor.

## Playback timecode

When a video file contains an embedded timecode track, the transport bar reads the file's starting timecode and offsets all displayed times from it. The elapsed timecode label reflects the actual recorded timecode, not time-from-zero. Drop-frame timecode is supported and detected from the file.

Files without a timecode track display elapsed time in `HH:MM:SS` format. Files with a video track show frame numbers in `HH:MM:SS:FF` (or `HH:MM:SS;FF` for drop-frame).

For details on how CineMon records and handles timecode, see [Timecode](/docs/recording-media/timecode/).

## Playback speed and audio

At all shuttle speeds, forward and reverse, audio routes through CineMon's audio mixer at the playback rate. Pitch correction (spectral time-domain scaling) is applied automatically, so audio remains intelligible at 2x or higher. At reverse rates, audio plays in reverse at the corresponding speed.

<!-- TODO(verify): confirm whether audio is audible at -2x and higher reverse rates, or whether it is muted above a certain reverse rate -->

## Keyboard shortcuts

On Mac, or on iPad with a hardware keyboard, the following shortcuts work while the transport bar has keyboard focus. The bar takes keyboard focus automatically when it appears, and the keys act on the source named in its source pill, which is not necessarily the source on the monitor. Selecting another control that takes keyboard focus, such as the sidebar list, suspends these shortcuts until you select the transport bar again. These shortcuts are not available in the inline transport strips on Home source cards.

| Shortcut | Action |
|----------|--------|
| `Space` | Play / Pause |
| `J` | Increase reverse shuttle speed (-1x, -2x, -4x, -8x, then loops back to -1x) |
| `K` | Pause |
| `L` | Increase forward shuttle speed (1x, 2x, 4x, 8x, then loops back to 1x) |
| `Left Arrow` | Step back one frame |
| `Right Arrow` | Step forward one frame |

## Compare mode

When you are using Compare mode to monitor two sources side by side, the transport bar's source pill shows which player the bar is controlling. You can switch targets independently of which source is on the Monitor. See [Monitoring and Compare](/docs/monitoring/video/compare/) for more about Compare mode.

## Recent files

Reopen recently accessed files from the recent-file list. Set the number of entries in [App Settings](/docs/customize/settings/).

## Scrub to a frame

For video files, scrubbing and frame-step controls land on frame boundaries. The timecode readout identifies the frame at the playhead, so small scrub movements do not suggest a new frame before the picture changes.
