#!/bin/bash

set -e

DEST="`pwd`/6502ts.github.io"
REVISION=`git rev-parse --short HEAD`
SSH_WRAPPER="`pwd`/deploy/ssh_wrapper.sh"
SSH_KEY="`pwd`/deploy/key"

echo '#!/bin/bash' > "$SSH_WRAPPER"
echo "ssh -i \"$SSH_KEY\" \"\$@\"" >> "$SSH_WRAPPER"
chmod +x "$SSH_WRAPPER"
chmod 600 "$SSH_KEY"

export GIT_SSH="$SSH_WRAPPER"

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