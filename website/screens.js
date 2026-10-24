(function(){
function _extends(){return _extends=Object.assign?Object.assign.bind():function(n){for(var e=1;e<arguments.length;e++){var t=arguments[e];for(var r in t)({}).hasOwnProperty.call(t,r)&&(n[r]=t[r]);}return n;},_extends.apply(null,arguments);}
const h=React.createElement;

/* The mark: a struck line (the old site) above an amber line (the rewrite). Both colours come from CSS tokens. */
function Mark(){
  return h("svg",{className:"mark",viewBox:"0 0 32 32",width:28,height:28,"aria-hidden":"true",focusable:"false"},
    h("rect",{className:"mark__tile",x:1,y:1,width:30,height:30,rx:7}),
    h("rect",{className:"mark__old",x:7,y:9,width:13,height:3,rx:1.5}),
    h("path",{className:"mark__strike",d:"M5.5 14.5L23 7.5"}),
    h("rect",{className:"mark__new",x:7,y:18,width:18,height:4,rx:2}));
}

function Wordmark({small}){
  return h("span",{className:"wordmark"+(small?" wordmark--sm":"")},h(Mark,null),h("span",{className:"wordmark__text"},"Rewrite ",h("span",{className:"wordmark__labs"},"Labs")));
}

function goTo(id){var el=document.getElementById(id);if(el){el.scrollIntoView({behavior:"smooth",block:"start"});}else{window.location.href="/#"+id;}}
window.addEventListener("load",function(){if(window.location.hash){setTimeout(function(){var el=document.getElementById(window.location.hash.slice(1));if(el)el.scrollIntoView();},50);}});

function ThemeToggle(){
  const icon={viewBox:"0 0 24 24",width:18,height:18,fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",focusable:"false"};
  return h("button",{type:"button",className:"theme-toggle","aria-label":"Switch color theme"},
    h("svg",_extends({className:"theme-toggle__sun"},icon),h("circle",{cx:12,cy:12,r:4}),h("path",{d:"M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"})),
    h("svg",_extends({className:"theme-toggle__moon"},icon),h("path",{d:"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"})));
}

function Nav(){
  return h("nav",{className:"nav","aria-label":"Primary"},
    h("a",{className:"skip",href:"#main"},"Skip to content"),
    h("div",{className:"nav__bar"},
      h("div",{className:"nav__links"},
        h("a",{href:"/case-study",className:"nav__link"},"Case study"),
        h("a",{href:"/blog/",className:"nav__link nav__link--wide"},"Blog"),
        h("a",{href:"/ai-news-feed/",className:"nav__link nav__link--wide"},"AI news")),
      h("a",{href:"/",className:"nav__brand","aria-label":"Rewrite Labs home"},h(Wordmark,null)),
      h("div",{className:"nav__actions"},
        h(ThemeToggle,null),
        h("button",{type:"button",className:"btn btn--quiet",onClick:function(){goTo("waitlist");}},"Get early access"))));
}

/* A sample scan, built at full size. The values are the sample's own, and the figure says it is a sample. */
function ScanRecord(){
  return h("figure",{className:"record","aria-labelledby":"record-title"},
    h("figcaption",{id:"record-title",className:"record__head"},
      h("span",null,"Sample scan"),
      h("span",{className:"measured record__id"},"sample-bakery.example")),
    h("div",{className:"record__reading"},
      h("span",{className:"reading"},"2009"),
      h("span",{className:"record__label"},"Design age of the site")),
    h("dl",{className:"record__rows"},
      h("div",{className:"record__row"},h("dt",null,"Mobile ready"),h("dd",{className:"measured"},"No")),
      h("div",{className:"record__row"},h("dt",null,"Page speed"),h("dd",{className:"measured"},"38")),
      h("div",{className:"record__row"},h("dt",null,"Redesign score"),h("dd",{className:"measured record__good"},"94"))),
    h("div",{className:"record__foot"},
      h("ul",{className:"chips","aria-label":"Verdicts"},
        h("li",{className:"chip chip--bad"},"Outdated"),
        h("li",{className:"chip chip--bad"},"Fails"),
        h("li",{className:"chip chip--cool"},"High priority")),
      h("a",{href:"/case-study",className:"link"},"See the full before and after")));
}

function Hero(){
  return h("section",{className:"hero","aria-labelledby":"hero-title"},
    h("div",{className:"container hero__grid"},
      h("div",{className:"hero__text"},
        h("h1",{id:"hero-title"},"Automation that runs on your own ground."),
        h("p",{className:"lead hero__lead"},"AI tools that keep your data and keys on your machines."),
        h("div",{className:"hero__actions"},
          h("button",{type:"button",className:"btn btn--primary",onClick:function(){goTo("waitlist");}},"Get early access"),
          h("button",{type:"button",className:"btn btn--quiet",onClick:function(){goTo("platform");}},"See what we build"))),
      h(ScanRecord,null)));
}

function SitesAnchor(){return h("div",{id:"sites"});}

/* One visual state per step. They share one cell of the grid and the one for the step in view shows, so the visual stays pinned while the steps scroll. */
function stateFor(i,on){
  const cls="pinstate"+(on?" is-on":"");
  const minus=(t)=>h("p",{className:"diff__row diff__row--minus"},h("span",{className:"diff__gutter","aria-hidden":"true"},"−"),t);
  const plus=(t)=>h("p",{className:"diff__row diff__row--plus"},h("span",{className:"diff__gutter","aria-hidden":"true"},"+"),t);
  if(i===0)return h("figure",{className:cls},
    h("figcaption",{className:"pinstate__head"},"What the crawler scores"),
    h("ul",{className:"pinlist"},["Design age","Mobile responsiveness","Page speed","Accessibility"].map(t=>h("li",{key:t,className:"pinlist__row"},h("span",null,t),h("span",{className:"chip chip--cool"},"Scored")))));
  if(i===1)return h("figure",{className:cls},
    h("figcaption",{className:"pinstate__head"},"What the draft changed on the Sunbelt sample"),
    h("div",{className:"diff"},
      minus("Nine-item flat navigation, three levels of dropdowns"),
      plus("Four links, one always-visible phone call-to-action"),
      minus("“Get an estimate” repeated six times down the page"),
      plus("One persistent call-to-action, styled to stand out once")));
  if(i===2)return h("figure",{className:cls},
    h("figcaption",{className:"pinstate__head"},"The owner’s preview"),
    h("dl",{className:"pinmeta"},
      h("div",{className:"pinmeta__row"},h("dt",null,"To"),h("dd",{className:"measured"},"owner@sample-bakery.example")),
      h("div",{className:"pinmeta__row"},h("dt",null,"Attached"),h("dd",null,"A before and after of their own site"))),
    h("a",{href:"/case-study",className:"link"},"See a full sample"));
  return h("figure",{className:cls},
    h("figcaption",{className:"pinstate__head"},"From draft to delivery"),
    h("ul",{className:"trail"},
      h("li",{className:"trail__row"},h("span",{className:"trail__who trail__who--tool"},"AI"),h("span",null,"Draft generated")),
      h("li",{className:"trail__row"},h("span",{className:"trail__who trail__who--person"},"Our team"),h("span",null,"Design refined for production")),
      h("li",{className:"trail__row"},h("span",{className:"trail__who trail__who--person"},"The owner"),h("span",null,"Approved")),
      h("li",{className:"trail__row"},h("span",{className:"trail__who trail__who--tool"},"Delivery"),h("span",null,"Site shipped end to end"))));
}

function ProcessSection(){
  const steps=[
    {title:'A crawler finds the worst offenders',body:"It scans thousands of websites daily and scores each on design age, mobile responsiveness, page speed and accessibility. No manual prospecting.",footnote:'Thousands scanned daily'},
    {title:'Our AI drafts a modern mockup',body:"It reads the site’s existing content and branding, then generates a polished redesign. Same business, new look, tailored to each owner.",footnote:'Before and after in seconds'},
    {title:'The owner gets a personal preview',body:'Business owners receive a message with a before and after of their own site. The offer sells itself. No cold calls, no spray and pray.',footnote:'Personalized at scale'},
    {title:'Interested owners become clients',body:'Our team refines the AI-generated design into a production-ready site and handles delivery, end to end.',footnote:'Human-refined, client-approved'}
  ];
  const [step,setStep]=React.useState(0);
  const refs=React.useRef([]);
  React.useEffect(function(){
    if(!("IntersectionObserver" in window))return;
    const io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting){setStep(Number(e.target.getAttribute("data-step")));}});
    },{rootMargin:"-45% 0px -45% 0px"});
    refs.current.forEach(function(el){if(el)io.observe(el);});
    return function(){io.disconnect();};
  },[]);
  return h("section",{id:"sites","aria-labelledby":"process-title",className:"pin"},
    h("div",{id:"process",className:"container"},
      h("div",{className:"headblock"},
        h("h2",{id:"process-title"},"From scan to shipped, fully automated."),
        h("p",{className:"lead"},"We start with websites. We find businesses losing customers to outdated sites and deliver a modern redesign, automatically.")),
      h("ol",{className:"pin__steps"},steps.map((s,i)=>h("li",{key:s.title,role:"listitem",className:"pin__item"},
        h("div",{className:"pin__step"+(step===i?" is-on":""),"data-step":i,ref:function(el){refs.current[i]=el;}},
          h("h3",null,s.title),
          h("p",{className:"pin__body"},s.body),
          h("p",{className:"pin__note"},s.footnote)),
        stateFor(i,step===i))))));
}

