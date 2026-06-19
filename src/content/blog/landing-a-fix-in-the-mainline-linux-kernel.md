---
title: "Landing a fix in the mainline Linux kernel"
description: "How a mini-LED control bug on 2024+ ASUS laptops got diagnosed, fixed, and merged into the mainline Linux kernel — and what it took to get a patch through LKML review."
published: 2026-06-19
tags: ["Linux kernel", "C", "platform/x86", "open source"]
keywords: "Linux kernel contribution, asus-armoury, platform/x86, mini-LED, LKML patch, how to contribute to the Linux kernel, asus-wmi"
image: "/og-image.png"
draft: true
---

<!--
  This is a DRAFT — it won't appear on the site while `draft: true` above.
  Write your post below. When you're happy, change `draft: true` to `draft: false`
  and it'll publish at /blog/landing-a-fix-in-the-mainline-linux-kernel/.
  The headings below are a suggested skeleton — rewrite freely. The first three
  sections are pre-filled from the verified facts; edit to taste.
-->

There's a patch in the mainline Linux kernel with my name on it: [`d2d2e7c`](https://github.com/torvalds/linux/commit/d2d2e7c8fb37b27301ee5c8343b2f7037efc6ea6), a fix to the `asus-armoury` driver, merged by platform-driver-x86 maintainer Ilpo Järvinen. Here's the bug, the fix, and what it took to get it upstream.

## The bug

`asus-armoury` is the kernel driver that exposes ASUS laptop firmware controls — including the mini-LED backlight mode — to userspace over WMI. On 2024-and-newer hardware (what the firmware calls MODE2), it was broken in two directions: reading the current mini-LED mode decoded a literal `0` instead of the value the firmware actually returned, and writing a new mode sent the raw index straight through instead of the value the firmware expected. The result was a control that reported the wrong state and rejected valid writes with `-EINVAL`.

## How I found it

<!-- WRITE THIS: was it your own ROG/Strix laptop? a community bug report? what
     symptom did you actually see, and how did you trace it to the WMI devstate
     path rather than somewhere else? -->

## The fix

The firmware speaks in a mapped set of values, not raw indices. The fix routes both directions through that mapping: decode the firmware's value on read, and translate the index to the firmware's value on write.

<!-- WRITE THIS (optional): specifics about the mapping table / functions, or
     leave it at the level above. -->

## Getting it merged

This one went in cleanly — no revisions, no back-and-forth. Ilpo applied it as-is.

<!-- WRITE THIS (optional): a clean first-try merge is still worth a line or two —
     what you did up front (testing, matching the subsystem's conventions, a clear
     commit message) that made it an easy yes. Save the review war stories for the
     two patches below that actually got back-and-forth. -->

## What I took away

<!-- WRITE THIS: 2-3 honest takeaways — reading an unfamiliar C driver, matching
     a subsystem's conventions, the patience the process needs. -->

---

*Two more patches are in review on the lists — one gating PPT power writes behind the active fan curve, and a usbhid change that skips interrupt polling on devices with no input reports. More on those if they land.*
