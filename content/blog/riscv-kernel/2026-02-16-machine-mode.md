---
title: starting up in machine mode
description: qemu virt drops us in machine mode, and here you will know how to enter supervisor mode

extra:
  hero: /heroes/riscv-kernel/2026-02-16-machine-mode.jpg
---

## setting up the stack pointer

make sure the linker script has space reserved for the two:

```ld
  .stack (NOLOAD) : ALIGN(16)
  {
    __stack_bottom = .;
    . += 16K;
    __stack_top = .;

    . += 4K;
    __global_pointer = .;
  }
```

16K stack is enough for a small kernel.

```gas
    la       sp, __stack_top
    la       gp, __global_pointer
```

## overview

qemu virt machine drops us into machine mode (m-mode), and the first step really is to quickly
get into supervisor mode (s-mode) for most kernels.

on a higher level, switching to supervisor mode from here is to:

- delegate necessary traps to s-mode and setup handler
- disable physical memory protection for s-mode
- set previous privilege (`MPP`) to s-mode
- set return address (`mepc` register) to kernel main function
- return to "_previous privilege_" (s-mode here) using `mret` instruction

## machine trap delegation

traps are normally all handled by m-mode at this stage, but for our kernel we want them to
be handled at s-mode. this can be done by redirecting necessary traps using their delegation
registers.

### traps - exceptions

exceptions are synchronous and caused by the current instruction being executed. such as page faults,
ecalls, etc, and delegation is done by `medeleg` register.

each bit in the `medeleg`, if set, delegates a particular exception cause to s-mode.

exception causes include stuff like:

- load page fault
- store page fault
- illegal instruction
- s-mode ecall
- u-mode ecall
- etc...

```gas
    li       t0, 0xffff
    csrw     medeleg, t0
```

above code delegates _all_ exceptions to s-mode, you may want to skip stuff like m-mode and s-mode ecalls etc
later, but this is fine for now.

### traps - interrupts

traps are asynchronous, they are caused by hardware.

there are really 3 interrupts, and a variant of those 3 interrupts for each privilege level.

- **MSIP/SSIP:** software interrupts, ex: inter-cpu interrupts
- **MTIP/STIP:** timer interrupts
- **MEIP/SEIP:** external interrupts, ex: [PLIC](https://docs.riscv.org/reference/hardware/plic/_attachments/riscv-plic.pdf)

```gas
    li       t0, 0x222
    csrw     mideleg, t0
```

this will delegate all interrupt handling to s-mode. note that u-mode interrupts are extremely rare and
i recommend ignoring them unless its a requirement.

### setting up trap handler

`stvec` cs register should contain the s-mode trap handler address:

```gas
    la       t0, stvec_handler
    csrw     stvec, t0
```

i like to zero these registers too:

```gas
    csrw     sscratch, 0
    csrw     satp, 0
```

to enable all interrupts in s-mode:

```gas
    csrw     sie, 0x7
```

## disable physical memory protection

i had so much trouble figuring out why i couldnt access memory, turns out m-mode mommy needs to disable
physical memory protection to give s-mode full access here:

```gas
    li       t0, -1
    csrw     pmpaddr0, t0

    li       t0, 0x0F
    csrw     pmpcfg0, t0
```

here, `-1` enables all bits, and since `pmpaddrN` stores `addr >> 2`, thats the highest memory address.

and `pmpcfg0` in above code has `0x0F` which is RWX on all memory in `TOR` (top-of-range) mode,
so those two paired gives s-mode RWX access on all the memory.

## preparing to jump to s-mode

we need to set the MPP bits in `mstatus` register to match s-mode, which is set the two MPP bits to `01`

```gas
    csrr     t0, mstatus

    li       t1, ~(3 << 11)       # clear MPP so the first MPP bit is always off
    and      t0, t0, t1

    li       t1, (1 << 11)        # set MPP bits to s-mode
    or       t0, t0, t1

    csrw     mstatus, t0
```

then store the _"return"_ address in `mepc` register, basically our kernel main function.

```gas
    la       t0, kmain
    csrw     mepc, t0
```

note that, kmain should be a noreturn function if using c or other languages.

## jumping to s-mode

```gas
    mret
```

as simple as that, if all goes well congrats you are in s-mode!

## testing

im using this `linker.ld`

```ld
SECTIONS
{
  . = 0x80000000;

  .text
  {
    *(.text .text.*)
  }

  .stack (NOLOAD) : ALIGN(16)
  {
    __stack_bottom = .;
    . += 16K;
    __stack_top = .;

    . += 4K;
    __global_pointer = .;
  }
}
```

with this `Makefile`

```Makefile
AS=riscv64-elf-as
LD=riscv64-elf-ld

ASFLAGS=
LDFLAGS=-Tlinker.ld -nostdlib

boot.elf: boot.o
	$(LD) $(LDFLAGS) $^ -o $@

boot.o: boot.s
	$(AS) $(ASFLAGS) $< -o $@
```

### full code

```gas
    .section .init

_init:
    la       sp, __stack_top
    la       gp, __global_pointer

    li       t0, 0xffff
    csrw     medeleg, t0

    li       t0, 0x222
    csrw     mideleg, t0

    la       t0, stvec_handler
    csrw     stvec, t0

    csrw     sscratch, 0
    csrw     satp, 0

    csrw     sie, 0x7

    li       t0, -1
    csrw     pmpaddr0, t0

    li       t0, 0x0F
    csrw     pmpcfg0, t0

    csrr     t0, mstatus

    li       t1, ~(3 << 11)       # clear MPP so the first MPP bit is always off
    and      t0, t0, t1

    li       t1, (1 << 11)        # set MPP bits to s-mode
    or       t0, t0, t1

    csrw     mstatus, t0

    la       t0, kmain
    csrw     mepc, t0

    mret

stvec_handler:
    csrr     t0, sepc

    addi     t0, t0, 4

    add      a1, a1, 1
    li       a0, 0xdeadbeef

    csrw     sepc, t0
    sret

kmain:
    li       a0, 0xdeadbeef

.loop:
    ecall
    j        .loop
```

if this works we should see `0xdeadbeef` in `a0` register and `a1` should be ever incrementing.

### results

```sh
qemu-system-riscv64 -machine virt -bios none -kernel boot.elf -monitor stdio -display none
```

after running for like 5 seconds, on `info registers`, we see:

```
x10/a0   00000000deadbeef
x11/a1   000000008c6672f0
```

it works!

you might want to revisit this page and make delegations or memory stricter, perhaps, but this is perfect as-is if you ask me.

## resources

- <https://docs.riscv.org/reference/isa/priv/machine.html>
- <https://github.com/riscv-software-src/opensbi/blob/master/lib/sbi/sbi_hart.c>

> [!TIP]
> the opensbi implementation i linked was a godsend to me to switch from m-mode to s-mode
> consider going thru it
