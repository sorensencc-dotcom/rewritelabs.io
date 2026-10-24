(function(){
const h=React.createElement;

/* The "before" is a sample of a cluttered small-business site; the "after" is the sample redesign. Both are fictional and labelled as such. */
function Ph({label}){return h("div",{className:"specimen__ph"},label);}

function OldSite(){
  const services=['Air conditioning','Heating','Heat pump services','Ductless mini split','Indoor air quality','Air duct services','Temperature control','Maintenance service','Blown in insulation'];
  return h("div",{className:"old"},
    h("div",{className:"old__top"},h("span",null,"(555) 010-0142"),h("span",{className:"old__alert"},"Emergency services")),
    h("div",{className:"old__nav"},
      h("div",{className:"old__name"},"Sunbelt Comfort HVAC"),
      h("div",{className:"old__links"},h("span",null,"Home"),h("span",null,"Air Conditioning ▾"),h("span",null,"Heating ▾"),h("span",null,"Service Areas"),h("span",null,"About"),h("span",null,"Contact"))),
    h("div",{className:"old__body"},
      h("div",{className:"old__title"},"HVAC contractor in Anytown, FL:"),
      h("div",{className:"old__sub"},"Residential & Commercial AC Repair, Heating & Furnace Installation, Ductless Mini Split Services, Air Duct Cleaning & More"),
      h("div",{className:"old__cta"},h("div",{className:"old__btn"},"Get an estimate"),h("div",{className:"old__phone"},"(555) 010-0142")),
      h(Ph,{label:"hero-image.jpg"}),
      h("div",{className:"old__tags"},services.map(s=>h("span",{key:s},s))),
      h("div",{className:"old__text"},"Sunbelt Comfort HVAC specializes in keeping your home feeling cool and refreshing all year round by providing Anytown with certified and trusted AC repair and services. Those long hot months can be brutal, but when you choose us, we can have your home feeling like a sanctuary. Climate control is essential for the comfort of your home or business. Our staff is ready to keep your home or business comfortable with exceptional heating repairs, offering comprehensive solutions…"),
      h(Ph,{label:"service-photo.jpg"}),
      h("div",{className:"old__text"},"Home and commercial property owners in Anytown request heat pump services all year long. Sunbelt Comfort HVAC has heat pump technicians that handle installations, repairs, maintenance, and replacement services…"),
      h("div",{className:"old__cta"},h("div",{className:"old__btn"},"Get an estimate"),h("div",{className:"old__phone"},"(555) 010-0142")),
      h("div",{className:"old__logos"},h(Ph,{label:"brand-logo-1.png"}),h(Ph,{label:"brand-logo-2.png"}),h(Ph,{label:"brand-logo-3.png"})),
      h("div",{className:"old__foot"},"\xA9 Sample copy | 100 Example Street, Anytown, FL 00000")));
}

function NewSite(){
  return h("div",{className:"ns"},
    h("div",{className:"ns__nav"},
      h("div",{className:"ns__name"},"Sunbelt Comfort HVAC"),
      h("div",{className:"ns__links"},h("span",{className:"ns__link"},"Services"),h("span",{className:"ns__link"},"Areas"),h("span",{className:"ns__link"},"About")),
      h("div",{className:"ns__call"},"(555) 010-0142")),
    h("div",{className:"ns__body"},
      h("div",{className:"ns__head"},"Anytown’s AC stops working. We don’t."),
      h("div",{className:"ns__sub"},"HVAC contractors serving Anytown: AC repair, heating, and air quality, same day."),
      h("div",{className:"ns__btn"},"Get a free estimate"),
      h("div",{className:"ns__badge"},"24/7 emergency service"),
      h("div",{className:"ns__services"},['AC repair','Heating','Air quality'].map(l=>h("div",{key:l,className:"ns__service"},l))),
      h(Ph,{label:"service-photo.jpg"}),
      h("div",{className:"ns__text"},"Anytown homes and businesses stay cool through triple-digit summers. Our technicians handle everything from same-day AC repair to full system replacement, heat pump service, and indoor air quality. This is sample copy; a real page would use your own details."),
      h("div",{className:"ns__trust"},h("span",null,"[Years in business]"),h("span",null,"[Accreditations]"),h("span",null,"[License no.]"))));
}

function CaseStudyHeader(){
  return h("section",{className:"container cs-header"},
    h("h1",null,"A sample redesign, built by our AI."),
    h("p",{className:"lead cs-header__lede"},"This is an illustrative example, not a real client. Sunbelt Comfort HVAC is a fictional business, and every name, phone number, and claim on this page is invented. It shows the kind of before-and-after our pipeline aims to produce: a cluttered nine-item nav, six repeated estimate buttons, and keyword-stuffed paragraphs become a focused, scannable page. No real business is shown and no results are claimed."));
}

function CompareGrid(){
  return h("section",{className:"container cs-compare","aria-label":"Before and after"},
    h("figure",{className:"specimen specimen--old"},
      h("div",{className:"specimen__page","aria-hidden":"true"},h(OldSite,null)),
      h("figcaption",{className:"specimen__cap"},"Before: sunbeltcomfort.example (sample, fictional)")),
    h("figure",{className:"specimen specimen--new"},
      h("div",{className:"specimen__page","aria-hidden":"true"},h(NewSite,null)),
      h("figcaption",{className:"specimen__cap"},"After: sample generated by Rewrite Labs")));
}

function WhatChanged(){
  const rows=[['Nine-item flat navigation, three levels of dropdowns','Four links, one always-visible phone CTA'],['“Get an estimate” repeated six times down the page','One persistent call-to-action, styled to stand out once'],['Generic stock photography with no captions','Sized, purposeful imagery tied to each service'],['Dense, keyword-stuffed paragraphs written for search engines','Short, scannable copy written for a homeowner with a broken AC'],['No trust signals above the fold','Years in business, accreditations, and license number surfaced in the hero']];
  return h("section",{className:"container changes","aria-labelledby":"changes-title"},
    h("h2",{id:"changes-title"},"What our AI changed"),
    h("table",{className:"difftable"},
      h("thead",null,h("tr",null,h("th",{scope:"col"},"Before"),h("th",{scope:"col"},"After"))),
      h("tbody",null,rows.map(([before,after])=>h("tr",{key:before},
        h("td",{className:"difftable__minus"},h("span",{className:"difftable__gutter","aria-hidden":"true"},"−"),before),
        h("td",{className:"difftable__plus"},h("span",{className:"difftable__gutter","aria-hidden":"true"},"+"),after))))),
    h("div",{className:"changes__cta"},h("a",{className:"btn btn--primary",href:"/#waitlist"},"Get early access")));
}

window.RLCaseStudy={CaseStudyHeader,CompareGrid,WhatChanged};
})();
