---
title: "How I got started as an ASUS Linux dev"
description: "The story of my first ever open source contribution to asusctl and how I became part of ASUS Linux and Open Gaming Collective through it."
published: 2026-06-19
tags: ["Linux", "asus-linux", "open source"]
keywords: "asus-linux, asusctl, ASUS ROG Linux, getting started open source development, first open source contribution, platform/x86"
image: "/og-image.png"
draft: false
---

Nothing quite teaches you about embedded controllers like bricking the lightbar on the brand new expensive laptop you just bought, right? I believe many adventures start with something cursed like this, and much like this one, end up with something unexpected. In this case, this is the story of how I became part of [ASUS Linux](https://asus-linux.org/) and the [Open Gaming Collective (OGC)](https://opengamingcollective.org/).

## The laptop

I bought my ASUS ROG STRIX Scar 18 2025 a few months after the initial release. Now if you're anything like me and have daily driven Linux before, you know the itch. A month or two of Windows 11 was all I could take before I installed Linux on this new laptop. However, a few issues cropped up. My laptop is a brand new model and the hardware (specifically the AniMe Matrix and the built-in LED lightbar) was not properly supported by any of the software I tried. I even ended up bricking the lightbar with OpenRGB and couldn't fix that even in Windows. This is where my hardware learning journey truly began. After some research, I stumbled upon the process of doing an EC (embedded controller) reset, which fixed my lightbar, but I still had to boot into Windows every time I wanted to change my keyboard lighting — which is, needless to say, not an ideal setup.

## Finding asus-linux

I came across the asusctl project originally during my initial investigation into AniMe Matrix support on Linux. However, at the time, using asusctl required installing the [linux-g14](https://gitlab.com/asus-linux/linux-g14) kernel from the asus-linux pacman repo, and I did not understand why. It raised too many questions for me including whether it was meant primarily for the ROG Zephyrus G14, and even if it was, I did not understand why a separate kernel package had to be shipped instead of just the kernel modules like the nvidia packages.[^1] I did still verify that it was legit and installed it, but as support for my device was not added at the time, it expectedly did not work for me. Armoury Crate on Windows was all that worked. So surely it should be possible to work out what Armoury Crate is doing and try to do the same thing on Linux, right? There's only one way to find out: boot Windows 11 and use Wireshark to capture the packets, see what it's sending. I'd never done this before so it was a steep wall to climb.

[^1]: I do know why now. The linux-g14 kernel was a temporary kernel whose patches were modifying files that are already in the kernel's tree, unlike nvidia modules. Therefore, a base kernel with the asus-armoury patches applied was created until the patches were upstreamed and they're now merged into the mainline Linux kernel as well.

## The first contribution

I spent a full day on capturing Wireshark packets in Windows but I was genuinely having a hard time trying to decode it. It was on the very same day that a simple web search showed me [this issue](https://gitlab.com/asus-linux/asusctl/-/work_items/705) in the asusctl GitLab repository which was adding support for AniMe Matrix on my laptop model. To be perfectly honest, at the time it felt like I had wasted quite some time on something that was already implemented when I saw this, but looking back now, I would say it is a necessary part of the process and without the digging and reverse-engineering and packet captures, I would likely have not understood the workings enough to make the contribution I did later. Ignoring the feeling of wasted time, I decided I still wanted to be a part of enabling support for this device and made [a comment](https://gitlab.com/asus-linux/asusctl/-/work_items/705#note_3005464934) volunteering to test it. If you went through that thread, you probably know by now that custom images and GIFs did not work — and I fixed that later. This happened in the ASUS Linux Discord channel (now Open Gaming Collective) in [this thread](https://discord.com/channels/725125934759411753/1461593399621587101). My full conversation about how I went through Windows files to find the matrix height and width, and the process of mapping the matrix LEDs to their correct bytes, is all in the same thread. It took me a few days of focused work to get the entire thing working.

## Going deeper

After the contribution of custom image and GIF support to the asusctl repository, Denis Benato (AKA NeroReflex, maintainer of asusctl and the asus-armoury kernel driver) and I were having a chat in the same thread about me wanting to get into low-level programming and how fun solving puzzles is, when Denis asked me if I would like to help out with some of his work, to which I naturally agreed. He also invited me into the Open Gaming Collective after, which was days before the Open Gaming Collective was announced officially.

## If you want to start too

I would say the best way to get started on any open source project is the same way anyone who already is a contributor does it. That is to find and fix issues. As FFmpeg said on X (Twitter): "Talk is cheap. Send patches." They weren't wrong with that. You can find and open as many GitHub issues as you want, but maintainers are stretched thin and the issue is most likely going to sit a while. On the other hand, if you learn to build that software on your own machine (usually following manual install instructions provided in README), and fix the issue yourself, test it, and send in a PR, that is all it takes to get started. It is also what makes a community. No open source project would push away a new contributor with a good PR without a good reason. Worst case, you may be asked to fix something before your PR can be merged. Naturally, being able to fix said issue is the criterion, which may take anywhere from a few days to months of learning and research into the specifics of that project, depending on the project and your skill level. But for anyone who wants to take that step, I would highly recommend doing that investigation, spending those few hours trying to trace that issue, and eventually you will be able to call yourself an open source developer.
