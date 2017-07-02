#!/usr/bin/env perl

use strict;

my $license = <<EOI;
/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

EOI

my $mode = "scan";

my $input = "";
my $comment = "";
my $licenseBlock = 0;

while (<>) {
    if ($mode eq "scan") {
        chomp;

        next unless $_;

        $_ .= "\n";

        if (m/^\s*\/\*\s*$/) {
            $mode="comment";

            $comment = $_;
            $licenseBlock = 0;
            next;
        }

        $input .= $_;
        $mode = "code";
        next;
    }

    if ($mode eq "comment") {
        $comment .= $_;
        $licenseBlock = 1 if (index($_, "GNU General Public License") >= 0);

        if (m/^\s*\*\/\s*$/) {
            $input .= $comment unless $licenseBlock;
            $mode = "scan";
        }

        next;
    }

    if ($mode eq "code") {
        $input .= $_;
        next;
    }
}

print $license;
print;
print $input;
print;
