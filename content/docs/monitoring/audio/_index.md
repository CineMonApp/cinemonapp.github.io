---
title: Audio monitoring
description: Monitor and mix audio from cameras, interfaces, and media files.
weight: 20
---

Mix audio from capture devices, audio interfaces, and media files, with or without video. Use the mixer for source balance and monitoring, and audio scopes to check the signal.

{{< screenshot name="audio-monitoring-overview" alt="Mac Audio Mixer over the video picture, with a goniometer and spectrum analyzer" caption="Mix audio while monitoring video, or use audio sources on their own." >}}

## In this section

{{< section-pages >}}

## Start monitoring audio

1. Add a video source with audio, or choose **Add Source → Audio Input** or **Audio File** on **Home**.
2. Open **Scopes → Levels** to check that a signal is arriving. The basic Levels meter is free.
3. If you have access to the mixer, open **Mixer** to balance sources. Enable **MON** on a live input when you want to hear it.

## Signal flow

Audio passes through these stages:

1. **Sources** bring audio in. A source can be an audio capture device or interface, the audio paired with a video capture device, an Accsoon device, or the audio track of a media file. See [Audio Sources & Devices](/docs/monitoring/audio/sources/).
2. **Channel strips** in the mixer give each source its own fader, pan, mute, solo, and monitoring controls.
3. The **master bus** sums every channel into the final stereo output you hear and meter.
4. The **audio scopes** show levels, loudness, stereo phase, and frequency content.

## Tips

* The basic Levels meter is always free, so you can confirm you are getting signal without a Pack. The Audio Mixer and the advanced audio scopes are part of the PRO Audio Monitoring Pack.
* Audio source tags (A1, A2, A3... and V1A/V2A) identify the same source in the transport bar, mixer, and scopes. They follow the V1/V2 model introduced in [Video Input Options](/docs/monitoring/video/sources/).
