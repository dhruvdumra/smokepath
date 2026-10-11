import { Printer, Send } from 'lucide-react';
import { CATS } from '../lib/colors';
import { BOT, BOT_URL, BotQR, REPO, SiteFooter, SiteNav, href, useSiteLang } from './shared';
import type { Lang } from '../lib/types';
import './site.css';

type L = [string, string];
const tx = (v: L, lang: Lang) => v[lang === 'en' ? 0 : 1];

const SECTIONS: { id: string; title: L }[] = [
  { id: 'find', title: ['Find your school', 'अपना स्कूल खोजें'] },
  { id: 'read', title: ['Read the ticket', 'टिकट पढ़ें'] },
  { id: 'act', title: ['Act tonight', 'आज रात क्या करें'] },
  { id: 'telegram', title: ['Get it every evening on Telegram', 'हर शाम Telegram पर पाएँ'] },
  { id: 'sites', title: ['Outdoor work sites', 'बाहरी कार्यस्थल'] },
  { id: 'map', title: ['The map and the timeline', 'मानचित्र और समय-रेखा'] },
  { id: 'sure', title: ['How sure is it?', 'यह कितना पक्का है?'] },
  { id: 'poster', title: ['Share it with other schools', 'दूसरे स्कूलों के साथ साझा करें'] },
];

const STATUS: { code: L; means: L }[] = [
  { code: ['As planned', 'जैसा तय'], means: ['Air is fine for this period; keep it outdoors.', 'इस पीरियड में हवा ठीक है; बाहर ही रखें।'] },
  { code: ['Indoors', 'अंदर'], means: ['Hold it inside: hall, classrooms, or indoor games.', 'अंदर करें: हॉल, कक्षाएँ या इनडोर खेल।'] },
  { code: ['Light activity only', 'केवल हल्की गतिविधि'], means: ['Outdoors is acceptable, but no running; sensitive students stay in.', 'बाहर चल सकता है, पर दौड़ नहीं; संवेदनशील छात्र अंदर रहें।'] },
  { code: ['Masks · gates open early', 'मास्क · गेट जल्दी'], means: ['Arrival or dispersal in bad air: open gates early so children go straight in; masks for the commute.', 'ख़राब हवा में आना-जाना: गेट जल्दी खोलें ताकि बच्चे सीधे अंदर जाएँ; रास्ते के लिए मास्क।'] },
  { code: ['Moved → 12:50', 'समय बदला → 12:50'], means: ['The period moves to the cleanest window of the school day.', 'पीरियड स्कूल दिन के सबसे साफ़ समय पर चला जाता है।'] },
];

const COMMANDS: { cmd: string; what: L }[] = [
  { cmd: '/start', what: ['Begin: share your location or type part of your school name, then tap your school.', 'शुरू करें: लोकेशन भेजें या स्कूल का नाम लिखें, फिर अपना स्कूल चुनें।'] },
  { cmd: '/tomorrow', what: ["Send the current ticket for your school(s) right now.", 'अपने स्कूल का अभी का टिकट तुरंत भेजें।'] },
  { cmd: '/demo', what: ['See what the bot sent on a real smog day (11 Nov 2025).', 'असली स्मॉग वाले दिन (11 नवंबर 2025) का संदेश देखें।'] },
  { cmd: '/lang', what: ['Switch between English and Hindi.', 'अंग्रेज़ी और हिंदी के बीच बदलें।'] },
  { cmd: '/stop', what: ['Unsubscribe.', 'सदस्यता समाप्त करें।'] },
];

