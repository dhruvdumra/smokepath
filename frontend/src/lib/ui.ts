import type { Lang } from './types';

const S = {
  // shell
  live: ['Live', 'लाइव'],
  replay: ['Replay · 11 Nov 2025', 'रीप्ले · 11 नवंबर 2025'],
  layers: ['Layers', 'परतें'],
  loading: ['Loading the forecast…', 'पूर्वानुमान लोड हो रहा है…'],
  calm: ['Calm air today. See the 11 Nov 2025 smog', 'आज हवा शांत है। 11 नवंबर 2025 का स्मॉग देखें'],
  calmGo: ['Replay', 'रीप्ले'],
  siteHint: ['Tap the map where people work outdoors.', 'मानचित्र पर वहाँ टैप करें जहाँ लोग बाहर काम करते हैं।'],

  // intro ticket
  introTitle: ["Tomorrow's smoke, turned into tomorrow's timetable.", 'कल का धुआँ, आपके स्कूल की कल की समय-सारणी में।'],
  introSub: ['Pick a school to see exactly what to change, hour by hour.', 'स्कूल चुनें और देखें कि कल किस घंटे क्या बदलना है।'],
  from: ['From', 'कहाँ से'],
  to: ['To', 'कहाँ तक'],
  arrives: ['Arrives', 'पहुँचेगा'],
  peak: ['Worst hour', 'सबसे ख़राब घंटा'],
  firesFrom: ['Crop fires in Punjab & Haryana', 'पंजाब और हरियाणा में पराली की आग'],
  firesCount: ['{n} fire detections in the last 24 h', 'पिछले 24 घंटों में {n} आग'],
  whichSchool: ['Which school?', 'कौन-सा स्कूल?'],
  findHint: ['Type a school name', 'स्कूल का नाम लिखें'],
  useLocation: ['Use my location', 'मेरी लोकेशन'],
  locating: ['Locating…', 'खोज रहे हैं…'],
  school: ['School', 'स्कूल'],
  site: ['Outdoor work site', 'बाहरी कार्यस्थल'],
  siteIntro: ['Construction, kilns, markets, loading yards: tap the map where people work outdoors.', 'निर्माण, भट्ठे, बाज़ार, लोडिंग यार्ड: मानचित्र पर वहाँ टैप करें जहाँ लोग बाहर काम करते हैं।'],
  siteHere: ['Use my location as the site', 'मेरी लोकेशन को कार्यस्थल मानें'],
  tryThese: ['Try', 'आज़माएँ'],
  noMatch: ['No school matches', 'कोई स्कूल नहीं मिला'],
  credit: ["IITM's Decision Support System forecasts stubble smoke for policymakers. SmokePath turns that kind of forecast into one school's timetable.",
    'IITM का निर्णय सहायता तंत्र नीति-निर्माताओं के लिए पराली के धुएँ का पूर्वानुमान देता है। SmokePath उसे एक स्कूल की समय-सारणी में बदलता है।'],

  // advisory ticket
  back: ['Back', 'वापस'],
  localFrom: ['Local traffic, dust and smog', 'स्थानीय ट्रैफ़िक, धूल और स्मॉग'],
  localNote: ['No crop-fire smoke on the incoming air path', 'आने वाली हवा के रास्ते में पराली का धुआँ नहीं'],
  routeNote: ['{n} fire detections on the route · left ~{h} h earlier', 'रास्ते में {n} आग · लगभग {h} घंटे पहले चली'],
  changes: ['{n} changes', '{n} बदलाव'],
  noChanges: ['No changes needed', 'कोई बदलाव ज़रूरी नहीं'],
  hourly: ['PM2.5 through the day', 'दिन भर PM2.5'],
  schoolHours: ['school hours', 'स्कूल समय'],
  workHours: ['working hours', 'काम का समय'],
  rawCams: ['raw model', 'मूल मॉडल'],
  timetable: ['Timetable', 'समय-सारणी'],
  plan: ['Work plan', 'काम की योजना'],
  todo: ['Before tomorrow', 'कल से पहले'],
  allSteps: ['All {n} steps', 'सभी {n} कदम'],
  fewerSteps: ['Fewer steps', 'कम कदम'],
  parents: ['For parents', 'अभिभावकों के लिए'],
  workers: ['For workers', 'मज़दूरों के लिए'],
  copy: ['Copy', 'कॉपी'],
  copied: ['Copied', 'कॉपी हो गया'],
  whatsapp: ['WhatsApp', 'WhatsApp'],
  alerts: ['Evening alerts on Telegram', 'हर शाम Telegram पर अलर्ट'],
  orEmail: ['Or by email', 'या ईमेल से'],
  emailPh: ['principal@school.in', 'principal@school.in'],
  emailBtn: ['Subscribe', 'सदस्यता लें'],
  showRoute: ['Show the smoke route on the map', 'धुएँ का रास्ता मानचित्र पर दिखाएँ'],
  hideRoute: ['Hide the route', 'रास्ता छिपाएँ'],
  howSure: ['How sure is this?', 'यह कितना पक्का है?'],
  validated: ['Tested on a month of real data', 'एक महीने के असली डेटा पर परखा गया'],
  grap: ['GRAP Stage {s} range', 'GRAP चरण {s} स्तर'],

  // timeline
  play: ['Play', 'चलाएँ'],
  pause: ['Pause', 'रोकें'],
  forecast: ['forecast +{h}h', 'पूर्वानुमान +{h} घं'],
  past: ['model −{h}h', 'मॉडल −{h} घं'],
  tallyNow: ['schools in Very Poor or worse air now', 'स्कूलों में अभी बहुत ख़राब या बदतर हवा'],
  tallyShort: ['schools Very Poor+', 'स्कूल बहुत ख़राब+'],
  replayShort: ['Replay', 'रीप्ले'],
  delhi: ['Delhi', 'दिल्ली'],

  // layers
  corrected: ['Station-corrected PM2.5', 'स्टेशन-सुधारित PM2.5'],
  raw: ['Raw model PM2.5', 'मूल मॉडल PM2.5'],
  smoke: ['Smoke trajectories', 'धुएँ के रास्ते'],
  wind: ['Wind (925 hPa)', 'हवा (925 hPa)'],
  fires: ['Fires (VIIRS)', 'आग (VIIRS)'],
  stations: ['CPCB stations', 'CPCB स्टेशन'],
  schools: ['Schools', 'स्कूल'],
} as const;

export type UiKey = keyof typeof S;

export function tr(k: UiKey, lang: Lang, vars?: Record<string, string | number>) {
  let s: string = S[k][lang === 'en' ? 0 : 1];
  if (vars) for (const [key, v] of Object.entries(vars)) s = s.replace(`{${key}}`, String(v));
  return s;
}
