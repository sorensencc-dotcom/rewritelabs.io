(function(){
function _extends(){return _extends=Object.assign?Object.assign.bind():function(n){for(var e=1;e<arguments.length;e++){var t=arguments[e];for(var r in t)({}).hasOwnProperty.call(t,r)&&(n[r]=t[r]);}return n;},_extends.apply(null,arguments);}
const{Button,Badge,Input,StatCard,ProcessStep}=window.RewriteLabsDesignSystem_7b8b1b;
const h=React.createElement;

function Wordmark({small}){
  return h("div",{className:"wordmark"+(small?" wordmark--sm":"")},"Rewrite",h("span",{className:"wordmark__slash"},"/"),h("span",{className:"wordmark__labs"},"Labs"));
}

function goTo(id){var el=document.getElementById(id);if(el){el.scrollIntoView({behavior:"smooth",block:"start"});}else{window.location.href="/#"+id;}}
window.addEventListener("load",function(){if(window.location.hash){setTimeout(function(){var el=document.getElementById(window.location.hash.slice(1));if(el)el.scrollIntoView();},50);}});

function Nav(){
  return h("div",{className:"nav"},
    h("a",{href:"/",className:"nav__brand"},h(Wordmark,null)),
    h("div",{className:"nav__actions"},
      h("a",{href:"/case-study",className:"nav__link"},"Case Study"),
      h(Button,{variant:"primary",size:"sm",onClick:function(){goTo("waitlist");}},"Get Early Access →")));
}

function MiniSite({old:isOld,label}){
  return h("div",{className:"minisite"+(isOld?" minisite--old":"")},
    h("div",{className:"minisite__bar"},h("div",{className:"minisite__dot"}),h("div",{className:"minisite__dot"})),
    h("div",{className:"minisite__body"},h("div",{className:"minisite__line minisite__line--head"}),h("div",{className:"minisite__line minisite__line--a"}),h("div",{className:"minisite__line minisite__line--b"})),
    h("div",{className:"minisite__label"},label));
}

function Hero(){
  return h("div",{className:"container hero"},
    h("div",null,
      h("div",{className:"eyebrow hero__eyebrow"},"AI-Powered Website Redesign"),
      h("h1",{className:"hero__title"},"The Internet Is Full of Outdated Websites.",h("br",null),h("span",{className:"hero__title-accent"},"We Fix That.")),
      h("p",{className:"lede hero__lede"},"Rewrite Labs scans the web for businesses losing customers to broken, slow, and outdated sites — then delivers a modern redesign, automatically."),
      h("div",{className:"hero__cta"},
        h(Button,{variant:"primary",size:"lg",onClick:function(){goTo("waitlist");}},"Get Early Access →"),
        h(Button,{variant:"secondary",size:"lg",onClick:function(){goTo("process");}},"See How It Works ↓"))),
    h("div",{className:"hero__card"},
      h("div",{className:"hero__card-title"},"rewritelabs.io — scanning sample-bakery.example"),
      h("div",{className:"hero__compare"},h(MiniSite,{old:true,label:"Before"}),h("div",{className:"hero__arrow"},"→"),h(MiniSite,{label:"After"})),
      h("div",{className:"hero__stats"},
        h(StatCard,{value:"2009",label:"Design Age",tone:"bad"}),
        h(StatCard,{value:"No",label:"Mobile Ready",tone:"bad"}),
        h(StatCard,{value:"38",label:"Page Speed",tone:"bad"}),
        h(StatCard,{value:"94",label:"Redesign Score",tone:"good"})),
      h("div",{className:"hero__badges"},h(Badge,{tone:"bad"},"Outdated"),h(Badge,{tone:"bad"},"Fails"),h(Badge,{tone:"warn"},"High Priority")),
      h("a",{href:"/case-study",className:"hero__more"},"See the full before/after →")));
}

function StatStrip(){
  const items=[['200M+','Outdated websites on the internet'],['94%','Of first impressions are design-related'],['3s','Time before users abandon a slow site']];
  return h("div",{className:"container stat-strip"},items.map(([v,l])=>h("div",{key:l,className:"stat-strip__item"},h("div",{className:"stat-strip__value"},v),h("div",{className:"stat-strip__label"},l))));
}

function ProcessSection(){
  const steps=[
    {emoji:'🔍',title:'AI Crawler Finds the Worst Offenders',body:"Our crawler scans thousands of websites daily, scoring each one on design age, mobile responsiveness, page speed, and accessibility. No manual prospecting required.",footnote:'Thousands scanned daily'},
    {emoji:'✦',title:'AI Generates a Modern Mockup — Instantly',body:"Using the site's existing content and branding, our AI engine generates a polished, modern redesign. Same business, new look — automatically tailored to each owner.",footnote:'Before & after in seconds'},
    {emoji:'📬',title:'Personalized Outreach with a Compelling Preview',body:'Business owners receive a personalized message with a before & after preview of their site. The offer sells itself. No cold calls, no spray-and-pray.',footnote:'Hyper-personalized at scale'},
    {emoji:'🚀',title:'Convert Interest into Production-Ready Websites',body:'Interested owners become paying clients. Our team refines the AI-generated design into a production-ready site and handles delivery — end to end.',footnote:'Human-refined, client-approved'}
  ];
  return h("div",{id:"process",className:"container process"},
    h("div",{className:"eyebrow"},"The Process"),
    h("h2",{className:"display-md process__title"},"From scan to shipped, fully automated."),
    h("div",{className:"process__grid"},steps.map((s,i)=>h(ProcessStep,_extends({key:s.title,index:i+1},s)))));
}

function WaitlistSection(){
  const[email,setEmail]=React.useState('');
  const[sent,setSent]=React.useState(false);
  const[busy,setBusy]=React.useState(false);
  const[err,setErr]=React.useState('');
  function submit(e){
    e.preventDefault();
    if(busy)return;
    setBusy(true);setErr('');
    fetch('/api/waitlist',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})})
      .then(r=>r.json().then(j=>({ok:r.ok&&j.ok})))
      .catch(()=>({ok:false}))
      .then(res=>{setBusy(false);if(res.ok)setSent(true);else setErr('Something went wrong. Check your email and try again.');});
  }
  return h("div",{id:"waitlist",className:"waitlist"},
    h("div",{className:"eyebrow"},"Early Access"),
    h("h2",{className:"display-md waitlist__title"},"Be first in line."),
    h("p",{className:"waitlist__lede"},"We're opening access to a limited group of early users. Drop your email and we'll reach out when we're ready for you."),
    !sent
      ?h("form",{onSubmit:submit,className:"waitlist__form"},
          h("label",{className:"waitlist__field"},h("span",{className:"sr-only"},"Email address"),h(Input,{type:"email",placeholder:"you@business.com",value:email,onChange:e=>setEmail(e.target.value)})),
          h(Button,{variant:"primary",type:"submit",disabled:busy},busy?"Joining...":"Join Waitlist →"))
      :h("div",{role:"status",className:"waitlist__done"},"✓ You're on the list! We'll be in touch soon."),
    h("div",{role:"status","aria-live":"polite",className:"waitlist__note"},err||"We'll only use your email to contact you about early access."," ",h("a",{href:"/privacy",className:"muted-link"},"Privacy")));
}

function Footer(){
  return h("div",{className:"footer"},
    h(Wordmark,{small:true}),
    h("div",{className:"footer__legal"},"\xA9 2026 Cast Iron Productions LLC \xB7 Rewrite Labs",h("br"),"7901 4th St N, Ste 300, St. Petersburg, FL 33702",h("br"),
      h("a",{href:"/privacy",className:"muted-link"},"Privacy")," \xB7 ",h("a",{href:"mailto:info@rewritelabs.io",className:"muted-link"},"info@rewritelabs.io")));
}

window.RLScreens={Nav,Hero,StatStrip,ProcessSection,WaitlistSection,Footer};
})();
