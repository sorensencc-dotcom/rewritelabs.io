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

/* The home-ground stack, built at full size: what runs where, and the four claims it rests on. */
function StackRecord(){
  const stack=[
    {name:'Sites',tag:'Websites',proof:'Static, zero-tracker output'},
    {name:'TRM',tag:'Research',proof:'Evidence-first audit trail'},
    {name:'Sigil',tag:'Agent relay',proof:'Ed25519 signed envelopes'},
    {name:'Toolforge',tag:'Skills',proof:'Validated and version-pinned'},
    {name:'kb-sync',tag:'Knowledge',proof:'Local zero-roundtrip search'}
  ];
  const stats=[['100%','Local keys and data'],['Ed25519','Signed actions'],['0ms','Cloud roundtrip'],['Best of Breed','Model routing']];
  return h("figure",{className:"record","aria-labelledby":"record-title"},
    h("figcaption",{id:"record-title",className:"record__head"},"Rewrite Labs home ground stack"),
    h("dl",{className:"record__stats"},stats.map(([v,l])=>h("div",{key:l,className:"record__stat"},h("dt",null,l),h("dd",{className:"measured"},v)))),
    h("ul",{className:"record__stack"},stack.map(s=>h("li",{key:s.name,className:"record__item"},
      h("span",{className:"record__name"},s.name," ",h("span",{className:"record__tag"},s.tag)),
      h("span",{className:"record__proof"},s.proof)))),
    h("div",{className:"record__foot"},
      h("ul",{className:"chips","aria-label":"Principles"},
        h("li",{className:"chip chip--ok"},"Local first"),
        h("li",{className:"chip chip--ok"},"Audited actions"),
        h("li",{className:"chip chip--ok"},"Zero telemetry")),
      h("a",{href:"#platform",className:"link",onClick:function(e){e.preventDefault();goTo("platform");}},"Explore the platform")));
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
      h(StackRecord,null)));
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
    {name:'Rewrite Labs Sites',tag:'Website redesign',body:"We scan for outdated small-business sites and deliver a modern, mobile-ready redesign automatically, with a before and after preview for the owner.",status:'Early access open',tone:'ok',action:'Join early access',href:'#waitlist',lead:true},
    {name:'TRM',tag:'Research engine',body:"Research with an audit trail. TRM ingests sources, extracts facts, scores and crosslinks topics, and logs every change. If there is no evidence, there is no claim.",status:'In development',action:'Get early access',href:'#waitlist'},
    {name:'Sigil',tag:'Agent relay',body:"A signed, auditable relay between AI agents such as Claude, Codex, Grok, and local models. Every message is cryptographically signed, and risky actions wait for a human to approve.",status:'In development',action:'Get early access',href:'#waitlist'},
    {name:'Toolforge',tag:'Agent skills',body:"Verified skills and plugins for AI coding agents. Each capability is validated against strict schema contracts and version-pinned before installation, with a public marketplace in development.",status:'In development',action:'Get early access',href:'#waitlist'},
    {name:'kb-sync',tag:'Knowledge base',body:"A knowledge base that lives on your own machine, with full-text and semantic search that needs no network round trip.",status:'In development',action:'Get early access',href:'#waitlist'}
  ];
  return h("section",{id:"platform","aria-labelledby":"platform-title",className:"platform"},
    h("div",{className:"container"},
      h("div",{className:"headblock headblock--split"},
        h("h2",{id:"platform-title"},"One rule across everything we build."),
        h("p",{className:"lead"},"Your data and keys stay on your own machines. Each job goes to the best model or service for it.")),
      h("ul",{className:"index"},items.map(it=>h("li",{key:it.name,className:"index__row"+(it.lead?" index__row--lead":"")},
        h("div",{className:"index__name"},h("h3",null,it.name),h("p",{className:"index__tag"},it.tag)),
        h("div",{className:"index__body"},h("p",null,it.body)),
        h("div",{className:"index__status"},
          h("span",{className:"chip"+(it.tone==='ok'?" chip--ok":"")},it.status),
          h("a",{href:it.href,className:"link",onClick:function(e){e.preventDefault();goTo(it.href.slice(1));}},it.action)))))));
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


function SocialIcon({d}){
  return h("svg",{viewBox:"0 0 24 24",width:20,height:20,fill:"currentColor","aria-hidden":"true",focusable:"false"},h("path",{d}));
}

function Footer(){
  return h("footer",{className:"footer"},
    h("div",{className:"container footer__grid"},
      h("div",{className:"footer__id"},
        h("a",{href:"/",className:"footer__brand","aria-label":"Rewrite Labs home"},h(Wordmark,null)),
        h("p",{className:"footer__legal"},"\xA9 2026 Cast Iron Productions LLC (Rewrite Labs)",h("br"),"7901 4th St N, Ste 300",h("br"),"St. Petersburg, FL 33702"),
        h("ul",{className:"footer__socials","aria-label":"Rewrite Labs on social media"},
          h("li",null,h("a",{href:"https://x.com/RewriteLabsIO",target:"_blank",rel:"noopener noreferrer","aria-label":"Rewrite Labs on X"},h(SocialIcon,{d:"M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"}))),
          h("li",null,h("a",{href:"https://www.linkedin.com/company/rewritelabs",target:"_blank",rel:"noopener noreferrer","aria-label":"Rewrite Labs on LinkedIn"},h(SocialIcon,{d:"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"}))),
          h("li",null,h("a",{href:"https://www.threads.com/@rewritelabsio",target:"_blank",rel:"noopener noreferrer","aria-label":"Rewrite Labs on Threads"},h(SocialIcon,{d:"M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"}))),
          h("li",null,h("a",{href:"https://www.instagram.com/rewritelabsio",target:"_blank",rel:"noopener noreferrer","aria-label":"Rewrite Labs on Instagram"},h(SocialIcon,{d:"M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"}))))),
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
