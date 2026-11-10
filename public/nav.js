(()=>{const T=[["index.html","Dashboard"],["command.html","Command centre"],["call.html","Live call"],["planner.html","What-if planner"],["history.html","Call history"]];
const f=location.pathname.split("/").pop()||"index.html";
document.querySelectorAll("[data-nav]").forEach(n=>{n.className="topnav";n.innerHTML=T.map(t=>`<a href="${t[0]}"${t[0]===f?' class="on" aria-current="page"':""}>${t[1]}</a>`).join("")})})();
window.inr=n=>"₹"+Math.round(n).toLocaleString("en-IN");
window.$=id=>document.getElementById(id);
window.api=(u,b)=>fetch(u,b?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}:undefined).then(r=>r.json());
window.ago=iso=>{const d=Math.floor((Date.now()-new Date(iso))/864e5);return d<=0?"Today":d===1?"Yesterday":d+" days ago"};
/* ---- shared header controls and light Hindi translation ---- */
(()=>{const g=k=>{try{return localStorage.getItem(k)}catch{return null}},isCall=/call\.html$/.test(location.pathname);
let lang=g("kamLang")==="hi"?"hi":"en";
const HI={"Command centre":"कमांड सेंटर","Live call":"लाइव कॉल","What-if planner":"व्हाट-इफ प्लानर","Call history":"कॉल इतिहास","Dashboard":"डैशबोर्ड",
"Seller health dashboard":"विक्रेता स्वास्थ्य डैशबोर्ड","Sellers monitored":"निगरानी में विक्रेता","Need attention":"ध्यान चाहिए","Sales leaking per month":"हर महीने बिक्री का नुकसान","Realistically recoverable":"वास्तविक रूप से वापस मिलने योग्य","Sales leaking / month":"हर महीने बिक्री का नुकसान","Never contacted":"कभी संपर्क नहीं",
"Call queue":"कॉल कतार","Where the money is leaking":"पैसा कहाँ जा रहा है","Growing sellers":"बढ़ते विक्रेता","Quality checks":"गुणवत्ता जाँच","Seller":"विक्रेता","Sales drop":"बिक्री में गिरावट","Main cause":"मुख्य कारण","Last contact":"पिछला संपर्क","Riya calls":"रिया कॉल करती है","Follow up":"फॉलो-अप","Plan":"योजना","Growth call":"ग्रोथ कॉल","Never contacted":"कभी संपर्क नहीं","Recoverable":"वापसी योग्य","Contact":"संपर्क",
"Projected month":"अनुमानित महीना","LEVERS":"नियंत्रण","Enrol in Year-End Sale":"ईयर-एंड सेल में नामांकन","Have Riya put this plan in motion":"रिया से यह योजना शुरू करवाएँ","WHERE THE RECOVERY COMES FROM":"वापसी कहाँ से आएगी","Last month":"पिछला महीना","This month so far":"इस महीने अब तक","With this plan":"इस योजना के साथ",
"When":"कब","Type":"प्रकार","Outcome":"नतीजा","Actions":"कार्य","Export CSV":"CSV निर्यात","Open report":"रिपोर्ट खोलें","Download":"डाउनलोड","Call this seller":"इस विक्रेता को कॉल करें","ACTIONS":"कार्य","SELLER SAID":"विक्रेता ने कहा","GUARDRAILS FIRED":"गार्डरेल सक्रिय","TRANSCRIPT":"ट्रांसक्रिप्ट","Actions agreed":"कार्य तय","Call queued":"कॉल कतार में","Escalated to human":"मानव को सौंपा","No action needed":"कार्रवाई नहीं चाहिए","Riya called":"रिया ने कॉल की","Seller called":"विक्रेता ने कॉल की","Queue a call":"कॉल कतार में डालें","Start live voice call":"लाइव वॉइस कॉल शुरू करें",
"Seller plan":"विक्रेता योजना","What Riya will do":"रिया क्या करेगी","SELLER":"विक्रेता"};
Object.assign(HI,{
 "Virtual KAM":"वर्चुअल खाता प्रबंधक","Open Command centre":"कमांड सेंटर खोलें","Start live call":"लाइव कॉल शुरू करें","Call language":"कॉल की भाषा","Seller account":"विक्रेता का खाता",
 "Riya watches every seller, finds the root cause behind each sales drop and ranks who needs a call first by rupees she can win back.":"रिया हर विक्रेता पर नज़र रखती है, बिक्री में गिरावट का कारण खोजती है और वापस मिल सकने वाली रकम के आधार पर पहले कॉल किए जाने वाले विक्रेताओं की सूची बनाती है।",
 "Riya watches 11 sellers, finds the root cause behind each sales drop, and ranks who needs a call first by rupees at risk.":"रिया 11 विक्रेताओं पर नज़र रखती है, हर गिरावट का मूल कारण खोजती है और रुपयों के जोखिम के हिसाब से बताती है कि पहले किसे कॉल करना है।",
 "Move the levers to see how much of the lost sales each fix could win back. Only levers that match this seller's actual causes are offered.":"विकल्प बदलकर देखें कि हर सुधार से कितनी बिक्री वापस आ सकती है। केवल विक्रेता की वास्तविक समस्याओं से जुड़े विकल्प दिखाए गए हैं।",
 "Every call is stored with its diagnosis, actions, what the seller said and any guardrail that fired. Riya reads this memory before the next call.":"हर कॉल का विश्लेषण, तय किए गए काम, विक्रेता की बात और लागू सावधानियाँ सहेजी जाती हैं। अगली कॉल से पहले रिया इन्हें देखती है।",
 "Riya watches":"रिया नज़र रखती है","sellers, finds the root cause behind each sales drop, and ranks who needs a call first by rupees at risk.":"विक्रेताओं की बिक्री में गिरावट का कारण खोजती है और संभावित नुकसान के आधार पर पहले कॉल किए जाने वाले विक्रेताओं की सूची बनाती है।",
 "ranked by recoverable rupees":"वापस मिल सकने वाली रकम के आधार पर क्रम","ranked by rupees at risk":"जोखिम वाली रकम के आधार पर क्रम",
 "vs last month, at-risk sellers":"पिछले महीने की तुलना में, जोखिम वाले विक्रेता","vs last month, across at-risk sellers":"पिछले महीने की तुलना में, जोखिम वाले सभी विक्रेता","if Riya's plans are followed":"रिया की योजनाओं पर अमल करने पर","call these first":"पहले इन्हें कॉल करें",
 "Select a seller in the queue to see Riya's diagnosis and action plan.":"रिया का विश्लेषण और कार्ययोजना देखने के लिए कतार में किसी विक्रेता को चुनें।",
 "all sellers, per month":"सभी विक्रेता, प्रति माह","no call needed":"कॉल की ज़रूरत नहीं","automated eval suite":"स्वचालित जाँच",
 "Search seller or city":"विक्रेता या शहर खोजें","All causes":"सभी कारण","All status":"सभी स्थितियाँ","critical":"गंभीर","high":"उच्च","watch":"निगरानी","growing":"बढ़त",
 "Follow-up due":"फ़ॉलो-अप बाकी","Follow up":"फ़ॉलो-अप करें","Today":"आज","days ago":"दिन पहले","day ago":"दिन पहले","Never contacted":"कभी संपर्क नहीं हुआ",
 "live demo":"लाइव डेमो","Gold":"गोल्ड","Silver":"सिल्वर","Bronze":"ब्रॉन्ज़","Rank":"क्रम","Last contact":"पिछला संपर्क",
 "Sales":"बिक्री","down":"कम","then":"फिर","vs":"बनाम","the current run-rate":"मौजूदा बिक्री की रफ़्तार के मुकाबले","last month":"पिछले महीने","This month":"इस महीने","This month so far":"इस महीने अब तक","Plan":"योजना",
 "Stock-outs":"स्टॉक खत्म होना","Slow dispatch / cancellations":"धीमा डिस्पैच / ऑर्डर रद्द होना","Visibility / seasonal":"दृश्यता / मौसमी असर","Poor ratings & returns":"कम रेटिंग और रिटर्न","Prices above market":"बाज़ार से ज़्यादा कीमत","Weak listings":"कमज़ोर प्रोडक्ट लिस्टिंग",
 "Restock top SKUs by last-month orders; set low-stock alerts":"पिछले महीने के ऑर्डर के आधार पर ज़्यादा बिकने वाले प्रोडक्ट फिर से स्टॉक में रखें और कम स्टॉक की सूचना चालू करें",
 "Fixed daily pickup slot, packing cut-off, dispatch under 36h":"रोज़ का पिकअप समय तय करें, पैकिंग की समय-सीमा रखें और 36 घंटे में डिस्पैच करें",
 "Enrol in Year-End Sale; boost sponsored listings":"ईयर-एंड सेल में शामिल हों और प्रायोजित लिस्टिंग को बढ़ावा दें",
 "Fix packaging and product-match complaints; audit returns":"पैकिंग और प्रोडक्ट से जुड़ी शिकायतें ठीक करें और रिटर्न की जाँच करें",
 "Re-price top SKUs to category median; run a coupon":"ज़्यादा बिकने वाले प्रोडक्ट की कीमत श्रेणी के औसत पर रखें और कूपन दें",
 "Refresh images and titles; enrol in category promotions":"तस्वीरें और शीर्षक सुधारें और श्रेणी के प्रचार में शामिल हों",
 "Fix task:":"सुधार का काम:","Dispatch":"डिस्पैच","Ratings":"रेटिंग","Re-price top SKUs":"ज़्यादा बिकने वाले प्रोडक्ट की कीमत बदलें","Move top 5 SKUs to category median":"पहले 5 प्रोडक्ट की कीमत श्रेणी के औसत पर रखें",
 "Daily pickup slot + packing cut-off at 4pm; target dispatch under 36h":"रोज़ का पिकअप समय तय करें, शाम 4 बजे तक पैकिंग करें और 36 घंटे में डिस्पैच का लक्ष्य रखें",
 "Request a fixed daily pickup window to bring dispatch under the 48h SLA":"48 घंटे के भीतर डिस्पैच के लिए रोज़ का पिकअप समय तय करने का अनुरोध करें",
 "Eligible listings enrolled":"योग्य प्रोडक्ट लिस्टिंग शामिल की गईं",
 "Restock top products":"ज़्यादा बिकने वाले प्रोडक्ट फिर से स्टॉक में रखें","Dispatch speed":"डिस्पैच तेज़ करें","Re-price top products":"प्रमुख प्रोडक्ट की कीमत बदलें","Fix ratings & returns":"रेटिंग और रिटर्न सुधारें","Refresh listings":"लिस्टिंग सुधारें","Boost visibility":"दृश्यता बढ़ाएँ",
 "Rupees at risk":"जोखिम वाली रकम","Call the top seller":"सबसे ज़्यादा जोखिम वाले विक्रेता को कॉल करें","Follow-up":"फ़ॉलो-अप","Plan":"योजना","Riya calls":"रिया कॉल करे","Call queue":"कॉल की कतार",
 "None":"कोई नहीं","No sellers match.":"कोई विक्रेता मेल नहीं खाता।","None":"कोई नहीं","Growing. No call needed, only a growth check-in.":"बिक्री बढ़ रही है। कॉल की ज़रूरत नहीं, बस प्रगति की जानकारी लें।",
 "This seller has detailed demo metrics and product-level tools.":"इस विक्रेता के लिए विस्तृत डेमो आँकड़े और प्रोडक्ट-स्तर के टूल उपलब्ध हैं।","This seller uses mock portfolio estimates; SKU-level details are unavailable.":"इस विक्रेता के लिए पोर्टफोलियो के अनुमानित मॉक आँकड़े हैं; SKU-स्तर की जानकारी उपलब्ध नहीं है।",
 "Queued · see Call history":"कतार में जोड़ा · कॉल इतिहास देखें","Queue a call":"कॉल कतार में जोड़ें","Start live voice call":"लाइव वॉइस कॉल शुरू करें","Growth call":"बढ़त के लिए कॉल","Growth check-in":"बढ़त की जानकारी","Share what is working; suggest Year-End Sale enrolment":"सफल तरीकों पर बात करें और ईयर-एंड सेल में शामिल होने का सुझाव दें",
 "checks passing":"जाँच सफल","Portfolio sales, last 6 months":"पिछले 6 महीनों की कुल बिक्री","lost last month":"पिछले महीने बिक्री में कमी",
 "Move the levers to see how much of the lost sales each fix could win back. Only levers that match this seller's actual causes are offered.":"विकल्प बदलकर देखें कि हर सुधार से कितनी बिक्री वापस आ सकती है। केवल विक्रेता की वास्तविक समस्याओं से जुड़े विकल्प दिखाए गए हैं।",
 "Projected month":"अनुमानित बिक्री","LEVERS":"सुधार के विकल्प","Share of the fix completed.":"सुधार का पूरा हुआ हिस्सा।","Recovers up to":"अधिकतम इतनी बिक्री वापस आ सकती है",
" of ":" में से ","Move a lever to see the recovery.":"बिक्री वापसी देखने के लिए कोई विकल्प बदलें।",
"Projection from the diagnosis model with stated assumptions: a planning aid, not a promise.":"यह विश्लेषण और बताई गई मान्यताओं पर आधारित अनुमान है, पक्का वादा नहीं।",
"Have Riya put this plan in motion":"रिया से यह योजना शुरू करवाएँ","Plan in motion ✓ Opening history…":"योजना शुरू हो गई ✓ कॉल इतिहास खोला जा रहा है…",
"Call history":"कॉल इतिहास","Every call is stored with its diagnosis, actions, what the seller said and any guardrail that fired. Riya reads this memory before the next call.":"हर कॉल का विश्लेषण, तय किए गए काम, विक्रेता की बात और लागू सावधानियाँ सहेजी जाती हैं। अगली कॉल से पहले रिया इन्हें देखती है।",
"No calls yet.":"अभी तक कोई कॉल नहीं हुई।","Select a call.":"कॉल देखने के लिए चुनें।","Open report":"रिपोर्ट खोलें","Download":"डाउनलोड","Call this seller":"इस विक्रेता को कॉल करें",
"ACTIONS":"तय किए गए काम","SELLER SAID":"विक्रेता ने कहा","GUARDRAILS FIRED":"लागू सावधानियाँ","TRANSCRIPT":"बातचीत का लेखा","Guardrail: ":"सावधानी: ","Seller said:":"विक्रेता ने कहा:","Guardrails:":"सावधानियाँ:","none":"कोई नहीं","Actions:":"काम:","Transcript:":"बातचीत:",
"demo":"डेमो","Call":"कॉल","Logged ✓":"दर्ज किया ✓","off-topic request":"विषय से बाहर का अनुरोध","offline":"ऑफ़लाइन","Gemini":"जेमिनी","Anthropic":"एंथ्रोपिक","SMS":"एसएमएस","AI":"एआई","English":"अंग्रेज़ी",
"Cause":"कारण","Status":"स्थिति","Call the seller":"विक्रेता को कॉल करें","Call":"कॉल","days ago":"दिन पहले",
"Dashboard":"डैशबोर्ड","Command centre":"कमांड सेंटर","What-if planner":"योजना बनाएं","Call history":"कॉल इतिहास",
"lang":"भाषा","Filter by cause":"कारण के अनुसार छाँटें","Filter by status":"स्थिति के अनुसार छाँटें","Seller":"विक्रेता","Call receipt":"कॉल रसीद",
"Sellers monitored":"निगरानी में विक्रेता","Need attention":"ध्यान देने की ज़रूरत","Sales leaking / month":"हर महीने बिक्री का नुकसान","Realistically recoverable":"वास्तव में वापस मिल सकने वाली बिक्री",
"Jun":"जून","Jul":"जुलाई","Aug":"अगस्त","Sep":"सितंबर","Oct":"अक्टूबर","Nov":"नवंबर",
"Year-End Sale":"ईयर-एंड सेल","Diagnosis":"विश्लेषण","Riya:":"रिया:","Rakesh:":"राकेश:","You:":"आप:","Riya":"रिया","Rakesh":"राकेश","account":"खाता","language":"भाषा",
"Imran Footwear Hub":"इमरान फुटवियर हब","Gupta Mobile Accessories":"गुप्ता मोबाइल एक्सेसरीज़","Meena Kurtis & Ethnic Wear":"मीना कुर्ती और एथनिक वियर","Pooja Beauty & Personal Care":"पूजा ब्यूटी और पर्सनल केयर",
"Sharma Kitchen & Cookware":"शर्मा किचन और कुकवेयर","Verma Home Decor":"वर्मा होम डेकोर","Khan Kids Wear":"खान किड्स वियर","Ramesh Stationery & Office":"रमेश स्टेशनरी और ऑफिस",
"Bansal Sports Goods":"बंसल स्पोर्ट्स गुड्स","Joshi Toys & Games":"जोशी टॉयज़ और गेम्स","Rakesh Electronics & Home":"राकेश इलेक्ट्रॉनिक्स एंड होम",
"Agra":"आगरा","Jaipur":"जयपुर","Delhi":"दिल्ली","Mumbai":"मुंबई","Lucknow":"लखनऊ","Hyderabad":"हैदराबाद","Pune":"पुणे","Ludhiana":"लुधियाना","Chandigarh":"चंडीगढ़",
"Gold":"गोल्ड","Silver":"सिल्वर","Bronze":"ब्रॉन्ज़",
});
const en=new WeakMap(),enAttrs=new WeakMap();
const HI_KEYS=Object.keys(HI).sort((a,b)=>b.length-a.length);
function translateHindi(value){
 let text=String(value);
 for(const key of HI_KEYS){
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const flags=key==="KAM"?"g":"gi";
  text=text.replace(new RegExp(`(^|[^A-Za-z0-9])(${escaped})(?=$|[^A-Za-z0-9])`,flags),(_match,before)=>before+HI[key]);
 }
 return text;
}
window.translateHindi=translateHindi;
window.kamIsHindi=()=>lang==="hi";
function translateNode(node){
 if(!node.parentElement||node.parentElement.closest("script,style,[data-no-translate]"))return;
 if(isCall&&!node.parentElement.closest("[data-nav]"))return;
 if(!en.has(node))en.set(node,node.nodeValue);
 const original=en.get(node),translated=lang==="hi"?translateHindi(original):original;
 if(node.nodeValue!==translated)node.nodeValue=translated;
}
function translateAttributes(root){
 const elements=[...(root.nodeType===1?[root]:[]),...root.querySelectorAll("*")];
 for(const element of elements){
  if(isCall&&!element.closest("[data-nav]"))continue;
  for(const attr of ["placeholder","title","aria-label"]){
   if(!element.hasAttribute(attr))continue;
   let saved=enAttrs.get(element);if(!saved){saved={};enAttrs.set(element,saved)}
   if(!(attr in saved))saved[attr]=element.getAttribute(attr);
   const original=saved[attr];element.setAttribute(attr,lang==="hi"?translateHindi(original):original);
  }
 }
}
function tr(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){
 if(isCall&&!n.parentElement.closest("[data-nav]"))continue;
 translateNode(n)}
 translateAttributes(root);
 if(!isCall){const originalTitle=document.title;document.title=lang==="hi"?translateHindi(originalTitle):originalTitle}
}
function setLanguage(next){lang=next==="hi"?"hi":"en";document.documentElement.lang=lang;tr(document.body)}
document.documentElement.lang=lang==="hi"?"hi":"en";
window.addEventListener("kam-language-change",e=>setLanguage(e.detail?.lang));
if(!isCall){const h=document.querySelector("header");if(h){const d=document.createElement("div");d.className="top-right";
 d.innerHTML=`<div class="seg" role="group" aria-label="Language"><button id="kEn" aria-pressed="${lang==="en"}">English</button><button id="kHi" lang="hi" aria-pressed="${lang==="hi"}">हिन्दी</button></div>${g("kamLatency")?`<div class="chip-info" title="Round trip / AI time for the last call turn">${g("kamLatency")}</div>`:""}`;h.append(d);
 $("kEn").onclick=()=>{try{localStorage.setItem("kamLang","en")}catch{};location.reload()};$("kHi").onclick=()=>{try{localStorage.setItem("kamLang","hi")}catch{};location.reload()};
}}
tr(document.body);
new MutationObserver(ms=>ms.forEach(m=>{
 if(m.type==="characterData")translateNode(m.target);
 m.addedNodes.forEach(n=>{if(n.nodeType===1)tr(n);else if(n.nodeType===3)translateNode(n)});
})).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