function Figures(){
  const items=[['200M+','Outdated websites on the internet'],['94%','Of first impressions are design-related'],['3s','Time before users abandon a slow site']];
  return h("section",{className:"figures","aria-label":"Why outdated sites cost customers"},
    h("div",{className:"container"},
      h("dl",{className:"figures__list"},items.map(([v,l])=>h("div",{key:l,className:"figures__row"},h("dt",{className:"figures__label"},l),h("dd",{className:"figures__value"},v))))));
}

function PlatformSection(){
  const items=[
    {name:'Rewrite Labs Sites',tag:'Website redesign',body:"We scan for outdated small-business sites and deliver a modern, mobile-ready redesign automatically, with a before and after preview for the owner.",status:'Early access open',href:'#sites',lead:true},
    {name:'TRM',tag:'Research engine',body:"Research with an audit trail. TRM ingests sources, extracts facts, scores and crosslinks topics, and logs every change. If there is no evidence, there is no claim.",status:'In development'},
    {name:'Sigil',tag:'Agent relay',body:"A signed, auditable relay between AI agents such as Claude, Codex, Grok, and local models. Every message is cryptographically signed, and risky actions wait for a human to approve.",status:'In development'},
    {name:'Toolforge',tag:'Agent skills',body:"Verified skills and plugins for Claude Code. Each one is validated and version-pinned before it installs.",command:'claude plugin marketplace add sorensencc-dotcom/toolforge-marketplace',status:'Live: browse the catalog',href:'https://github.com/sorensencc-dotcom/toolforge-marketplace'},
    {name:'kb-sync',tag:'Knowledge base',body:"A knowledge base that lives on your own machine, with full-text and semantic search that needs no network round trip.",status:'In development'}
  ];
  return h("section",{id:"platform","aria-labelledby":"platform-title",className:"platform"},
    h("div",{className:"container"},
      h("div",{className:"headblock headblock--split"},
        h("h2",{id:"platform-title"},"One rule across everything we build."),
        h("p",{className:"lead"},"Your data and keys stay on your own machines. Each job goes to the best model or service for it.")),
      h("ul",{className:"index"},items.map(it=>h("li",{key:it.name,className:"index__row"+(it.lead?" index__row--lead":"")},
        h("div",{className:"index__name"},h("h3",null,it.name),h("p",{className:"index__tag"},it.tag)),
        h("div",{className:"index__body"},
          h("p",null,it.body),
          it.command?h("code",{className:"measured index__command"},it.command):null),
        h("div",{className:"index__status"},it.href?h("a",{href:it.href,className:"chip chip--link"+(it.lead?" chip--accent":" chip--ok")},it.status):h("span",{className:"chip"},it.status)))))));
}

