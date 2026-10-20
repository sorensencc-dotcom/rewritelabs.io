/* @ds-bundle: {"format":4,"namespace":"RewriteLabsDesignSystem_7b8b1b","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"ProcessStep","sourcePath":"components/core/ProcessStep.jsx"},{"name":"StatCard","sourcePath":"components/core/StatCard.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"ac7b17846b48","components/core/Button.jsx":"60a890560b5b","components/core/Input.jsx":"d68500e4f967","components/core/ProcessStep.jsx":"0ab801c40b76","components/core/StatCard.jsx":"d27d9d737906","ui_kits/marketing-site/Screens.jsx":"3c2c9869ad0f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.RewriteLabsDesignSystem_7b8b1b = window.RewriteLabsDesignSystem_7b8b1b || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function Badge({
  children,
  tone = 'neutral'
}) {
  const tones = {
    bad: {
      color: 'var(--signal-bad)',
      background: 'var(--signal-bad-bg)',
      border: 'var(--red-400)'
    },
    warn: {
      color: 'var(--signal-warn)',
      background: 'var(--signal-warn-bg)',
      border: 'var(--amber-400)'
    },
    good: {
      color: 'var(--signal-good)',
      background: 'var(--signal-good-bg)',
      border: 'var(--green-400)'
    },
    neutral: {
      color: 'var(--fg-2)',
      background: 'var(--ink-3)',
      border: 'var(--border-subtle)'
    }
  };
  const t = tones[tone];
  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: t.color,
      background: t.background,
      border: `1px solid ${t.border}`
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button'
}) {
  const base = {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background var(--duration-fast) var(--ease-standard),color var(--duration-fast) var(--ease-standard),border-color var(--duration-fast) var(--ease-standard)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    opacity: disabled ? 0.5 : 1
  };
  const sizes = {
    sm: {
      padding: '8px 14px',
      fontSize: 13
    },
    md: {
      padding: '12px 20px',
      fontSize: 15
    },
    lg: {
      padding: '15px 28px',
      fontSize: 16
    }
  };
  const variants = {
    primary: {
      background: 'var(--brand-primary)',
      color: 'var(--brand-on-primary)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--fg-1)',
      border: '1px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--fg-2)'
    }
  };
  const [hover, setHover] = React.useState(false);
  const hoverBg = {
    primary: 'var(--brand-primary-hover)',
    secondary: 'var(--ink-3)',
    ghost: 'var(--ink-2)'
  };
  const style = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    background: hover && !disabled ? hoverBg[variant] : variants[variant].background,
    boxShadow: variant === 'primary' && hover && !disabled ? '0 0 24px var(--brand-glow)' : 'none'
  };
  return React.createElement('button', {
    type,
    disabled,
    onClick,
    style,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function Input({
  placeholder = 'you@business.com',
  value,
  onChange,
  type = 'email'
}) {
  const [focus, setFocus] = React.useState(false);
  return React.createElement('input', {
    type,
    placeholder,
    value,
    onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      padding: '13px 16px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--ink-2)',
      color: 'var(--fg-1)',
      border: `1px solid ${focus ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
      outline: 'none',
      boxShadow: focus ? '0 0 0 3px var(--brand-glow)' : 'none',
      transition: 'border-color var(--duration-fast) var(--ease-standard),box-shadow var(--duration-fast) var(--ease-standard)',
      width: '100%'
    }
  });
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/ProcessStep.jsx
try { (() => {
function ProcessStep({
  index,
  total = 4,
  emoji,
  title,
  body,
  footnote
}) {
  return React.createElement('div', {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--fg-3)',
      letterSpacing: 'var(--tracking-wide)'
    }
  }, String(index).padStart(2, '0') + ' / ' + String(total).padStart(2, '0')), React.createElement('div', {
    style: {
      fontSize: 28
    }
  }, emoji), React.createElement('h3', {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--fg-1)',
      margin: 0
    }
  }, title), React.createElement('p', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--fg-2)',
      lineHeight: 1.55,
      margin: 0
    }
  }, body), footnote && React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--pink-400)'
    }
  }, '↑ ' + footnote));
}
Object.assign(__ds_scope, { ProcessStep });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProcessStep.jsx", error: String((e && e.message) || e) }); }

// components/core/StatCard.jsx
try { (() => {
function StatCard({
  value,
  label,
  tone = 'neutral'
}) {
  const colors = {
    bad: 'var(--signal-bad)',
    warn: 'var(--signal-warn)',
    good: 'var(--signal-good)',
    neutral: 'var(--fg-1)'
  };
  return React.createElement('div', {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      boxShadow: 'var(--shadow-card)',
      minWidth: 140
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 32,
      color: colors[tone]
    }
  }, value), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--fg-2)',
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wide)'
    }
  }, label));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Screens.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  Badge,
  Input,
  StatCard,
  ProcessStep
} = window.RewriteLabsDesignSystem_7b8b1b;
function Wordmark({
  size = 17
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: size,
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--fg-1)'
    }
  }, "Rewrite", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--pink-400)'
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 500,
      fontSize: size * 0.55,
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase',
      color: 'var(--fg-2)',
      marginLeft: 2
    }
  }, "Labs"));
}
function Nav() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 40px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(15,15,26,0.85)',
      backdropFilter: 'blur(8px)'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, null), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm"
  }, "Get Early Access \u2192"));
}
function MiniSite({
  old: isOld,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      border: `1px solid ${isOld ? 'var(--border-subtle)' : 'var(--pink-400)'}`,
      boxShadow: isOld ? 'none' : '0 0 24px var(--brand-glow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      padding: '6px 8px',
      background: isOld ? '#3a3a3a' : 'var(--ink-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: isOld ? '#777' : 'var(--border-strong)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: isOld ? '#777' : 'var(--border-strong)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 74,
      padding: 10,
      background: isOld ? '#c9c2a8' : 'var(--ink-1)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '60%',
      height: 8,
      background: isOld ? '#8a8264' : 'var(--pink-400)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '85%',
      height: 5,
      background: isOld ? '#a39c80' : 'var(--border-strong)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '70%',
      height: 5,
      background: isOld ? '#a39c80' : 'var(--border-strong)',
      borderRadius: 2
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 8px',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      textAlign: 'center',
      color: isOld ? '#5a5540' : 'var(--pink-400)',
      background: isOld ? '#b5ad90' : 'var(--ink-2)'
    }
  }, label));
}
function Hero() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '96px 24px 64px',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      gap: 56,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--pink-400)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      marginBottom: 18
    }
  }, "AI-Powered Website Redesign"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-display-xl)',
      fontWeight: 700,
      lineHeight: 'var(--leading-tight)',
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--fg-1)',
      margin: 0
    }
  }, "The Internet Is Full of Outdated Websites.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--pink-400)',
      textShadow: '0 0 40px var(--brand-glow)'
    }
  }, "We Fix That.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-body-lg)',
      color: 'var(--fg-2)',
      lineHeight: 'var(--leading-relaxed)',
      margin: '22px 0 32px',
      maxWidth: 520
    }
  }, "Rewrite Labs scans the web for businesses losing customers to broken, slow, and outdated sites \u2014 then delivers a modern redesign, automatically."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg"
  }, "Get Early Access \u2192"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "See How It Works \u2193"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 24,
      boxShadow: 'var(--shadow-raised)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--fg-3)',
      marginBottom: 16
    }
  }, "rewritelabs.io \u2014 scanning joesbakery1998.com"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(MiniSite, {
    old: true,
    label: "Before"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 18,
      color: 'var(--pink-400)'
    }
  }, "\u2192"), /*#__PURE__*/React.createElement(MiniSite, {
    label: "After"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    value: "2009",
    label: "Design Age",
    tone: "bad"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "No",
    label: "Mobile Ready",
    tone: "bad"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "38",
    label: "Page Speed",
    tone: "bad"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "94",
    label: "Redesign Score",
    tone: "good"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "bad"
  }, "Outdated"), /*#__PURE__*/React.createElement(Badge, {
    tone: "bad"
  }, "Fails"), /*#__PURE__*/React.createElement(Badge, {
    tone: "warn"
  }, "High Priority"))));
}
function StatStrip() {
  const items = [['200M+', 'Outdated websites on the internet'], ['94%', 'Of first impressions are design-related'], ['3s', 'Time before users abandon a slow site']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 24px 80px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 24
    }
  }, items.map(([v, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      textAlign: 'center',
      padding: '28px 16px',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 40,
      fontWeight: 700,
      color: 'var(--pink-400)'
    }
  }, v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--fg-2)',
      marginTop: 8
    }
  }, l))));
}
function ProcessSection() {
  const steps = [{
    emoji: '🔍',
    title: 'AI Crawler Finds the Worst Offenders',
    body: "Our crawler scans thousands of websites daily, scoring each one on design age, mobile responsiveness, page speed, and accessibility. No manual prospecting required.",
    footnote: 'Thousands scanned daily'
  }, {
    emoji: '✦',
    title: 'AI Generates a Modern Mockup — Instantly',
    body: "Using the site's existing content and branding, our AI engine generates a polished, modern redesign. Same business, new look — automatically tailored to each owner.",
    footnote: 'Before & after in seconds'
  }, {
    emoji: '📬',
    title: 'Personalized Outreach with a Compelling Preview',
    body: 'Business owners receive a personalized message with a before & after preview of their site. The offer sells itself. No cold calls, no spray-and-pray.',
    footnote: 'Hyper-personalized at scale'
  }, {
    emoji: '🚀',
    title: 'Convert Interest into Production-Ready Websites',
    body: 'Interested owners become paying clients. Our team refines the AI-generated design into a production-ready site and handles delivery — end to end.',
    footnote: 'Human-refined, client-approved'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '40px 24px 96px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--pink-400)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase'
    }
  }, "The Process"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-display-md)',
      fontWeight: 700,
      color: 'var(--fg-1)',
      margin: '10px 0 40px'
    }
  }, "From scan to shipped, fully automated."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 20
    }
  }, steps.map((s, i) => /*#__PURE__*/React.createElement(ProcessStep, _extends({
    key: s.title,
    index: i + 1
  }, s)))));
}
function WaitlistSection() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640,
      margin: '0 auto',
      padding: '40px 24px 120px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--pink-400)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase'
    }
  }, "Early Access"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-display-md)',
      fontWeight: 700,
      color: 'var(--fg-1)',
      margin: '10px 0 12px'
    }
  }, "Be first in line."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      color: 'var(--fg-2)',
      margin: '0 0 28px'
    }
  }, "We're opening access to a limited group of early users. Drop your email and we'll reach out when we're ready for you."), !sent ? /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
    },
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Input, {
    type: "email",
    placeholder: "you@business.com",
    value: email,
    onChange: e => setEmail(e.target.value)
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    type: "submit"
  }, "Join Waitlist \u2192")) : /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--signal-good)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600
    }
  }, "\u2713 You're on the list! We'll be in touch soon."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--fg-3)',
      marginTop: 14
    }
  }, "No spam. No sharing. Unsubscribe anytime."));
}
function Footer() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      padding: '28px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 14
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--fg-3)'
    }
  }, "\xA9 2026 Rewrite Labs, LLC \xB7 Tampa, FL"));
}
window.RLScreens = {
  Nav,
  Hero,
  StatStrip,
  ProcessSection,
  WaitlistSection,
  Footer
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.ProcessStep = __ds_scope.ProcessStep;

__ds_ns.StatCard = __ds_scope.StatCard;

})();