export default function HowTo() {
  const [lang, setLang] = useSiteLang();
  const en = lang === 'en';
  return (
    <div className="site">
      <SiteNav lang={lang} onLang={setLang} current="how" />
      <main className="wrap doc">
        <aside className="toc" aria-label={en ? 'On this page' : 'इस पेज पर'}>
          <ol>{SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{tx(s.title, lang)}</a></li>)}</ol>
        </aside>

        <article className="doc-body">
          <h1>{en ? 'How to use SmokePath' : 'SmokePath कैसे इस्तेमाल करें'}</h1>
          <p className="lede">{en
            ? 'For principals, school admins and site supervisors. It takes about three minutes the first time, and none after you subscribe.'
            : 'प्रधानाचार्यों, स्कूल प्रशासकों और साइट सुपरवाइज़रों के लिए। पहली बार लगभग तीन मिनट लगते हैं, सदस्यता के बाद कुछ नहीं।'}</p>

          <section id="find">
            <h2>{tx(SECTIONS[0].title, lang)}</h2>
            <ol className="doc-steps">
              <li>{en ? <>Open <a href={href('/app', lang)}>the map</a>. The ticket on the right (on a phone, the sheet at the bottom) asks <b>Which school?</b></> : <><a href={href('/app', lang)}>मानचित्र</a> खोलें। दाईं ओर का टिकट (फ़ोन पर नीचे की शीट) पूछता है <b>कौन-सा स्कूल?</b></>}</li>
              <li>{en ? 'Type part of the name and pick it, or press the location button to choose the nearest school.' : 'नाम का हिस्सा लिखें और चुनें, या सबसे नज़दीकी स्कूल के लिए लोकेशन बटन दबाएँ।'}</li>
              <li>{en ? 'You can also click any school dot on the map. Zoomed out, all schools sit under one "Delhi NCR" marker; click it to zoom in.' : 'आप मानचित्र पर किसी भी स्कूल बिंदु पर क्लिक कर सकते हैं। ज़ूम-आउट पर सभी स्कूल एक "Delhi NCR" निशान में होते हैं; ज़ूम-इन के लिए उस पर क्लिक करें।'}</li>
            </ol>
            <p className="note">{en ? 'SmokePath covers 1,034 named schools in Delhi NCR from OpenStreetMap. If yours is missing, pick the nearest one: the forecast is the same within a few kilometres.' : 'SmokePath दिल्ली NCR के 1,034 स्कूलों को कवर करता है (OpenStreetMap से)। आपका स्कूल न मिले तो सबसे नज़दीकी चुनें: कुछ किलोमीटर में पूर्वानुमान एक-सा होता है।'}</p>
          </section>

          <section id="read">
            <h2>{tx(SECTIONS[1].title, lang)}</h2>
            <dl className="defs">
              <dt>{en ? 'From' : 'कहाँ से'}</dt><dd>{en ? 'Where the air arriving at your school picked up crop-fire smoke, from satellite fire detections and winds. "Local sources" means no fire smoke on the way.' : 'आपके स्कूल पहुँचने वाली हवा ने पराली का धुआँ कहाँ से लिया (उपग्रह आग और हवा से)। "स्थानीय स्रोत" का मतलब रास्ते में आग का धुआँ नहीं।'}</dd>
              <dt>{en ? 'Arrives' : 'पहुँचेगा'}</dt><dd>{en ? 'The worst hour of the school day, and the CPCB category for it.' : 'स्कूल दिन का सबसे ख़राब घंटा, और उसकी CPCB श्रेणी।'}</dd>
              <dt>{en ? 'Today / Tomorrow' : 'आज / कल'}</dt><dd>{en ? 'Switch the date at the top of the ticket. After 2 pm it opens on tomorrow.' : 'टिकट के ऊपर तारीख़ बदलें। दोपहर 2 बजे के बाद कल का टिकट खुलता है।'}</dd>
            </dl>
            <div className="scale-row" aria-label="CPCB PM2.5 categories">
              {CATS.map((c) => <span key={c.key} style={{ background: c.color, color: c.ink }}>{en ? c.en : c.hi} <small>{c.max === Infinity ? '250+' : `≤${c.max}`}</small></span>)}
            </div>
            <p className="note">{en ? 'Official CPCB colours, PM2.5 in µg/m³. The bars show the corrected forecast for each hour; the dashed line is the raw global model.' : 'आधिकारिक CPCB रंग, PM2.5 µg/m³ में। बार हर घंटे का सुधरा पूर्वानुमान दिखाते हैं; डैश वाली रेखा मूल वैश्विक मॉडल है।'}</p>
            <h3>{en ? 'What each period says' : 'हर पीरियड क्या कहता है'}</h3>
            <table className="codes">
              <tbody>{STATUS.map((s) => <tr key={s.code[0]}><th scope="row">{tx(s.code, lang)}</th><td>{tx(s.means, lang)}</td></tr>)}</tbody>
            </table>
            <p className="note">{en ? 'Changed periods stay highlighted until you hover over or tap them, so nothing is missed.' : 'बदले हुए पीरियड तब तक हाइलाइट रहते हैं जब तक आप उन पर होवर या टैप न करें।'}</p>
          </section>

          <section id="act">
            <h2>{tx(SECTIONS[2].title, lang)}</h2>
            <ol className="doc-steps">
              <li>{en ? <><b>Before tomorrow</b> lists three steps; open "All steps" for the rest (windows, purifiers, N95s for gate staff). Tick them off as you go.</> : <><b>कल से पहले</b> में तीन कदम दिखते हैं; बाक़ी के लिए "सभी कदम" खोलें (खिड़कियाँ, प्यूरीफ़ायर, गेट स्टाफ़ के N95)। करते जाएँ और टिक करें।</>}</li>
              <li>{en ? <>Open <b>For parents</b>, then <b>Copy</b> or <b>WhatsApp</b> to send the ready message to your parents' group.</> : <><b>अभिभावकों के लिए</b> खोलें, फिर तैयार संदेश <b>कॉपी</b> करें या <b>WhatsApp</b> से अभिभावक समूह में भेजें।</>}</li>
              <li>{en ? 'A violet GRAP card means the daily forecast is in the range where the government usually orders Stage III or IV measures. Keep an online plan ready and follow official orders.' : 'बैंगनी GRAP कार्ड का मतलब है कि दैनिक पूर्वानुमान उस स्तर पर है जहाँ सरकार अक्सर चरण III या IV लागू करती है। ऑनलाइन योजना तैयार रखें और आधिकारिक आदेश मानें।'}</li>
            </ol>
          </section>

          <section id="telegram">
            <h2>{tx(SECTIONS[3].title, lang)}</h2>
            <div className="tg-how">
              <ol className="doc-steps">
                <li>{en ? <>Scan the QR code with your phone camera, or open <a href={BOT_URL} target="_blank" rel="noreferrer">@{BOT}</a> in Telegram (search for it by name).</> : <>फ़ोन कैमरे से QR स्कैन करें, या Telegram में <a href={BOT_URL} target="_blank" rel="noreferrer">@{BOT}</a> खोलें (नाम से खोजें)।</>}</li>
                <li>{en ? <>Tap <b>Start</b>. Press <b>Share location</b>, or type part of your school's name.</> : <><b>Start</b> दबाएँ। <b>लोकेशन भेजें</b> दबाएँ, या स्कूल का नाम लिखें।</>}</li>
                <li>{en ? 'Tap your school. The bot confirms the subscription and sends the current ticket.' : 'अपना स्कूल चुनें। बॉट सदस्यता की पुष्टि करता है और अभी का टिकट भेजता है।'}</li>
                <li>{en ? 'From then on, the bot messages you in the evening before any school day with Poor or worse air during school hours. No message means no changes are needed. Sundays are skipped.' : 'इसके बाद, जिस स्कूल दिन में स्कूल समय के दौरान हवा ख़राब या बदतर होगी, उससे पहले शाम को बॉट संदेश भेजेगा। संदेश नहीं आया तो बदलाव ज़रूरी नहीं। रविवार को नहीं।'}</li>
              </ol>
              <BotQR label={en ? 'Scan to open the bot' : 'बॉट खोलने के लिए स्कैन करें'} />
            </div>
            <table className="codes">
              <tbody>{COMMANDS.map((c) => <tr key={c.cmd}><th scope="row"><code>{c.cmd}</code></th><td>{tx(c.what, lang)}</td></tr>)}</tbody>
            </table>
            <p className="note">{en ? <>Prefer email? On a ticket, choose <b>Or by email</b>. AWS sends a one-time verification link first; alerts start after you click it.</> : <>ईमेल चाहिए? टिकट पर <b>या ईमेल से</b> चुनें। AWS पहले एक सत्यापन लिंक भेजता है; उस पर क्लिक करने के बाद अलर्ट शुरू होते हैं।</>}</p>
            <a className="btn btn-primary" href={BOT_URL} target="_blank" rel="noreferrer" style={{ justifySelf: 'start' }}><Send aria-hidden />{en ? 'Open the bot' : 'बॉट खोलें'}</a>
          </section>

          <section id="sites">
            <h2>{tx(SECTIONS[4].title, lang)}</h2>
            <p>{en ? <>Construction sites, brick kilns, markets and loading yards get a <b>work plan</b> instead of a timetable: the cleanest 3-hour window for heavy work, N95s, dust control, a sheltered break every hour, and a Hindi message for workers. On the map choose <b>Outdoor work site</b> and tap the spot; in Telegram, share the location and pick <b>This spot is an outdoor work site</b>.</> : <>निर्माण स्थल, ईंट-भट्ठे, बाज़ार और लोडिंग यार्ड को समय-सारणी के बजाय <b>काम की योजना</b> मिलती है: भारी काम के लिए सबसे साफ़ 3 घंटे, N95, धूल नियंत्रण, हर घंटे शेड में आराम, और मज़दूरों के लिए हिंदी संदेश। मानचित्र पर <b>बाहरी कार्यस्थल</b> चुनें और जगह टैप करें; Telegram में लोकेशन भेजें और <b>यह जगह बाहरी कार्यस्थल है</b> चुनें।</>}</p>
          </section>

          <section id="map">
            <h2>{tx(SECTIONS[5].title, lang)}</h2>
            <ul className="doc-list">
              <li>{en ? 'Press play to watch the next two days: smoke trails stream from fire clusters and the school dots change colour hour by hour.' : 'अगले दो दिन देखने के लिए प्ले दबाएँ: आग वाले इलाक़ों से धुएँ के रास्ते बहते हैं और स्कूल बिंदु घंटे-दर-घंटे रंग बदलते हैं।'}</li>
              <li>{en ? 'The counter at the bottom right counts schools in Very Poor or worse air at the hour under the slider.' : 'नीचे दाईं ओर का काउंटर स्लाइडर वाले घंटे में बहुत ख़राब या बदतर हवा वाले स्कूल गिनता है।'}</li>
              <li>{en ? 'Layers (top right) switches between the station-corrected and raw model fields, and turns smoke, wind, fires, schools and stations on or off.' : 'परतें (ऊपर दाईं ओर) स्टेशन-सुधारित और मूल मॉडल के बीच बदलती हैं, और धुआँ, हवा, आग, स्कूल और स्टेशन चालू/बंद करती हैं।'}</li>
              <li>{en ? 'Live is today’s forecast, refreshed every 3 hours. Replay shows 11 Nov 2025, a real smog day, so you can see what a bad evening looks like even when today is calm.' : 'लाइव आज का पूर्वानुमान है, हर 3 घंटे में ताज़ा। रीप्ले 11 नवंबर 2025 का असली स्मॉग वाला दिन दिखाता है, ताकि शांत दिन पर भी आप देख सकें कि ख़राब शाम कैसी दिखती है।'}</li>
            </ul>
          </section>

          <section id="sure">
            <h2>{tx(SECTIONS[6].title, lang)}</h2>
            <p>{en ? 'The forecast starts from the CAMS global model and is corrected every run against about 120 CPCB monitors, because the raw model badly under-predicts Delhi smog. Each ticket says how much it was corrected, how many monitors are nearby, and how fresh their data is.' : 'पूर्वानुमान CAMS वैश्विक मॉडल से शुरू होता है और हर बार लगभग 120 CPCB मॉनिटरों से सुधारा जाता है, क्योंकि मूल मॉडल दिल्ली के स्मॉग को बहुत कम आँकता है। हर टिकट बताता है कि कितना सुधार हुआ, कितने मॉनिटर पास हैं और उनका डेटा कितना ताज़ा है।'}</p>
            <p>{en ? 'Tested on a month of real data, the correction cut the average error by 39% and caught 86% of Very Poor-or-worse days (the raw model caught 27%). It struggles when the weather flips suddenly. It is guidance for planning, not medical advice.' : 'एक महीने के असली डेटा पर, सुधार ने औसत त्रुटि 39% घटाई और 86% बहुत ख़राब या बदतर दिन पकड़े (मूल मॉडल ने 27%)। अचानक मौसम बदलने पर यह चूक सकता है। यह योजना के लिए मार्गदर्शन है, चिकित्सा सलाह नहीं।'}</p>
            <a className="text-link" href={`${REPO}#validation`} target="_blank" rel="noreferrer">{en ? 'Full validation on GitHub' : 'GitHub पर पूरी जाँच'}</a>
          </section>

          <section id="poster">
            <h2>{tx(SECTIONS[7].title, lang)}</h2>
            <p>{en ? 'Print this card for the staff room or send a photo of it to other principals. Anyone can scan it and subscribe their own school.' : 'यह कार्ड स्टाफ़ रूम के लिए प्रिंट करें या दूसरे प्रधानाचार्यों को इसकी फ़ोटो भेजें। कोई भी स्कैन करके अपने स्कूल की सदस्यता ले सकता है।'}</p>
            <div className="poster-card">
              <div>
                <h3>{en ? "Tomorrow's smoke, tomorrow's timetable" : 'कल का धुआँ, कल की समय-सारणी'}</h3>
                <ol>
                  <li>{en ? 'Scan the code, or open' : 'कोड स्कैन करें, या खोलें'} <b>@{BOT}</b></li>
                  <li>{en ? 'Share your location or type your school' : 'लोकेशन भेजें या स्कूल का नाम लिखें'}</li>
                  <li>{en ? 'Get an alert the evening before a bad-air day' : 'ख़राब हवा वाले दिन से पहले शाम को अलर्ट पाएँ'}</li>
                </ol>
                <p className="poster-url">{location.host}</p>
              </div>
              <BotQR size={176} label="SmokePath" />
            </div>
            <button className="btn" onClick={() => window.print()} style={{ justifySelf: 'start' }}><Printer aria-hidden />{en ? 'Print the card' : 'कार्ड प्रिंट करें'}</button>
          </section>
        </article>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
