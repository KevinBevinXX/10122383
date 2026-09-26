// Guess the 5-letter word in 6 tries.
GAME({
  title: "Word Guess",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Type a 5-letter word and press Enter (or tap the on-screen keys). Green = right letter, right spot. Yellow = in the word, wrong spot.",
  WORDS: ("ABOUT ABOVE ACTOR ADMIT ADOPT ADULT AFTER AGAIN AGENT AGREE AHEAD ALARM ALBUM ALERT ALIKE ALIVE ALLOW ALONE ALONG ALTER AMONG ANGER ANGLE ANGRY APART APPLE APPLY ARENA ARGUE ARISE ARMOR ARROW ASIDE ASSET AVOID AWAKE AWARD AWARE BACON BADGE BAKER BASIC BEACH BEARD BEAST BEGIN BEING BELOW BENCH BIRTH BLACK BLADE BLAME BLANK BLAST BLEND BLESS BLIND BLOCK BLOOD BLOOM BOARD BOAST BONUS BOOST BOOTH BRAIN BRAKE BRAND BRAVE BREAD BREAK BRICK BRIDE BRIEF BRING BROAD BROOM BROWN BRUSH BUILD BUNCH BURST BUYER CABIN CABLE CAMEL CANDY CARGO CARRY CATCH CAUSE CHAIN CHAIR CHALK CHARM CHART CHASE CHEAP CHECK CHEEK CHEER CHESS CHEST CHIEF CHILD CHILL CHOIR CIVIL CLAIM CLASS CLEAN CLEAR CLERK CLICK CLIFF CLIMB CLOCK CLOSE CLOTH CLOUD COACH COAST COLOR COUCH COUNT COURT COVER CRAFT CRANE CRASH CRAZY CREAM CRIME CROSS CROWD CROWN CRUSH CURVE CYCLE DAILY DANCE DEATH DELAY DEPTH DIARY DIRTY DOUBT DOUGH DRAFT DRAIN DRAMA DREAM DRESS DRINK DRIVE EAGER EAGLE EARLY EARTH EIGHT ELBOW ELDER EMPTY ENEMY ENJOY ENTER ENTRY EQUAL ERROR EVENT EVERY EXACT EXIST EXTRA FAITH FALSE FANCY FAULT FEAST FENCE FEVER FIELD FIFTY FIGHT FINAL FIRST FLAME FLASH FLEET FLOAT FLOOR FLOUR FLUID FOCUS FORCE FORTH FORUM FOUND FRAME FRESH FRONT FROST FRUIT FUNNY GHOST GIANT GIVEN GLASS GLOBE GLORY GLOVE GOOSE GRACE GRADE GRAIN GRAND GRANT GRAPE GRASS GRAVE GREAT GREEN GREET GRILL GROUP GUARD GUESS GUEST GUIDE HABIT HAPPY HARSH HEART HEAVY HELLO HOBBY HONEY HORSE HOTEL HOUSE HUMAN HUMOR HURRY IDEAL IMAGE INDEX INNER INPUT ISSUE JEWEL JOINT JUDGE JUICE KNIFE KNOCK KNOWN LABEL LARGE LASER LATER LAUGH LAYER LEARN LEAST LEAVE LEGAL LEMON LEVEL LIGHT LIMIT LOCAL LOGIC LOOSE LOVER LOWER LUCKY LUNCH MAGIC MAJOR MAKER MANGO MARCH MATCH MAYBE MAYOR MEDAL MEDIA MERCY METAL MIGHT MINOR MINUS MIXED MODEL MONEY MONTH MORAL MOTOR MOUNT MOUSE MOUTH MOVIE MUSIC NERVE NEVER NIGHT NINJA NOISE NORTH NOVEL NURSE OCEAN OFFER OFTEN OLIVE ONION OPERA ORBIT ORDER OTHER OUTER OWNER PAINT PANEL PANIC PAPER PARTY PASTA PATCH PEACE PEACH PEARL PENNY PHASE PHONE PHOTO PIANO PIECE PILOT PITCH PIZZA PLACE PLAIN PLANE PLANT PLATE POINT POLAR POUND POWER PRESS PRICE PRIDE PRIME PRINT PRIZE PROOF PROUD PUPIL PUPPY QUEEN QUEST QUICK QUIET QUOTE RADAR RADIO RAISE RANCH RANGE RAPID RATIO REACH READY REALM RELAX REPLY RIDER RIDGE RIGHT RIVAL RIVER ROAST ROBOT ROCKY ROUGH ROUND ROUTE ROYAL RULER RURAL SALAD SAUCE SCALE SCARF SCENE SCORE SCOUT SENSE SERVE SEVEN SHADE SHAKE SHAPE SHARE SHARK SHARP SHEEP SHELF SHELL SHIFT SHINE SHIRT SHOCK SHOOT SHORT SHOUT SIGHT SKILL SKIRT SLEEP SLICE SLIDE SMALL SMART SMILE SMOKE SNACK SNAKE SOLAR SOLID SOLVE SOUND SOUTH SPACE SPARE SPARK SPEAK SPEED SPELL SPEND SPICE SPINE SPOON SPORT SQUAD STACK STAFF STAGE STAIR STAMP STAND START STATE STEAM STEEL STICK STILL STONE STORM STORY STOVE STRAW STRIP STUDY STUFF STYLE SUGAR SUNNY SUPER SWEET SWIFT SWING SWORD TABLE TASTE TEACH TEETH THANK THEME THICK THIEF THING THINK THIRD THREE THROW THUMB TIGER TIGHT TIMER TIRED TITLE TOAST TODAY TOOTH TOPIC TORCH TOTAL TOUCH TOUGH TOWER TOXIC TRACK TRADE TRAIL TRAIN TREAT TREND TRIAL TRIBE TRICK TRUCK TRULY TRUST TRUTH TWICE TWIST UNCLE UNDER UNION UNITY UNTIL UPPER UPSET URBAN USUAL VALID VALUE VIDEO VIRUS VISIT VITAL VOICE WAGON WASTE WATCH WATER WHALE WHEAT WHEEL WHITE WHOLE WOMAN WORLD WORRY WORTH WOULD WOUND WRIST WRITE WRONG YIELD YOUNG YOUTH ZEBRA").split(" "),
  ROWS: ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"],
  init() { return { ans: E.pick(this.WORDS), rows: [], cur: "", msg: "", msgT: 0, keys: {} }; },
  grade(g, ans) {
    const res = Array(5).fill(0), left = ans.split("");
    for (let i = 0; i < 5; i++) if (g[i] === ans[i]) { res[i] = 2; left[i] = null; }
    for (let i = 0; i < 5; i++) if (!res[i]) { const j = left.indexOf(g[i]); if (j >= 0) { res[i] = 1; left[j] = null; } }
    return res;
  },
  keyAt(t) {
    for (let r = 0; r < 3; r++) { const row = this.ROWS[r], w = 44, x0 = 400 - (row.length * w) / 2; for (let i = 0; i < row.length; i++) if (E.inRect(t, x0 + i * w, 318 + r * 42, w - 4, 38)) return row[i]; }
    if (E.inRect(t, 70, 402, 90, 38)) return "Enter";
    if (E.inRect(t, 640, 402, 90, 38)) return "Backspace";
    return null;
  },
  update(s, inp, dt) {
    s.msgT = Math.max(0, s.msgT - dt);
    const keys = inp[0].keys.slice();
    for (const t of inp[0].taps) { const k = this.keyAt(t); if (k) keys.push(k); }
    for (const k of keys) {
      if (k === "Backspace") s.cur = s.cur.slice(0, -1);
      else if (k === "Enter") {
        if (s.cur.length < 5) { s.msg = "Not enough letters"; s.msgT = 1.2; E.sfx("hit"); continue; }
        if (!this.WORDS.includes(s.cur)) { s.msg = "Not in word list"; s.msgT = 1.2; E.sfx("hit"); continue; }
        const g = this.grade(s.cur, s.ans); s.rows.push({ w: s.cur, g });
        [...s.cur].forEach((ch, i) => (s.keys[ch] = Math.max(s.keys[ch] ?? -1, g[i])));
        E.sfx("click");
        if (s.cur === s.ans) { s.over = true; s.score = s.rows.length; s.overText = `Got it in ${s.rows.length}! (${s.ans})`; E.sfx("win"); return; }
        if (s.rows.length >= 6) { s.over = true; s.lost = true; s.overText = `The word was ${s.ans}`; return; }
        s.cur = "";
      } else if (/^[A-Z]$/.test(k) && s.cur.length < 5) s.cur += k;
    }
  },
  COL: ["#3a3a3c", "#b59f3b", "#538d4e"],
  draw(c, s) {
    E.clear(c, "#121213");
    for (let r = 0; r < 6; r++) for (let i = 0; i < 5; i++) {
      const x = 300 + i * 42, y = 8 + r * 50, row = s.rows[r], ch = row ? row.w[i] : r === s.rows.length ? s.cur[i] : "";
      if (row) E.rect(c, x, y, 38, 44, this.COL[row.g[i]]); else { E.rect(c, x, y, 38, 44, "#121213"); c.strokeStyle = ch ? "#565758" : "#3a3a3c"; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, 36, 42); }
      if (ch) E.text(c, ch, x + 19, y + 23, 22);
    }
    for (let r = 0; r < 3; r++) { const row = this.ROWS[r], w = 44, x0 = 400 - (row.length * w) / 2; for (let i = 0; i < row.length; i++) { const st = s.keys[row[i]]; E.rrect(c, x0 + i * w, 318 + r * 42, w - 4, 38, 5, st === undefined ? "#818384" : this.COL[st]); E.text(c, row[i], x0 + i * w + 20, 337 + r * 42, 16); } }
    E.rrect(c, 70, 402, 90, 38, 5, "#818384"); E.text(c, "ENTER", 115, 421, 14);
    E.rrect(c, 640, 402, 90, 38, 5, "#818384"); E.text(c, "⌫", 685, 421, 18);
    if (s.msgT) { E.rrect(c, 300, 140, 200, 36, 6, "#fff"); E.text(c, s.msg, 400, 158, 14, "#111"); }
  },
});
