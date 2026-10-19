/*
 * Hand-verified Persian renderings for record titles and campaign prose.
 *
 * The rule engine in lib/fa.cjs covers structured strings (tasks, conditions, rewards).
 * Titles and marketing descriptions are natural prose, so they are translated here instead
 * of being guessed by a rule. Brand, club, player and competition names stay in Latin script.
 * A table entry only ever restates something the English source already says.
 */

const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const OBJECTIVES = {
  'Squad Battles: Champions Qualification Points': {
    nameFA: 'Squad Battles: امتیازهای راهیابی به Champions',
    descriptionFA: 'در Squad Battles به رقابت بپردازید و امتیازهای راهیابی به Champions را کسب کنید.',
  },
  'No Room for Racism': {
    nameFA: 'جایی برای نژادپرستی نیست',
    descriptionFA: 'همیشه به نژادپرستی نه بگویید؛ در این بازی زیبا جایی برای نژادپرستی وجود ندارد. با کامل کردن این هدف در کنار برابری، احترام و پذیرش بایستید و کیت No Room for Racism را بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Season 1 SP Chase': {
    nameFA: 'تعقیب SP در فصل ۱',
    descriptionFA: 'چالش‌ها را در سراسر FUT کامل کنید و SP بگیرید.',
  },
  'Weekly Objectives': {
    nameFA: 'اهداف هفتگی',
    descriptionFA: 'اهداف هفتگی را کامل کنید و SP بگیرید.',
  },
  'Daily Objectives': {
    nameFA: 'اهداف روزانه',
    descriptionFA: 'هر ۲۴ ساعت اهداف روزانه را بازی و کامل کنید و از آن‌ها SP بگیرید.',
  },
  'Weekly Rush Points': {
    nameFA: 'امتیازهای Rush هفتگی',
    descriptionFA: 'در کنار هم‌تیمی‌های خود پاداش‌های Rush را کامل کنید و امتیاز Rush و جایزهٔ بسته بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Seasonal Objective': {
    nameFA: 'هدف فصلی',
    descriptionFA: 'اهداف فصلی را کامل کنید و SP بگیرید.',
  },
  'Icon Home Kit': {
    nameFA: 'کیت خانگی Icon',
    descriptionFA: 'کیت خانگی Icon را بپوشید و اهداف را کامل کنید تا SP اضافه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Claim the Armband': {
    nameFA: 'کاپیتانی را بگیرید',
    descriptionFA: 'این هدف را کامل کنید و یک آیتم بازیکن از Squad Foundations انتخاب کنید: Miley (Premier League)، Moi Gómez (LALIGA EA SPORTS)، Banzuzi (Bundesliga) یا Danois (Ligue 1). همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Ones We Watched Legendary Challenge': {
    nameFA: 'چالش Legend مجموعه Ones We Watched',
    descriptionFA: 'چالش‌های Legend در مجموعهٔ Ones We Watched را ببرید و جایزه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Season 1: Ones to Watch Exhibition': {
    nameFA: 'فصل ۱: نمایشگاه Ones to Watch',
    descriptionFA: 'چالش‌های زیر را در نمایشگاه Ones to Watch فصل ۱ کامل کنید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Season 1: Ones to Watch Exhibition Weekly Play': {
    nameFA: 'بازی هفتگی نمایشگاه Ones to Watch فصل ۱',
    descriptionFA: 'در نمایشگاه Ones to Watch فصل ۱ شرکت کنید و جوایز ویژه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Season 1: Ones to Watch Exhibition Completionist': {
    nameFA: 'کامل‌کنندهٔ نمایشگاه Ones to Watch فصل ۱',
    descriptionFA: 'همهٔ اهداف بازی هفتگیٔ نمایشگاه Ones to Watch فصل ۱ را کامل کنید تا کارت Ones to Watch بازیکن Ousmane Diomandé، یک تکامل و سکه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Ones We Watched Challenge Completionist': {
    nameFA: 'کامل‌کنندهٔ چالش‌های Ones We Watched',
    descriptionFA: 'هدف‌های Ones We Watched را کامل کنید و جایزه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Ones We Watched Kick Off Challenge': {
    nameFA: 'چالش Kick Off مجموعه Ones We Watched',
    descriptionFA: 'چالش‌های Kick Off در مجموعهٔ Ones We Watched را ببرید و جایزه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Ones We Watched Semi-Pro Challenge': {
    nameFA: 'چالش Semi-Pro مجموعه Ones We Watched',
    descriptionFA: 'چالش‌های Semi-Pro در مجموعهٔ Ones We Watched را ببرید و جایزه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Ones We Watched Professional Challenge': {
    nameFA: 'چالش Professional مجموعه Ones We Watched',
    descriptionFA: 'چالش‌های Professional در مجموعهٔ Ones We Watched را ببرید و جایزه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Ones We Watched World Class Challenge': {
    nameFA: 'چالش World Class مجموعه Ones We Watched',
    descriptionFA: 'چالش‌های World Class در مجموعهٔ Ones We Watched را ببرید و جایزه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Heart of the Pitch': {
    nameFA: 'قلب میدان',
    descriptionFA: 'در رویداد Flash Rushِ Heart of the Pitch شرکت کنید و جایزه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Future Stars: Milton Delgado': {
    nameFA: 'چالش Future Stars: Milton Delgado',
    descriptionFA: 'چالش‌ها را کامل کنید تا بازیکن Future Stars یعنی Milton Delgado و جوایز دیگر بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Future Stardom': {
    nameFA: 'درخشش Future Stars',
    descriptionFA: 'به قله برسید و ۴ چالش از ۵ چالش را کامل کنید تا سکه و جوایز دیگر بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Future Stars SP': { nameFA: 'SP بازیکنان Future Stars' },
  'Ultimate Gauntlet 2': {
    nameFA: 'نبرد نهایی ۲',
    descriptionFA: '۸ چالش از ۱۰ چالش Ultimate Gauntlet 2 را کامل کنید و جوایز ویژه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Future Stars Academy': {
    nameFA: 'آکادمی Future Stars',
    descriptionFA: 'با بازیکنان آکادمی Future Stars خود بازی کنید و بسته و جوایز دیگر بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Rising Through the Ranks': {
    nameFA: 'پله‌پله به بالا',
    descriptionFA: 'هر باشگاه خوب هم روی میدان و هم بیرون از آن به رسیدگی نیاز دارد. این اهداف نگهداری را کامل کنید و جایزه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'First Team Dreams': { nameFA: 'رویای تیم اول' },
  'The Journey Begins': {
    nameFA: 'سفر آغاز می‌شود',
    descriptionFA: 'رویدادهای زندهٔ PVE راه تازه‌ای برای بازی‌اند. رقابت کنید، کسب کنید و مسیر خود را تا قله ارتقا دهید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Total Football': {
    nameFA: 'فوتبال تمام‌عیار',
    descriptionFA: 'با کامل کردن تک‌تک گروه‌های اهداف Foundation شایستگی خود را ثابت کنید و جوایز بزرگ بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Gallery Foundations': {
    nameFA: 'مبانی Gallery',
    descriptionFA: 'مقدمات Gallery را بیاموزید؛ به مجموعه‌ها امتیاز بدهید و آن‌ها را کامل کنید، به رتبهٔ S برسید و سطح Gallery خود را بالا ببرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Ted Lasso\'s Masterclass': {
    nameFA: 'کلاس استادانهٔ Ted Lasso',
    descriptionFA: 'چالش‌های بزرگداشت Ted Lasso و باشگاه AFC Richmond را کامل کنید و جوایز ویژه بگیرید. همهٔ جایزه‌ها غیرقابل‌فروش‌اند.',
  },
  'Squad Battles Milestone': {
    nameFA: 'مایل‌استون Squad Battles',
    descriptionFA: 'میدان آماده است. در Squad Battles به میدان بروید و از دل مسابقات عبور کنید.',
  },
  'Draft Milestone': {
    nameFA: 'مایل‌استون درافت',
    descriptionFA: 'با درافت، راه خود را به سوی بزرگی بسازید.',
  },
  'Co-Op Milestone': {
    nameFA: 'مایل‌استون Co-Op',
    descriptionFA: 'با دوستان خود تیم شوید و مسیر Co-op را آغاز کنید.',
  },
  'Rush Milestone': {
    nameFA: 'مایل‌استون Rush',
    descriptionFA: 'تیم خود را ببندید و در کنار بازیکنان دیگر پاداش‌های Rush را کامل کنید تا در Rush حکمروا شوید.',
  },
  'Moments Stars Milestone': {
    nameFA: 'مایل‌استون ستاره‌های Moments',
    descriptionFA: 'چالش‌های Moments را کامل کنید و ستاره بگیرید تا برتری فوتبالی خود را نشان دهید.',
  },
  'Squad Building Milestone': {
    nameFA: 'مایل‌استون ساخت ترکیب',
    descriptionFA: 'پله‌پله بالا بروید و استاد ساخت ترکیب شوید.',
  },
  'Transfer Market Milestone': {
    nameFA: 'مایل‌استون بازار ترنسفر',
    descriptionFA: 'با داد و ستد در بازار ترنسفر به استادی برسید.',
  },
  'Live Events Milestone': {
    nameFA: 'مایل‌استون رویدادهای زنده',
    descriptionFA: 'با مسابقات رویدادهای زنده آشنا شوید.',
  },
  'Rivals Milestone': {
    nameFA: 'مایل‌استون Rivals',
    descriptionFA: 'آزمون نهایی مهارت در Division Rivals در انتظار شماست. با رقبا بجنگید و پیروز از میدان خارج شوید.',
  },
  'Champions Milestone': {
    nameFA: 'مایل‌استون Champions',
    descriptionFA: 'هر افسانه‌ای آغازی دارد. وارد Champions شوید و مسیر تبدیل شدن به Golden G.O.A.T را آغاز کنید.',
  },
  'Gallery Milestone': {
    nameFA: 'مایل‌استون Gallery',
    descriptionFA: 'امتیاز Gallery خود را بالا ببرید، به سطح‌های تازه برسید و برای ساخت ویترین بی‌نظیر باشگاه خود جایزه بگیرید.',
  },
};

const SBC = {
  'Assane Diao': { nameFA: 'چالش بازیکن: Assane Diao' },
  'Johan Manzambi': { nameFA: 'چالش بازیکن: Johan Manzambi' },
  'Cora Zicai': { nameFA: 'چالش بازیکن: Cora Zicai' },
  'Xavi Espart': { nameFA: 'چالش بازیکن: Xavi Espart' },
  'Liga Portugal Future Stars Player Pick': { nameFA: 'انتخاب بازیکن Future Stars لیگ پرتغال' },
  'Süper Lig Future Stars Pick': { nameFA: 'انتخاب بازیکن Future Stars سوپرلیگ' },
  'Future Stars Challenge 3': { nameFA: 'چالش ۳ بازیکنان Future Stars' },
  'Marquee Matchups': { nameFA: 'رقابت‌های بزرگ' },
  'League & Nation Advanced': { nameFA: 'لیگ و ملیت (پیشرفته)' },
  'Intro to Player SBCs': { nameFA: 'آشنایی با SBC بازیکن' },
  'Intro to Streamlined SBCs': { nameFA: 'آشنایی با SBC ساده‌شده' },
  'Intro to Upgrade SBCs': { nameFA: 'آشنایی با SBC ارتقا' },
  'Intro to SBCs': { nameFA: 'آشنایی با SBC' },
  'Gold Re-Roll': { nameFA: 'Re-roll کارت طلایی' },
  'Bronze and Silver Re-roll': { nameFA: 'Re-roll کارت برنزی و نقره‌ای' },
  'FC Bayern München v RB Leipzig': { nameFA: 'FC Bayern München در برابر RB Leipzig' },
  'Juventus FC v SS Lazio': { nameFA: 'Juventus FC در برابر SS Lazio' },
  'Real Betis v FC Barcelona': { nameFA: 'Real Betis در برابر FC Barcelona' },
  'Leeds United v Manchester United': { nameFA: 'Leeds United در برابر Manchester United' },
  '3 Leagues & 2 Nations': { nameFA: '۳ لیگ و ۲ ملیت' },
  '4 Leagues & 5 Nations': { nameFA: '۴ لیگ و ۵ ملیت' },
  '5 Leagues & 6 Nations': { nameFA: '۵ لیگ و ۶ ملیت' },
  'A New Signing': { nameFA: 'امضای تازه' },
  'The Bronze and Silver Lining': { nameFA: 'امید برنز و نقره' },
  'The Royal SBC': { nameFA: 'SBC سلطنتی' },
  'The Multi Submit': { nameFA: 'ارسال چندگانه' },
  'Break Away': { nameFA: 'فرار از مدافع' },
  'A Brace': { nameFA: 'دو گل در یک مسابقه' },
  'Hat-trick': { nameFA: 'هت‌تریک' },
  'A Pair Of Pairs': { nameFA: 'دو جفت بازیکن' },
};

const EVOLUTIONS = {
  'Zoomaestro': {
    nameFA: 'استاد سرعت',
    descriptionFA: 'بازی‌ساز شما همیشه دید داشت؛ حالا سرعت هم می‌گیرد. سرعت و دریبل‌زنی هافبک هجومی یا میانی خود را بالا ببرید و در یک چشم‌به‌هم‌زدن از مدافعان عبور کنید.',
  },
  'Middle Management': {
    nameFA: 'مدیریت میانهٔ میدان',
    descriptionFA: 'هافبک جوان خود را به این دورهٔ تمرینی بفرستید تا مهارت‌های لازم برای گردانندگی مرکز میدان را بیاموزد؛ از پاس و شوت تا قطع توپ و قدرت بدنی و بسیاری موارد دیگر.',
  },
  'Future Stars Academy IV': {
    nameFA: 'آکادمی Future Stars ۴',
    descriptionFA: 'روز فارغ‌التحصیلی فرا رسیده است. مسیر بازیکن Future Stars خود را به عنوان یک تمام‌کنندهٔ دقیق یا یک بازی‌ساز خلاق به پایان برسانید تا برای درخشش در بزرگ‌ترین صحنه‌ها آماده باشد.',
  },
  'Speed Bump': {
    nameFA: 'مانع سرعتی',
    descriptionFA: 'مدافع میانی شما حملات را متوقف می‌کند؛ حالا می‌تواند به آن‌ها برسد هم. به یک مدافع میانی کم‌سرعت ارتقای سرعت بدهید تا دیوار دفاعی حتی در ضدحمله هم استوار بماند.',
  },
  'Centre Stage': {
    nameFA: 'مرکز صحنه',
    descriptionFA: 'دایرهٔ وسط میدان را با هافبکی استوار در اختیار بگیرید که برای بازپس‌گیری توپ، تحمل فشار بدنی و یافتن دویدن‌های کلیدی به جلو آماده است.',
  },
  'Side Step': {
    nameFA: 'قدم کناری',
    descriptionFA: 'با ساختن فول‌بکی که هم می‌تواند حملات حریف را خنثی کند و هم در رأس حملات به جلو برود، خط کناری را در اختیار بگیرید.',
  },
  'Future Stars Academy III': {
    nameFA: 'آکادمی Future Stars ۳',
    descriptionFA: 'وقت آن است که امضای خود را پیدا کند. یک PlayStyle تازه باز کنید و سرعت، شوت یا دریبل بازیکن Future Stars خود را در سطح بعدی تیزتر کنید.',
  },
  'Touchline Magic': {
    nameFA: 'جادوی خط کناری',
    descriptionFA: 'با وینگردری چابک که می‌تواند از پشت مدافع خود رد شود، دریبل‌زنی درجه‌یک نشان دهد و گل‌های حساس بزند، دفاع‌ها را از کناره‌ها باز کنید.',
  },
  'Future Stars Academy II': {
    nameFA: 'آکادمی Future Stars ۲',
    descriptionFA: 'گام بعدی در مسیر اوست. به بازیکن Future Stars خود کمک کنید تا به بازی‌سازی قدرتمند یا بازیکنی همه‌جانبه تبدیل شود.',
  },
  'Playmaker Reborn': {
    nameFA: 'بازی‌ساز دوباره متولد',
    descriptionFA: 'موتور هافبک خود را با دید تیز و پاس‌های دقیق بازسازی کنید تا ریتم مسابقه را از مرکز در دست بگیرد.',
  },
  'Quick Step [FC 26 Obj]': {
    nameFA: 'قدم سریع (اهداف FC 26)',
    descriptionFA: 'با کامل کردن FC 26 Season 9 Pass باز می‌شود.',
  },
  'Future Stars Academy I': {
    nameFA: 'آکادمی Future Stars ۱',
    descriptionFA: 'هر افسانه‌ای جایی شروع می‌شود. مهاجم جوان خود را به بازیکنی کامل تبدیل کنید و سپس انتخاب کنید که اثر خود را با سرعت، شوت یا دریبل‌زنی بگذارد.',
  },
  'Nine Duty': {
    nameFA: 'وظیفهٔ شماره ۹',
    descriptionFA: 'اثر هجومی مهاجم نوک خود را بالا ببرید تا وقتی خط حمله را پیش می‌کشد، همیشه روی نتیجهٔ مسابقه تأثیر بگذارد.',
  },
  'Midfield Glow Up': {
    nameFA: 'درخشش هافبک',
    descriptionFA: 'اتاق موتور میانی خود را با ارتقای تاکتیکی بزرگی تازه کنید؛ ترکیبی از سرعت بازیابی بهتر، حضور بدنی بی‌امان و پاس‌های برتر در سراسر میدان.',
  },
  'Intro to Repeatable Evolutions': {
    nameFA: 'آشنایی با تکامل‌های تکرارشونده',
    descriptionFA: 'با تکامل‌های تکرارشونده آشنا شوید؛ مسیری که در آن چند بازیکن را از یک مسیر ارتقای یکسان عبور می‌دهید.',
  },
  'Intro to Evolutions': {
    nameFA: 'آشنایی با تکامل‌ها',
    descriptionFA: 'به تکامل‌ها در FC 27 خوش‌آمدید! یک بازیکن دلخواه را ارتقا دهید و نخستین افزایش ویژگی او را باز کنید.',
  },
  'Intro to Training Camp EVOs': {
    nameFA: 'آشنایی با تکامل کمپ تمرینی',
    descriptionFA: 'بازیکنان خود را به کمپ تمرینی بفرستید و هنگام پایان جلسهٔ تمرینی، افزایش ویژگی‌هایشان را دریافت کنید.',
  },
  'Intro to Pathway Evolutions': {
    nameFA: 'آشنایی با تکامل چندمسیره',
    descriptionFA: 'تکامل‌های چندمسیره را کاوش کنید؛ نوع تازه‌ای از تکامل که انتخاب می‌کند بازیکن شما چگونه رشد و ارتقا پیدا کند.',
  },
};

// Titles of objective challenge sets. Wordplay is rendered literally; brand words stay Latin.
const TASKS = {
  'Scoring Success': { nameFA: 'موفقیت در گل‌زنی' },
  'The Final Challenge': { nameFA: 'چالش پایانی' },
  'Defensive Masterclass': { nameFA: 'کلاس دفاعی' },
  'Ones We Watched Legendary Challenge': { nameFA: 'چالش Legendary مجموعه Ones We Watched' },
  'Ones We Watched World Class Challenge': { nameFA: 'چالش World Class مجموعه Ones We Watched' },
  'Ones We Watched Professional Challenge': { nameFA: 'چالش Professional مجموعه Ones We Watched' },
  'Ones We Watched Semi-Pro Challenge': { nameFA: 'چالش Semi-Pro مجموعه Ones We Watched' },
  'Top Scorer': { nameFA: 'بیشترین گل' },
  'Assister': { nameFA: 'پاس‌گل‌دهندهٔ برتر' },
  'Pep\'s Domination': { nameFA: 'سلطهٔ پپ' },
  'Finesse': { nameFA: 'ظرافت' },
  'Serial Winner': { nameFA: 'برندهٔ پی‌درپی' },
  'PL Scorer': { nameFA: 'گل‌زن پریمیرلیگ' },
  'Homegrown Victory': { nameFA: 'برد با بازیکن بومی' },
  'Curled Home': { nameFA: 'گل مورب به درون دروازه' },
  'Thread the Needle': { nameFA: 'پاس از سوزن' },
  'Tango Rhythm': { nameFA: 'آهنگ تانگو' },
  'Evo Elite': { nameFA: 'نخبهٔ تکامل' },
  'Club Director': { nameFA: 'مدیر باشگاه' },
  'Battle Hardened': { nameFA: 'ورزیدهٔ میدان' },
  'Weekend Warrior': { nameFA: 'جنگجوی آخر هفته' },
  'Consistent Finisher': { nameFA: 'تمام‌کنندهٔ ثابت' },
  'Portuguese Maestro': { nameFA: 'استاد پرتغالی' },
  'Azzurri\'s Wall': { nameFA: 'دیوار آتزوری' },
  'The Viking': { nameFA: 'وایکینگ' },
  'Madridista Flair': { nameFA: 'استیل مادریدی' },
  'Triple Perfect': { nameFA: 'بی‌نقص سه‌گانه' },
  'Double Perfect': { nameFA: 'بی‌نقص دوبل' },
  'Perfect Round': { nameFA: 'نوبت بی‌نقص' },
  'Shining Star': { nameFA: 'ستارهٔ درخشان' },
  'Cementing their Place': { nameFA: 'جایگاه محکم‌شده' },
  'Star in the Making': { nameFA: 'ستارهٔ در حال ساخت' },
  'Consistent Reps': { nameFA: 'تکرارهای منظم' },
  'The Starlet\'s Debut': { nameFA: 'نخستین حضور ستارهٔ جوان' },
  'Consumable Craze': { nameFA: 'تب آیتم‌های مصرفی' },
  'Style and Substance': { nameFA: 'زیبایی و محتوا' },
  'Form Fitting': { nameFA: 'هم‌شکل با فرم' },
  'For Club and Crest': { nameFA: 'برای باشگاه و نشان' },
  'Targeted Investments': { nameFA: 'سرمایه‌گذاری هدفمند' },
  'Trading Up': { nameFA: 'ارتقا با معامله' },
  'Players Come, Players Go': { nameFA: 'بازیکن می‌آید، بازیکن می‌رود' },
  'A Test of Skill': { nameFA: 'آزمون مهارت' },
  'Finding the Net': { nameFA: 'به تور رساندن' },
  'Hit the Pitch': { nameFA: 'پا به میدان گذاشتن' },
  'Lace \'em Up': { nameFA: 'بند کفش‌ها را ببند' },
  'Level Up': { nameFA: 'یک پله بالاتر' },
  'Three of a Kind': { nameFA: 'سه بازیکن هم‌نوع' },
  'Set the Standard': { nameFA: 'استاندارد تعریف کن' },
  'Set in Motion': { nameFA: 'به حرکت درآمده' },
  'Make the Grade': { nameFA: 'قبول در سطح لازم' },
  'Believe': { nameFA: 'باور داشته باش' },
  'Biscuits with the Boss': { nameFA: 'بیسکویت با رئیس' },
  'Barbecue Sauce': { nameFA: 'سس باربیکیو' },
  'Be a Goldfish': { nameFA: 'مثل ماهی قرمز باش' },
  'Unselfish Play': { nameFA: 'بازی بی‌انانی' },
  'Football is Life': { nameFA: 'فوتبال یعنی زندگی' },
};

const TABLES = { objectives: OBJECTIVES, sbc: SBC, evolutions: EVOLUTIONS, tasks: TASKS };

// A lookup miss is normal and returns no fields; the UI then shows the English source.
function faText(section, name) {
  const table = TABLES[section];
  if (!table || !name) return {};
  const key = Object.keys(table).find(entry => normalise(entry) === normalise(name));
  return key ? table[key] : {};
}

module.exports = { faText };
