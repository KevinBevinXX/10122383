#!/bin/bash
# Smoke-test games headless: random input for both players, state round-tripped
# through JSON like online play. Usage: tools/test-games.sh [game-id ...]
cd "$(dirname "$0")/.."
PORT=8766
python3 -m http.server $PORT >/dev/null 2>&1 & SRV=$!
trap "kill $SRV 2>/dev/null" EXIT
sleep 0.5
ids=("$@"); [ ${#ids[@]} -eq 0 ] && ids=($(ls games/*.js | xargs -n1 basename | sed 's/\.js$//' | grep -v '^list$'))
fail=0
for id in "${ids[@]}"; do
  t=$(timeout 60 google-chrome --headless=new --disable-gpu --virtual-time-budget=20000 --dump-dom "http://localhost:$PORT/play.html?g=$id&test=1" 2>/dev/null | grep -o '<title>[^<]*' | sed 's/<title>//')
  case "$t" in OK*) echo "ok   $id  $t";; *) echo "FAIL $id  $t"; fail=1;; esac
done
exit $fail
