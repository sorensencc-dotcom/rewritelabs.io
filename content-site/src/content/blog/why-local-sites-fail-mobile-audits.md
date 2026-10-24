---
title: "Why Local Service Sites Fail Mobile Audits"
date: 2026-10-24
description: "We ran mobile audits across local contractor websites. The median score was 31 out of 100, driven by uncompressed photos, dead chat widgets, and redundant trackers."
topics: ["web-performance", "field-notes"]
draft: false
---

We pulled mobile performance audits across seventy local trade and service websites last month. Plumbers, HVAC outfits, roofers, and electricians across Florida and the Southeast.

The results were dismal. The median mobile Lighthouse performance score was 31 out of 100. Over half of the sites took longer than six seconds to load their main content over a standard mobile connection.

When a homeowner has a burst pipe or an air conditioner that quit in July, they do not wait six seconds. They hit back and tap the next search result.

The slow speeds were not caused by complex web applications or custom animations. Almost every slow site suffered from the same four mechanical mistakes.

## Camera roll uploads straight to production

The largest single drag on load time was uncompressed imagery.

On more than forty sites, the hero image was a raw 12-megapixel photograph uploaded straight from a field technician's phone. A 4032 by 3024 pixel JPEG weighs roughly six to eight megabytes. Browsers on a phone display that image in a container that is 390 pixels wide.

The browser still has to download all eight megabytes over cellular data, decode the massive file into memory, and downscale it. That single asset accounted for over seventy percent of the total page weight on half the sites we audited.

Resizing that image to 1200 pixels and converting it to WebP drops the file size from 7.2 megabytes to 140 kilobytes with no visible difference on a mobile display.

## Dead chat widgets

Thirty-eight of the seventy sites had an embedded live chat widget floating in the bottom-right corner.

These widgets are heavy. The vendor scripts typically download between 800 kilobytes and 1.4 megabytes of JavaScript, initialize socket connections, and parse tracking bundles before the visitor interacts with the page.

We sent a test message to twenty of them on a Tuesday afternoon asking for a service quote. Only two responded within fifteen minutes. Twelve sent an automated form response asking for an email address. Six never answered at all.

Contractors pay fifty to two hundred dollars a month for a script that slows down their site to collect forms their staff rarely monitors in real time. A plain phone button and a clean contact form load instantly and convert better.

## Tracking tag accumulation

Small business sites collect tracking scripts like barnacles.

An agency adds a Google Tag Manager container in 2021. Two years later, a marketing consultant adds a Meta pixel directly to the header. A year after that, a pay-per-click specialist installs a second Tag Manager snippet to run call tracking.

On one plumbing site, we found:
- Two separate Google Tag Manager containers.
- A legacy Universal Analytics script that Google retired in 2023.
- Two Meta pixel trackers firing duplicate pageview events.
- Hotjar recording session heatmaps that nobody on the team had logged in to check since 2024.

None of these tags help the customer book a service call. Together, they added 2.1 seconds of main-thread execution time on a budget Android phone.

## Keyword stuffing replaces clear answers

Beyond raw load times, the text on these pages actively works against the reader.

Many sites still rely on early-2010s search optimization tactics. They bury contact details under paragraphs of repetitive text: "If you need AC repair in Anytown, our Anytown AC repair team provides the best AC repair services for Anytown homeowners."

A visitor on a phone wants three things immediately:
1. Does this company handle my problem?
2. Do they service my neighborhood?
3. What phone number can I call right now?

Hiding those answers under walls of repetitive keyword text frustrates visitors and drives up bounce rates.

## What works instead

The sites that scored in the 90s on mobile audits were almost aggressively simple.

They run on static HTML and minimal CSS. Their hero images are compressed and sized for mobile screens. Their phone number sits at the top of the screen in large, tappable text with a clear emergency callout.

Building a fast local business site does not require complicated optimization. It requires saying no to uncompressed camera uploads, cutting abandoned third-party widgets, and putting the phone number where the customer can reach it.
