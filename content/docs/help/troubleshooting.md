---
title: Troubleshooting
description: Find checks for missing picture, unavailable devices, silent audio, unexpected color, and missing recordings.
weight: 10
---

Start with the symptom below. Change one setting at a time and check the result so you can identify what resolved the problem.

## No picture on the monitor

1. Confirm that a source is assigned to **V1** or **V2**. Adding a source and selecting it for monitoring are separate actions.
2. Choose **Monitor V1** or **Monitor V2** from the **Sources** menu. The transport bar can control a different file from the one currently on the monitor.
3. For a camera feed, check the camera's video output and capture-device connection. An HDMI-to-USB capture adapter is required for HDMI input; a USB-to-HDMI display adapter sends video in the opposite direction.
4. Open a known media file as a source. If it displays correctly, continue checking the live source and its connection.

See [Video input options](/docs/monitoring/video/sources/) for source setup and [Video playback](/docs/monitoring/video/playback/) for transport controls.

## A device is missing or unavailable

- Check whether the device type is supported on your platform. Accsoon SeeMo and dual built-in-camera monitoring are iPad features.
- For an Accsoon device on iPad, check **Enable Accsoon SeeMo Devices** in [Settings → General](/docs/customize/settings/#general).
- After connecting a USB audio device on iPad, allow time for it to appear. Check whether another source or the External LTC reader is already using the active device.
- A channel marked **(Timecode)** is reserved by External LTC and cannot also be selected as a mixer input. Other channels on a discrete multichannel interface can remain available.
- On Mac, after reconnecting a disconnected audio interface, reopen the audio source settings to reconnect the source.

See [Platform differences](/docs/help/platforms/#audio-devices) and [Audio sources](/docs/monitoring/audio/sources/).

## Audio meters move but nothing is audible

1. Check the output device or route in [Settings → Audio](/docs/customize/settings/#audio). On Mac, apply any pending hardware changes with **Apply**.
2. In the [Audio Mixer](/docs/monitoring/audio/mixer/), check the source fader and master output level.
3. Clear unintended **Mute (M)** or **Solo (S)** selections. Soloing another channel can silence the source you want to hear.
4. For a microphone-style input, enable **MON** if you want to hear it live. With MON off, the input can still feed the recording path.
5. For paired video audio, check **AFV**. When enabled, that audio is muted unless its video source is the one being monitored.

If no meters move, check the selected input device and channel in [Audio sources](/docs/monitoring/audio/sources/), and confirm playback is running for a media-file source.

{{< screenshot name="settings-audio-route" alt="Output Route control in Audio settings on iPad" caption="Check Output Route when the meters move but you cannot hear the mix." >}}

## The color or contrast looks wrong

1. Check the camera's output format, then compare it with **Input Gamma** and **Input Gamut** in the source's [Input Profile](/docs/customize/organizers/input-profiles/).
2. Check whether the camera already applies a display conversion. Applying another log-to-display transform to that signal can give an incorrect result.
3. Review **Calibration LUT** and **Color Space Transform** in the Input Profile, then the [Display LUT](/docs/monitoring/video/tools/display-lut/) and image adjustments in the active preset. Confirm that each LUT receives the gamma and gamut it expects.
4. If the picture and scopes seem inconsistent, check **Tap Signal At** in [Scope Settings](/docs/monitoring/scope-settings/#scope-settings). The scopes may be measuring the input before the displayed adjustments.

Switching presets does not change the Input Profile assigned to the source. See [Color management](/docs/monitoring/video/color-management/).

## A recording or snapshot is missing

1. Wait for the take to finish saving after stopping recording. Finalizing a long take can take a moment.
2. Check the active slate's custom recording settings. A library override takes priority over the App Default library.
3. Check **Internal Storage** as well as the intended destination. CineMon falls back to internal storage when the selected library is offline, while preserving that destination for later use.
4. In the [Media Library](/docs/recording-media/library/), select the relevant library and production, then clear Smart Collection filters. Filters also limit the files available in Quick Look.
5. Check whether **Use Subfolders** is enabled in [Settings → Capture](/docs/customize/settings/#capture). Videos and stills may be in separate subfolders within the production.

If a recording was interrupted, read the message stating whether the take was saved. A **Review Recorded File** notice means a file was saved but needs inspection. See [Recording and capture](/docs/recording-media/recording/).

Removing a source with its **×** button or forgetting a library does not delete recordings. Add the source or library again to use it. In contrast, **Delete** in the Media Library permanently deletes files; clearing filters or re-adding a source cannot restore them. See [Delete media files](/docs/recording-media/library/#delete-media-files).

## Recording will not start

Confirm there is an active video source and that the **PRO Recording Pack** or **PRO Pass** is available. In External LTC mode, the timecode source must be locked before recording can begin. See [Timecode and sync](/docs/recording-media/timecode/).

## More help

Open **Settings → Support** to find support links and the app version and build. When reporting a problem, include your platform, source device or file type, the steps that reproduce it, and any message CineMon shows.
