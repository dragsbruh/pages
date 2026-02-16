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
