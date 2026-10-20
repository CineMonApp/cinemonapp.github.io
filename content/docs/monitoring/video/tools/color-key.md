---
title: Color Keyer
description: "Preview a color backdrop as transparency and check the key."
weight: 80
---

The **Color Keyer** performs chroma keying: it replaces a sampled backdrop color, typically green or blue, with transparency. The tool is labeled **Color Key** in CineMon. Use it to preview a scene that will be composited in post production.

Available with the CineMon **PRO Video Monitoring Pack** or a CineMon **PRO Pass** subscription.

{{< screenshot name="color-key-comp" alt="Keyed subject against transparency and a reference background in Wipe mode" caption="The keyed subject appears against transparency on the left and a reference background on the right." >}}

Use a lower threshold to identify uneven backdrop color or lighting. Raise the threshold to remove more of the background and inspect foreground composition and lighting. [Zebras](/docs/monitoring/video/tools/zebras/) and [Spot Meter](/docs/monitoring/video/tools/spot-meter/) can also help check lighting consistency.

## Basic use

Long-press the **Color Key** button in the **Assist Toolbar** to open or close its options drawer. On Mac, you can also select the chevron beside the button. Select the tool button to turn the effect on or off.

1. With the tool off, use the color picker to sample the backdrop.
2. Turn on the tool, then adjust **Threshold**, **Smoothness**, and **Despill** while inspecting the subject edges.

## Options

{{< screenshot name="color-key-options" alt="Color Key options drawer with key color, threshold, smoothness, and despill controls" max-width="555px" >}}

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| Key Color | Color | Green | The color to key out. |
| Threshold | `0`–`0.3` | Low | Controls the sensitivity of the keying effect. |
| Smoothness | `0`–`0.2` | Low | Blurs matte edges for gentler transitions. |
| Despill | `0`–`0.5` | Low | Desaturates the background color from matte edges. |

## Related topics

* [Zebras](/docs/monitoring/video/tools/zebras/)
* [Spot Meter](/docs/monitoring/video/tools/spot-meter/)