function WaitlistSection(){
  const[email,setEmail]=React.useState('');
  const[sent,setSent]=React.useState(false);
  const[busy,setBusy]=React.useState(false);
  const[err,setErr]=React.useState('');
  const[trap,setTrap]=React.useState('');
  function submit(e){
    e.preventDefault();
    if(busy)return;
    setBusy(true);setErr('');
    fetch('/api/waitlist',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,website:trap,source:'landing'})})
      .then(r=>r.json().then(j=>r.ok&&j.ok?'ok':r.status===429?'limited':r.status>=500?'server':'invalid'))
      .catch(()=>'server')
      .then(res=>{
        setBusy(false);
        if(res==='ok')setSent(true);
        else setErr(res==='limited'?'Too many attempts from this connection. Please try again later.':res==='server'?'Signup is unavailable right now. Please try again later or email info@rewritelabs.io.':'Check your email address and try again.');
      });
  }
  return h("section",{id:"waitlist","aria-labelledby":"waitlist-title",className:"waitlist"},
    h("div",{className:"container waitlist__grid"},
      h("div",{className:"waitlist__text"},
        h("h2",{id:"waitlist-title"},"Be first in line."),
        h("p",{className:"lead"},"We’re opening access to a limited group of early users. Drop your email and we’ll reach out when we’re ready for you.")),
      h("div",{className:"waitlist__panel"},
        !sent
          ?h("form",{onSubmit:submit,className:"waitlist__form",noValidate:true},
              h("label",{className:"field",htmlFor:"waitlist-email"},h("span",{className:"field__label"},"Email address"),
                h("input",{id:"waitlist-email",className:"field__input",type:"email",name:"email",autoComplete:"email",inputMode:"email",placeholder:"you@business.com",required:true,value:email,onChange:e=>setEmail(e.target.value)})),
              h("div",{className:"hp","aria-hidden":"true"},h("label",null,"Leave this field empty",h("input",{type:"text",name:"website",tabIndex:-1,autoComplete:"off",value:trap,onChange:e=>setTrap(e.target.value)}))),
              h("button",{className:"btn btn--primary",type:"submit",disabled:busy,"aria-busy":busy?"true":undefined},busy?"Joining…":"Join the waitlist"))
          :h("div",{role:"status",className:"waitlist__done"},"You’re on the list. We’ll be in touch soon."),
        h("div",{role:"status","aria-live":"polite",className:"waitlist__note"},err||"We’ll only use your email to contact you about early access."," ",h("a",{href:"/privacy",className:"link"},"Privacy")))));
}

