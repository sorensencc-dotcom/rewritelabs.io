// FILE: C:\Users\soren\rewritelabs.io\discovery\sales\outreach.js

import fetch from "node-fetch";
import FormData from "form-data";

export async function generateEmail({ domain, issues, checkout_url }) {
  const aiRes = await fetch("http://localhost:4020/outreach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, issues })
  });

  const ai = await aiRes.json();

  const body = `${ai.body}

Upgrade instantly:
${checkout_url}
`;

  return {
    subject: ai.subject,
    body
  };
}

export async function sendEmail({ to, subject, body }) {
  const form = new FormData();
  form.append("from", "Rewrite Labs <sales@rewritelabs.io>");
  form.append("to", to);
  form.append("subject", subject);
  form.append("text", body);

  const res = await fetch(
    `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")
      },
      body: form
    }
  );

  return res.ok;
}