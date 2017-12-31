#!/bin/bash

# For some impish reason, typedoc insists on generating HTML files whose names
# start with leading underscores. Unfortunately, jekyll refuses to include files
# that start with an underscore.
#
# This script strips the underscore and replaces
# all occurences in the generated output.

files=`find . -name '_*.html'`

if test -z "$files"; then
    echo nothing to do...
    exit
fi

for file in $files; do
    dir=`dirname "$file"`
    base=`basename "$file"`
    mv "$file" "$dir/${base##_}"
done

sedexpr=""

for file in $files; do
    base=`basename "$file"`
    sedexpr="$sedexpr -e 's/$base/${base##_}/g'"
done

SED=gsed
test -z `which gsed` && SED=sed

for file in `find . -name '*.html'`; do
    bash -c "$SED -i $sedexpr \"$file\""
done

echo "done!"