function Footer(){
  return h("footer",{className:"footer"},
    h("div",{className:"container footer__grid"},
      h("div",{className:"footer__id"},
        h("a",{href:"/",className:"footer__brand","aria-label":"Rewrite Labs home"},h(Wordmark,null)),
        h("p",{className:"footer__legal"},"\xA9 2026 Cast Iron Productions LLC (Rewrite Labs)",h("br"),"7901 4th St N, Ste 300",h("br"),"St. Petersburg, FL 33702")),
      h("nav",{className:"footer__col","aria-label":"Read"},
        h("h2",{className:"footer__h"},"Read"),
        h("ul",null,
          h("li",null,h("a",{href:"/blog/",className:"link"},"Blog")),
          h("li",null,h("a",{href:"/ai-news-feed/",className:"link"},"AI News Feed")),
          h("li",null,h("a",{href:"/case-study",className:"link"},"Case study")))),
      h("nav",{className:"footer__col","aria-label":"Company"},
        h("h2",{className:"footer__h"},"Company"),
        h("ul",null,
          h("li",null,h("a",{href:"/privacy",className:"link"},"Privacy")),
          h("li",null,h("a",{href:"mailto:info@rewritelabs.io",className:"link"},"info@rewritelabs.io"))))));
}

window.RLScreens={Nav,Hero,SitesAnchor,ProcessSection,Figures,PlatformSection,WaitlistSection,Footer,Wordmark};
})();
