---
title: writing a tiny kernel in risc-v
description: a really tiny one that barely does things, with zero dependencies, in c

sort_by: date
template: blog/index.html
page_template: blog/post.html

extra:
  hero: /heroes/riscv-kernel/hero.jpg
  dropdown:
    - subsections
    - pages
---

yes here i will document the process of me writing a bare-metal risc-v kernel.
i still cant call it risc-five but whatever.

the kernel will run on qemu's [virt](https://www.qemu.org/docs/master/system/riscv/virt.html) machine
and can hopefully have graphics and userspace before gta 5.

specifically, we will be using rv64 without opensbi for the funnies.
