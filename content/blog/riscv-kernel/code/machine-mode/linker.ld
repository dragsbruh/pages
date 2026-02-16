SECTIONS
{
  . = 0x80000000;

  .text :
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
