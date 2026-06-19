---
title: "Skipping USB interrupt polling for devices with no input reports"
description: "A HID/usbhid patch that stops the kernel polling interrupt IN endpoints on devices that have no input reports to deliver — the idea, and the review on linux-input."
published: 2026-06-19
tags: ["Linux kernel", "C", "HID", "USB", "open source"]
keywords: "usbhid, HID interrupt IN polling, linux-input patch, Linux kernel USB, no input reports, LKML review"
image: "/og-image.png"
draft: true
---

<!--
  DRAFT — hidden while `draft: true`. Publishes at
  /blog/skipping-usb-polling-with-no-input-reports/ once you set `draft: false`.
  Patch on lore: https://lore.kernel.org/linux-input/20260605113952.38435-1-yaseen@ghoul.dev/
  Tags so far (CONFIRM): Reviewed-by Denis Benato; Tested-by community.
  Status: submitted to linux-input, in review.
-->

## The idea

<!-- WRITE THIS: what interrupt IN polling is, why polling a device that has no
     input reports is wasted work, and what your patch changes. Plain-language —
     the "why this matters" (power? wakeups? interrupts?) is the hook. -->

## The review

<!-- WRITE THIS — the back-and-forth. This one picked up community Reviewed-by /
     Tested-by tags (Denis Benato and others — confirm). Walk through what the
     reviewers raised, what testing was done and by whom, and anything you had to
     rework. Community testing is a strong signal — show it. -->

## Where it stands

It's in review on the linux-input list — [the patch on lore](https://lore.kernel.org/linux-input/20260605113952.38435-1-yaseen@ghoul.dev/). I'll update this when there's news.
