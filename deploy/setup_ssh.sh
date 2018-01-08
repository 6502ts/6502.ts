SSH_WRAPPER="`pwd`/deploy/ssh_wrapper.sh"
SSH_KEY="`pwd`/deploy/key"

echo '#!/bin/bash' > "$SSH_WRAPPER"
echo "ssh -i \"$SSH_KEY\" \"\$@\"" >> "$SSH_WRAPPER"
chmod +x "$SSH_WRAPPER"
chmod 600 "$SSH_KEY"

export GIT_SSH="$SSH_WRAPPER"
