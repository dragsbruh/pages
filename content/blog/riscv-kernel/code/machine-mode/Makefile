AS=riscv64-elf-as
LD=riscv64-elf-ld

ASFLAGS=
LDFLAGS=-Tlinker.ld -nostdlib

boot.elf: boot.o
	$(LD) $(LDFLAGS) $^ -o $@

boot.o: boot.s
	$(AS) $(ASFLAGS) $< -o $@
