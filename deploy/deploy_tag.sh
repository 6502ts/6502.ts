#!/bin/bash

set -e

DEST="`pwd`/6502ts.github.io"
REVISION=`git rev-parse --short HEAD`

source "`pwd`/deploy/setup_ssh.sh"

git clone git@github.com:6502ts/6502ts.github.io.git "$DEST"

pushd typedoc
../tools/fixup_typedoc.sh
popd

rm -fr "$DEST/typedoc"
cp -rv typedoc "$DEST"

pushd 6502ts.github.io

git config user.email "golem@nowhere.org"
git config user.name "Travis Golem"
git config --global push.default current

git add typedoc
git commit -a -m "bumped typedoc to $REVISION, my master"
git push

popd
