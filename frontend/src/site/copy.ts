import type { Lang } from '../lib/types';

/** Home and how-to copy, English and Hindi as equals. */
const C = {
  navHow: ['How to use it', 'कैसे इस्तेमाल करें'],
  navBot: ['Telegram bot', 'Telegram बॉट'],
  navMap: ['Open the map', 'मानचित्र खोलें'],
  navHome: ['Home', 'होम'],

  heroTitle: ["Tomorrow's smoke, turned into tomorrow's timetable.", 'कल का धुआँ, आपके स्कूल की कल की समय-सारणी में।'],
  heroSub: ['Every evening SmokePath reads the smoke forecast for 1,034 Delhi NCR schools and tells each principal what to change tomorrow: assembly, PE, recess, windows.',
    'हर शाम SmokePath दिल्ली NCR के 1,034 स्कूलों के लिए धुएँ का पूर्वानुमान पढ़ता है और हर प्रधानाचार्य को बताता है कि कल क्या बदलना है: प्रार्थना सभा, PE, मध्यावकाश, खिड़कियाँ।'],
  heroFind: ['Find your school', 'अपना स्कूल खोजें'],
  heroReplay: ['Watch the 11 Nov 2025 smog replay', '11 नवंबर 2025 के स्मॉग का रीप्ले देखें'],

  boardTitle: ['Arrivals · Tue 11 Nov 2025', 'आगमन · मंगल, 11 नवंबर 2025'],
  boardSub: ['Replay of a real smog day: when the smoke reached each school, as SmokePath forecast it the evening before.',
    'असली स्मॉग वाले दिन का रीप्ले: धुआँ किस स्कूल पर कब पहुँचा, जैसा SmokePath ने एक शाम पहले बताया।'],
  colArr: ['Arrives', 'पहुँचेगा'],
  colSchool: ['School', 'स्कूल'],
  colFrom: ['From', 'कहाँ से'],
  colAir: ['Air', 'हवा'],
  colChanges: ['Changes', 'बदलाव'],
  local: ['Local sources', 'स्थानीय स्रोत'],
  boardError: ['The arrivals board could not load. The map still works.', 'आगमन बोर्ड लोड नहीं हुआ। मानचित्र फिर भी काम करता है।'],

  stepsTitle: ['One evening, three minutes', 'एक शाम, तीन मिनट'],
  step1: ['Find your school', 'अपना स्कूल खोजें'],
  step1b: ['Search by name or use your location. Outdoor work sites work too: tap any spot on the map.',
    'नाम से खोजें या अपनी लोकेशन इस्तेमाल करें। बाहरी कार्यस्थल भी: मानचित्र पर कोई भी जगह टैप करें।'],
  step2: ["Read tomorrow's ticket", 'कल का टिकट पढ़ें'],
  step2b: ['Where the smoke comes from, when it arrives, and what each period should do: as planned, indoors, light activity, or moved.',
    'धुआँ कहाँ से आ रहा है, कब पहुँचेगा, और हर पीरियड में क्या करना है: जैसा तय, अंदर, हल्की गतिविधि, या समय बदला।'],
  step3: ['Forward it, then let it come to you', 'आगे भेजें, फिर अपने आप पाएँ'],
  step3b: ['Copy the message for parents into WhatsApp, and subscribe on Telegram for an alert the evening before every bad-air day.',
    'अभिभावकों का संदेश WhatsApp में भेजें, और Telegram पर सदस्यता लें ताकि हर ख़राब हवा वाले दिन से पहले शाम को अलर्ट मिले।'],

  tgTitle: ['Every evening, on Telegram', 'हर शाम, Telegram पर'],
  tgBody: ["No app to install. Open the bot, share your location or type your school's name, and tap your school. On an evening before a bad-air school day, the bot sends tomorrow's ticket.",
    'कोई ऐप इंस्टॉल नहीं करना। बॉट खोलें, लोकेशन भेजें या स्कूल का नाम लिखें, और अपना स्कूल चुनें। ख़राब हवा वाले स्कूल दिन से पहले शाम को बॉट कल का टिकट भेजता है।'],
  tgScan: ['Scan with your phone camera', 'फ़ोन कैमरे से स्कैन करें'],
  tgOpen: ['Open the bot', 'बॉट खोलें'],
  tgPoster: ['Print a poster for your staff room', 'स्टाफ़ रूम के लिए पोस्टर प्रिंट करें'],
  chatYou: ['Sardar Patel', 'Sardar Patel'],

  proofTitle: ['Does it work?', 'क्या यह काम करता है?'],
  proofBody: ['Global forecast models badly under-predict Delhi smog. SmokePath corrects them every run against about 120 CPCB monitors. On 11 Nov 2025, the evening before:',
    'वैश्विक पूर्वानुमान मॉडल दिल्ली के स्मॉग को बहुत कम आँकते हैं। SmokePath हर बार लगभग 120 CPCB मॉनिटरों से इसे सुधारता है। 11 नवंबर 2025 को, एक शाम पहले:'],
  measured: ['Measured by CPCB monitors', 'CPCB मॉनिटरों ने मापा'],
  rawModel: ['Global model (CAMS)', 'वैश्विक मॉडल (CAMS)'],
  ours: ['SmokePath forecast', 'SmokePath पूर्वानुमान'],
  month: ['Tested day-ahead on a month of real data (1,556 station-days): average error fell from 104.7 to 63.8 µg/m³, and Very Poor-or-worse days caught rose from 27% to 86%.',
    'एक महीने के असली डेटा (1,556 स्टेशन-दिन) पर एक दिन पहले परखा: औसत त्रुटि 104.7 से घटकर 63.8 µg/m³, और बहुत ख़राब या बदतर दिन पकड़ने की दर 27% से बढ़कर 86%।'],
  proofLink: ['See the full validation', 'पूरी जाँच देखें'],

  limitsTitle: ['What it is, and what it is not', 'यह क्या है, और क्या नहीं'],
  limit1: ['A school-level advisory on a ~45 km forecast grid, sharpened by nearby monitors. Not a street-level sensor.',
    '~45 किमी पूर्वानुमान ग्रिड पर स्कूल-स्तर की सलाह, पास के मॉनिटरों से सुधारी हुई। सड़क-स्तर का सेंसर नहीं।'],
  limit2: ["It never closes schools. GRAP orders are the government's; SmokePath tells you what you can change yourself, and warns when an order looks likely.",
    'यह कभी स्कूल बंद नहीं करता। GRAP आदेश सरकार के होते हैं; SmokePath बताता है कि आप ख़ुद क्या बदल सकते हैं, और आदेश की संभावना पर चेतावनी देता है।'],
  limit3: ["IITM's Decision Support System forecasts stubble smoke for policymakers. SmokePath turns that kind of forecast into one school's timetable.",
    'IITM का निर्णय सहायता तंत्र नीति-निर्माताओं के लिए पराली के धुएँ का पूर्वानुमान देता है। SmokePath उसे एक स्कूल की समय-सारणी में बदलता है।'],

  footerAws: ['Built on AWS: Lambda · EventBridge Scheduler · S3 · CloudFront · API Gateway · DynamoDB · SES, deployed with AWS SAM.',
    'AWS पर बना: Lambda · EventBridge Scheduler · S3 · CloudFront · API Gateway · DynamoDB · SES, AWS SAM से डिप्लॉय।'],
  footerData: ['Data: CAMS (Copernicus) via Open-Meteo · NOAA GFS · NASA FIRMS · CPCB via OpenAQ · © OpenStreetMap contributors.',
    'डेटा: CAMS (Copernicus) Open-Meteo से · NOAA GFS · NASA FIRMS · CPCB, OpenAQ से · © OpenStreetMap योगदानकर्ता।'],
  footerCode: ['Source code', 'सोर्स कोड'],
} as const;

export type CopyKey = keyof typeof C;
export const t = (k: CopyKey, lang: Lang) => C[k][lang === 'en' ? 0 : 1];
