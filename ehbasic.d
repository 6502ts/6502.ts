load ehbasic.bin 0xC000
break-on
break 0xFF94 print_welcome
break 0xFF9A poll
boot
