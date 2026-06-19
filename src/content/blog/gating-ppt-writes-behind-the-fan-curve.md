---
title: "Gating PPT power writes behind the fan curve"
description: "A platform/x86 patch for the asus-armoury driver — why writing power limits while a custom fan curve is active is unsafe, and what the LKML review surfaced."
published: 2026-06-19
tags: ["Linux kernel", "C", "platform/x86", "open source"]
keywords: "asus-armoury PPT, platform/x86 patch, fan curve, asus-wmi power tuning, LKML review, Linux kernel patch review"
image: "/og-image.png"
draft: true
---

<!--
  DRAFT — hidden while `draft: true`. Publishes at
  /blog/gating-ppt-writes-behind-the-fan-curve/ once you set `draft: false`.
  Patch on lore: https://lore.kernel.org/platform-driver-x86/20260519181155.46044-1-yaseen@ghoul.dev/
  Reviewers (CONFIRM): Ilpo Järvinen, Mario Limonciello. Status: v3, in review.
-->

## What the patch does

<!-- WRITE THIS: in plain terms — what PPT (power tuning) writes are, why doing
     them while a custom fan curve is active is a problem, and what your patch
     gates/guards. Keep it understandable to someone who isn't an ASUS-firmware
     expert. -->

## The review

<!-- WRITE THIS — the good part. This patch went through back-and-forth on LKML
     (it's at v3). Walk through it: what the reviewers (Ilpo Järvinen / Mario
     Limonciello — confirm) pushed back on, what you changed between v1→v2→v3, and
     any disagreement and how it resolved. The honest back-and-forth is exactly
     what shows you can take review and operate upstream. -->

## Where it stands

It's still in review on the platform-driver-x86 list — [v3 on lore](https://lore.kernel.org/platform-driver-x86/20260519181155.46044-1-yaseen@ghoul.dev/). I'll update this once it lands.
