#!/bin/bash

set -e

DEST="`pwd`/6502ts.github.io"
REVISION=`git rev-parse --short HEAD`

source "`pwd`/deploy/setup_ssh.sh"

git clone git@github.com:6502ts/6502ts.github.io.git "$DEST"

rm -fr "$DEST/dev" "$DEST/stellerator"
cp -rv web "$DEST/dev"
cp -rv build/stellerator "$DEST"

pushd 6502ts.github.io

git config user.email "golem@nowhere.org"
git config user.name "Travis Golem"
git config --global push.default current

git add dev stellerator
git commit -a -m "bumped build to $REVISION, my master"
git push

popd
