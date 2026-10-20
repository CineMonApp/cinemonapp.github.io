---
title: Release notes
description: The complete history of CineMon features, improvements, and fixes.
weight: 40
---

## v2.0
### Highlights
CineMon v2.0 adds multi-source video monitoring, audio mixing, and recording on iPad and Mac. The main additions are:

- **Two simultaneous live video sources:** run V1 and V2 on iPad or Mac, switch the active monitor, and show both together in Reference Mode for camera matching and shot comparison.
- **Multi-source audio:** mix inputs with different sample rates, bit depths, and channel layouts, with six audio scopes and ITU-R BS.1770 loudness metering.
- **Professional capture:** 10-bit HEVC and ProRes recording, digital slates, and External LTC with Jam Sync and freewheel.
- **Set-to-post metadata:** carry slate fields and color tags into post-production, with Media Library tools for reviewing and organizing takes.
- **Hardware and processing:** USB capture and Accsoon devices, plus compatible DeckLink and UltraStudio devices on Mac through Blackmagic's CoreMedia IO webcam adapter, with a rebuilt 16-bit Metal video pipeline.

See [What's new](/docs/start-here/whats-new/) for a release overview and links to the feature guides.

### New features
- Two simultaneous video sources, V1 and V2, on both iPad and Mac: two live inputs or a live input and a reference file, with direct switching of the active monitor
- Reference Mode displays both sources together using wipe, side-by-side, top-and-bottom, or overlay views; Processed Image recording captures the composite, while Raw Input records the selected source
- Compatible Blackmagic Design DeckLink and UltraStudio devices on Mac through the CoreMedia IO webcam adapter included with Blackmagic Desktop Video
- Audio sources have no fixed count beyond device processing capacity, and can mix different sample rates, bit depths, and channel layouts, with or without video
- Audio Monitoring: a mixer with per-source channel strips (faders, mute, solo, pan, MON, AFV) and a master bus
- Audio scopes: Levels (free peak metering; PRO RMS bars and history), Loudness, Goniometer, Oscilloscope, Band Spectrum, and FFT Spectrum
- Loudness metering to ITU-R BS.1770: momentary, short-term, integrated, LRA, and true peak, with EBU R128 / ATSC A/85 / generic delivery profiles, custom targets, and a session history graph
- Configurable audio meter scales: Production dBFS, IEC Type I, DaVinci Resolve, and Logic Pro
- Recording and Capture: record clips and snapshots, with per-slate recording settings and library destinations
- Capture modes: record Raw Input or Processed Image; snapshots additionally offer Monitor View and All at Once, which saves all three snapshot versions as a set
- H.264, 10-bit HEVC (including 4:2:2 and 4:4:4 on supported encoders), and ProRes recording, with processed takes rendered at full precision
- Color tagging on every recording, so DaVinci Resolve and Final Cut Pro interpret clips correctly on import with no manual input-color-space step
- Snapshot source recorded in metadata and filenames (`_raw`, `_screen`), and filterable as a Smart Collection
- Slates: a flippable clapperboard card holding production metadata on the front and per-slate recording settings on the back, saved as `.cmslate` files
- Media Library: browse recordings, snapshots, and imported media in a thumbnail grid with an inspector, Quick Look previews you can page through, import from Photos or Files, and Smart Collections that filter by slate metadata
- Post-capture editing: mark a Good Take, set a star Rating, and edit Notes and Keywords per file after recording
- Industry-standard metadata: slate fields are embedded in QuickTime and XMP keys, so clips open in DaVinci Resolve and Final Cut Pro with Scene, Take, Reel, Camera, and Notes already filled in
- Libraries: configurable media libraries with an App Default and per-production destinations
- Timecode and Sync: Record Run, Free Run, and External LTC modes, with Jam Sync, freewheel, drop-frame support, and a playback timecode track
- Dual-camera monitoring on supported iPads
- Composition Guides tool with Grid and Golden Spiral overlays, with 0 to 20 grid lines per axis so you can show vertical-only or horizontal-only guides
- New Color Palette tool: extracts the shot's dominant colors as proportional swatches with their share of the frame, with a pause for per-color RGB/hex inspection and copy
- New 3D Preview tool: monitors stereoscopic material as an anaglyph through red/cyan, green/magenta, or amber/blue glasses, from packed side-by-side or top-bottom sources or a two-camera V1/V2 rig, with Blend and Difference QC views, convergence, and an alignment ruler
- New Exposure tool: a global EV shift merged with the Test Strip overlay, replacing the Image Adjust exposure slider and the standalone Test Strip tool
- Tap Signal At: Zebras, False Color, and Spot Meter each gained a Source/Output control for where they read the signal, matching the Scopes
- New False Color modes: Stops, Skin Tone, and White Balance
- False Color as its own panel type, so you can watch a false-color view in one panel while the program image stays clean
- Custom False Color gradients for IRE mode, importable and exportable as `.cmgradient` files
- Input Profiles: save and reuse per-source input calibration (log curve, gamut, Color Space Transform, and calibration LUT)
- Spot Meter Signal mode, with the previous behavior now named Light
- New input log profiles: Z CAM Z-Log2, Apple Log 2, and Kinefinity KineLOG3, with the Apple Wide Gamut and Kinefinity Wide Gamut color spaces
- iCloud sync for your configuration library, so presets, slates, LUTs, gradients, and settings follow you across devices
- New PRO Packs: PRO Video Monitoring, PRO Audio Monitoring, and PRO Recording, plus the all-access PRO Pass
- New PRO Bundles: the PRO Video+Audio+Recording Bundle (all three Packs), and the Audio + Recording Upgrade for existing Video Pack owners

### Enhancements
- Wipe position, angle, and opacity are adjusted on one on-image guide: drag the picture to position the split, the curved-arrow handle to rotate, and the wedge to adjust opacity. Angle snaps to 0°, ±45°, and ±90°; double-tap on iPad or double-click on Mac to reset the corresponding control
- Wipe controls fade after three seconds of inactivity and hide while zoomed. Pinching over the guide zooms without leaving an accidental wipe edit
- Compare Toolbar supports floating controls and a Wipe Settings popover for narrow windows. Compare mode and wipe settings are restored when returning to Monitor or relaunching, provided both sources start
- Unsaved preset changes offer Save and Switch, Discard and Switch, and Cancel
- Spot Meter probes remain anchored to the image through window resizing, zoom, and pan. Offscreen probes have edge buttons to bring them back into view; zooming reduces the sampled image area while Single Pixel remains one pixel
- Pinch zoom follows its starting point, pan stays within the picture, and zoom/pan persist across leaving Monitor. Crop-to-zoom scopes follow the visible region, including split Compare views
- Recent Files separates video/images from audio, with independent limits and Clear Recents actions. Captures, Photos imports, and Media Library files no longer displace external-file history
- Video transport scrubbing and frame steps land on frame boundaries
- Levels history defaults to 30 seconds; graticule color affects the Levels and Loudness history graphs rather than their meter scales
- Redesigned OS 26 "Liquid Glass" toolbars and a new floating transport bar
- Rearrangeable toolbars and a Feature Manager (the Toolbars organizer)
- Remapped monitor gestures: double-tap on iPad or double-click on Mac to take a Snapshot, pinch to zoom up to 12x (using a trackpad on Mac), and swipe (or use a hardware keyboard) to cycle presets
- Trackpad support on Mac for hiding toolbars, cycling presets, and panning a zoomed image, matching the equivalent touch gestures on iPad
- New **1 Over 2** and **2 Over 4** multi-view layouts, and a consistent layout vocabulary: Single, Side by Side, Over-Under, Quad, 1 Over 2, 2 Over 4
- Layout dividers now track the drag precisely from where you grabbed them, and double-tapping a divider on iPad or double-clicking it on Mac re-centers it
- Multi-source picker with V1/V2 and A1/A2 source tags, plus source reordering
- Per-source hardware input gain and per-source recording sync offset in the mixer
- A dropped-frame indicator while recording
- Focus Peaking rebuilt: fine detail such as hair and cloth weave now marks reliably, plus a Threshold control in both modes to keep grain and noise from being marked, and numeric readouts on every slider
- High-contrast Contrast mode for Focus Peaking, with neutral halos instead of colored fringing
- Goniometer auto-gain and adjustable decay
- A new menu bar organized around the V1/V2 source model, with Sources, Presets, and Tools menus and single-key monitor shortcuts
- Redesigned Home screen: a sources workspace with video and audio columns, source cards, an inspector, and drag-to-reorder
- A Display setting for **Floating Liquid Glass Toolbars**, on by default, with a classic solid-bar layout when you turn it off
- An **Auto-close sidebar** setting that closes the sidebar once you pick a destination
- An audio **Drift Correction** capture setting, Off or Discrete, for keeping long takes in sync when audio and video run on separate clocks
- **Advanced LTC Alignment**, a global calibration that offsets external LTC against the picture by frames, milliseconds, or samples, for rigs where timecode lands a consistent amount off
- A redesigned False Color gradient editor: full-width, with a Stop Detail row, stop-by-stop stepping, and typed IRE values to two decimal places
- Capture devices that deliver a different mode than the one selected now say so, in an alert and a standing note on the source
- Automatic orientation correction for built-in iOS cameras
- Accsoon integration now includes a master enable switch and input monitoring (MON) on the receiver's embedded audio
- Drag and drop for video and image files, plus audio-only file sources

### Performance and reliability
- Processed Compare recordings retain the composite when V2 is selected
- Source-tap False Color and Zebras stay on V1 within the comparison; output analysis continues to cover the composite
- Processed captures apply the framing crop only when Framing and Frame A are active
- Rebuilt video engine for lower latency and reduced power use, with a smoother, more responsive interface under load
- 16-bit video pipeline to reduce banding
- Faster, lighter video scopes
- The monitor now clears when a source stops, fails, or its capture session is interrupted, instead of holding the last frame
- Disabled monitor toolbar controls now read as disabled
- Recordings with a timecode track no longer drop frames
- Stopping a take now finishes writing everything already accepted before finalizing, and a stalled stop leaves the partial file on disk rather than deleting it
- A **Review Recorded File** notice after a take flags anything worth checking before delivery, without discarding the take
- Interrupted takes close and save what they have, with one plain-language explanation of the cause
- Capture errors are described by cause instead of generic system boilerplate
- Monitor View snapshots exclude the toolbars, window chrome, the pointer, and other apps' windows and banners
- The recording border now frames the picture rather than the letterbox area, and stays above guides and the waveform
- Correct free-space reporting for external drives on iPad
- Numerous rendering and playback reliability fixes

## v1.7.1
### Highlights
v1.7.1 fixes a snapshot export issue introduced in v1.7.0 on iPads running OS 18.x.

### Bug fixes
- Fixed bug that prevented the opening of the Snapshots export dialog on iPads running OS 18.

## v1.7.0
### Highlights
CineMon v1.7.0 updates the interface for iOS/iPadOS 26 and macOS 26 (Tahoe), with a complete set of menu commands for iPad users with a hardware keyboard. It also adds a 1x2 layout (top/bottom), updated presentation sheets for the CineMon PRO Store and iPad app settings, a Liquid Glass app icon, and a new startup screen image.

### New features
- Added a 1x2 layout option for stacking two viewers top/bottom
- iPad now has a full menu bar and keyboard shortcut commands (OS26+)

### Enhancements
- Updated the overlay sheet UI for several screens (app settings, CineMon PRO Store, Video Monitoring feature guide).

### Bug fixes
- Fixed custom aspect ratio pop-over bug in the Framing Guide options drawer

## v1.6.0
### Highlights
CineMon v1.6.0 now supports Accsoon SeeMo devices on iPad. This has been one of the most popular user requests since the app was announced. In addition to UVC video sources, you can now use a SeeMo, SeeMo 4K, or SeeMo Pro as input sources in CineMon running on iPad. The Accsoon SeeMo family of devices combine video input capture and an NP-style battery port in a compact form factor.

To enable Accsoon devices:
1. Open the app settings and select the new Sources Tab
2. Turn on "Enable Accsoon SeeMo Devices"
3. A new Accsoon section will be added in the Video Sources pane
4. A connected SeeMo device will appear in the new section
5. Tap the power button to start SeeMo video

### New features
- Added Support for Accsoon SeeMo devices

### Bug fixes
- Recent files list was not being properly refreshed when files changed

## v1.5.0
### Highlights
CineMon v1.5.0 introduces movable and resizable framing guides and Crop Views. To get started, make sure you have the Viewer visible in one of the screen panels, then open the Framing options bar to reveal the new frame edit UI. Select which frame you want to edit (A or B) and turn it on. Drag a frame to reposition it. You can also use pinch-to-zoom, or drag from the corners or sides to resize it uniformly around the center. Use the lock button on the Framing options bar to constrain the aspect ratio of the guide. Once you have your guides customized, sized, and positioned, you can turn on the Framing Guides tool to overlay them in the viewer.

v1.5.0 also introduces a new layout view type to display a cropped version of the main image controlled by the framing guides. Just select Frame A or Frame B as the view type for any screen panel. In a Grid layout, use two crop views side by side to preview different aspect ratios simultaneously.

This version also introduces luma range controls for the Vectorscope, which allow you to decide which subset of luma values to display. You can select from All (the default), Low, Mid, and High, and use additional controls to tune the low and high ranges.

There is now also a global app setting for controlling how the option bars interact with the main layout area. They can overlay it (traditional) or stack on top/bottom.

### New features
- Framing guides can now be moved and resized
- New view types for displaying frame A/B crops of the main image
- Vectorscope luma range controls

### Enhancements
- Global app setting for tool option bars layout options

## v1.4.0
### Highlights
Introducing View Layouts! CineMon v1.4.0 includes a brand new layout engine inspired by your own suggestions. People have been asking for a way to show the image viewer in one of the 4-Up view quadrants. You can now right-click (on a Mac)/long-press (on an iPad) on any viewport to select from a list of view types, including Source, Viewer, R/G/B/A Channels, and Scopes. You can also resize the viewports by dragging the dividers. There is also a new 2x1 (side-by-side) layout. To switch layouts use the Layout Menu on the Status Toolbar (next to the Scopes buttons), or the Window menu on the Mac menubar.

The rebuilt display stage improves 10-bit source rendering and reduces processor/GPU load and memory use.

Additional enhancements include updated menu items on Mac, and enhanced Focus Peaking and Image Overlay implementations. Loaded reference images will now auto-resize to fit the current source dimensions.

### New features
- New layout engine with single, 2x1, and 2x2 grids, resizable and configurable viewports
- R/G/B/A channel views
- Source view
- New high-performance display stage

### Enhancements
- New icons for menu items on the Mac and layout view options
- New Focus Peaking implementation
- New Image Overlay implementation with auto-resize snapshots

## v1.3.0
### Highlights
CineMon v1.3.0 introduces a new exposure assist tool called Test Strip. It was inspired by photochemical printing and the process of exposing adjacent strips of photo paper to progressively longer times to fine tune the desired exposure. The new tool breaks up the image into a series of vertical or horizontal strips that have their exposure adjusted in constant increments. Compare the strips to preview a range of exposure values. To work accurately, Test Strip requires the image's Gamma curve to be correctly configured in the preset settings.

### New features
- Test Strip assist tool for at-a-glance exposure adjustment evaluation

### Bug fixes
- Zebras were not being initialized to default state

## v1.2.1 / v1.2.0
### Highlights
CineMon v1.2.1 can now transform the calibrated input signal’s Gamma and Color Space to a different combination. This is typically used to convert from the camera’s scene-referred space (such as ARRI LogC4) to a display-referred gamma/gamut (such as Rec.709 or P3) for preview. LUTs are often used for this purpose but the Color Space Transform (CST) performs a precise mathematical conversion using the manufacturer’s specifications. You can still apply a display LUT after the CST. Other new features in v1.2.1 include new color adjustment tools (temperature, tint, hue), and the ability to activate both Zebra modes simultaneously. It also includes various enhancements and optimizations to existing features.

### New features
- Color Space Transform function with support for 21 gamma curves and 16 color spaces.
- New color adjustment controls for temperature, tint, and hue
- Support for simultaneous Zebra modes

### Enhancements
- Platform-specific UI improvements to the Presets Sidebar
- New RGB Overlay Waveform implementation that is less GPU intensive
- Improved UI control slider performance, especially on Mac
- Optimized pixel buffer format for video playback
- Minor change to the Zebras tool icon
- Increased the Vectorscope trace brightness upper bound
- Added Save and Revert Preset menu options and keyboard shortcuts for Mac
- Expanded hit box and improved layout of media playback controls

### Bug fixes
- Fixed overlapping frame buffering during camera authorization at app start

## v1.1.1
### Highlights
CineMon v1.1.1 adds Tetrahedral interpolation for LUTs. This mode renders higher quality images (most noticeably in subtle gradients) but requires higher GPU utilization, which contributes to slightly faster battery drain. It also allows iPads to use up to 65 point LUTs. You can set the interpolation type for the Calibration LUT and the Display LUT independently in the Preset Settings sidebar.

This version also adds Forward and Backward (1x, 2x, 4x, 8x) video playback controls by pressing the buttons to cycle through the speed modes. On Macs, you can also use the JKL keys for Back/Pause/Forward.

### New features
- Tetrahedral Interpolation option for LUTs
- Support up to 65 point LUTs on iPad using Tetrahedral Interpolation
- Fast forward/rewind video playback with new controls

### Enhancements
- Added new app setting to enable/disable swipe-to-cycle Presets
- Enhanced video playback quality by switching pixel buffer formats
- Added long-press gesture to open/close tool options bars (in addition to swipe)

### Bug fixes
- Fix a bug where video will always auto-play on iPad app start, regardless of auto-play setting

## v1.0

Initial release.
