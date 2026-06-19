---
title: "How I got started as an ASUS Linux dev"
description: "The path from running Linux on an ASUS ROG laptop to contributing to asusctl and landing a patch in the mainline kernel — how I got into the asus-linux project."
published: 2026-06-19
tags: ["Linux", "asus-linux", "open source"]
keywords: "asus-linux, asusctl, ASUS ROG Linux, getting started kernel development, first open source contribution, platform/x86"
image: "/og-image.png"
draft: false
---

## The laptop

I bought my ASUS ROG STRIX Scar 18 2025 a few months after the initial release. I used Windows 11 for a few months but having daily driven Linux before, it didn't take me long before I couldn't hold back my urge to install Linux on this new machine. However, a few issues cropped up. My laptop is a brand new model and the hardware (specifically the AniMe Matrix and the built-in LED lightbar) was not properly supported by any of the software I tried. I even ended up bricking the lightbar with OpenRGB and couldn't fix that even in Windows. This is where my hardware learning journey truly began. After some research, I stumbled upon the process of doing an EC Reset, which fixed my lightbar, but I still had to boot into Windows every time I wanted to change my keyboard lighting — which is, needless to say, not the most ideal setup.

## Finding asus-linux

I came across the asusctl project originally during my initial investigation into AniMe Matrix support on Linux. However, at the time, using asusctl required installing the [linux-g14](https://gitlab.com/asus-linux/linux-g14) kernel from the asus-linux pacman repo, and I did not understand why. It raised too many questions for me including whether it was meant primarily for the ROG Zephyrus G14, and even if it was, I did not understand why a separate kernel package had to be shipped instead of just the kernel modules like the nvidia packages.[^1] I did still verify that it was legit and installed it, but as support for my device was not added at the time, it expectedly did not work for me. Thus began my venture into trying to reverse-engineer Armoury Crate on Windows and using Wireshark to capture the packets to make my own program or script to control my lightbar and the AniMe Matrix display.

[^1]: I do know why now. The linux-g14 kernel was a temporary kernel whose patches were modifying files that are already in the kernel's tree, unlike nvidia modules. Therefore, a base kernel with the asus-armoury patches applied was created until the patches were upstreamed and they're now merged into the mainline Linux kernel as well.

## The first contribution

I spent a full day on capturing Wireshark packets from Windows but I was genuinely having a hard time trying to decode it. It was on the very same day that a simple web search showed me [this issue](https://gitlab.com/asus-linux/asusctl/-/work_items/705) in the asusctl GitLab repository which was adding support for AniMe Matrix on my laptop model. To be perfectly honest, at the moment it felt like I had wasted quite some time on something that was already implemented when I saw this, but looking back now, I would say it is a necessary part of the process and without the digging and reverse-engineering and packet captures, I would likely have not understood the workings enough to make the contribution I did later. Ignoring the feeling of wasted time, I decided I still wanted to be a part of enabling support for this device and made [a comment](https://gitlab.com/asus-linux/asusctl/-/work_items/705#note_3005464934) volunteering to test it. If you went through that thread, you probably know by now that custom images and GIFs did not work — and I fixed that later. This happened in the ASUS Linux Discord channel (now Open Gaming Collective) in [this thread](https://discord.com/channels/725125934759411753/1461593399621587101). My full conversation of how I went through Windows files to find the matrix height and width as well as the process of mapping the matrix LEDs to their correct bytes is all in the same thread. It took me a few days of focused work to get the entire thing working.

## Going deeper

After the contribution of custom image and GIF support to the asusctl repository, Denis Benato (AKA NeroReflex, maintainer of asusctl and the asus-armoury kernel driver) and I were having a chat in the same thread about me wanting to get into low-level programming and how fun solving puzzles is, when Denis asked me if I would like to help out with some of his work, to which I naturally agreed. He also invited me into the Open Gaming Collective after, which was days before the Open Gaming Collective was announced officially.

## If you want to start too

I would say the best way to get started on any open source project is the same way anyone who already is a contributor does it. That is to find and fix issues. As FFmpeg said on X (Twitter): "Talk is cheap. Send patches." They weren't wrong with that. You can find and open as many GitHub issues as you want, but maintainers are stretched thin and the issue is most likely going to sit a while. On the other hand, if you learn to build that software on your own machine (usually following manual install instructions provided in README), and fix the issue yourself, test it, and send in a PR, that is all it takes to get started. It is also what makes a community. No open source project would push away a new contributor with a good PR without a good reason. Worst case, you may be asked to fix something before your PR can be merged. Naturally, being able to fix said issue is the criterion, which may take anywhere from a few days to months of learning and research into the specifics of that project, depending on the project and your skill level. But for anyone who wants to take that step, I would highly recommend doing that investigation, spending those few hours trying to trace that issue, and eventually you will be able to call yourself an open source developer.
