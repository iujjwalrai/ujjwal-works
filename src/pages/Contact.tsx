import { useState, type FormEvent } from 'react';
import { EMAIL, GITHUB, LINKEDIN } from '../data/site';

// Web3Forms access key (public by design). Without it, the form falls back to the visitor's mail app.
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

type Status = 'idle' | 'sending' | 'sent' | 'error';

const Arrow = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 11 11 5M6 5h5v5" />
  </svg>
);

export default function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [sender, setSender] = useState({ name: '', email: '' });
  const [copied, setCopied] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (data.botcheck) return;

    if (!ACCESS_KEY) {
      const body = `${data.message}\n\n— ${data.name} (${data.email})`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Hello from ${data.name}`)}&body=${encodeURIComponent(body)}`;
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `New message from ${data.name} via ujjwal.works`,
          from_name: 'Portfolio contact form',
          name: data.name,
          email: data.email,
          message: data.message,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setSender({ name: data.name, email: data.email });
      setStatus('sent');
      form.reset();
    } catch {
      setStatus('error');
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <div className="page">
      <div className="wrap">
        <header className="page__head">
          <p className="sec__kicker">
            <span className="sec__index">~/contact</span>
            <span className="sec__rule" />
            Say hello
          </p>
          <h1 className="page__title">Open a <em>connection</em></h1>
          <p className="page__lede">
            Hiring, building something, or chasing a bug that refuses to stay dead? Send a message —
            it skips the queue and lands straight in my inbox.
          </p>
        </header>

        <div className="cpage">
          {status === 'sent' ? (
            <div className="cform cform--done" role="status">
              <p className="cform__code"><span className="cform__ok">200 OK</span> · message delivered</p>
              <h2 className="cform__thanks">Thanks, {sender.name.split(' ')[0]}.</h2>
              <p className="cform__note">
                Your message is in. I'll reply to <strong>{sender.email}</strong> — usually faster than a cold start.
              </p>
              <button type="button" className="btn btn--ghost" onClick={() => setStatus('idle')}>
                Send another
              </button>
            </div>
          ) : (
            <form className="cform" onSubmit={submit}>
              <div className="cform__bar" aria-hidden="true">
                <span className="cform__method">POST</span> /inbox
                <span className="cform__ct">application/json</span>
              </div>

              <div className="cform__row">
                <label className="cfield">
                  <span className="cfield__label">name <span className="cfield__hint">who's asking?</span></span>
                  <input name="name" required maxLength={100} autoComplete="name" placeholder="Ada Lovelace" />
                </label>
                <label className="cfield">
                  <span className="cfield__label">email <span className="cfield__hint">where I'll reply</span></span>
                  <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="ada@example.com" />
                </label>
              </div>

              <label className="cfield">
                <span className="cfield__label">message <span className="cfield__hint">the payload</span></span>
                <textarea name="message" required rows={6} maxLength={5000} placeholder="Tell me about the role, the project, or the bug…" />
              </label>

              {/* Honeypot: real people never see or fill this. */}
              <input type="checkbox" name="botcheck" className="sr-only" tabIndex={-1} autoComplete="off" />

              <div className="cform__foot">
                {status === 'error' ? (
                  <p className="cform__err" role="alert">
                    <span>5xx</span> Couldn't deliver that. Try again, or email me directly.
                  </p>
                ) : (
                  <p className="cform__fine">No spam, no newsletters — just a reply from me.</p>
                )}
                <button type="submit" className="btn btn--solid" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : <>Send message <Arrow /></>}
                </button>
              </div>
            </form>
          )}

          <aside className="caside">
            <p className="caside__title">Other endpoints</p>
            <button type="button" className="caside__link" onClick={copyEmail}>
              <span className="caside__key">email</span>
              <span>{copied ? 'Copied ✓' : EMAIL}</span>
            </button>
            <a className="caside__link" href={LINKEDIN} target="_blank" rel="noopener noreferrer">
              <span className="caside__key">linkedin</span>
              <span>ujjwal-rai <Arrow /></span>
            </a>
            <a className="caside__link" href={GITHUB} target="_blank" rel="noopener noreferrer">
              <span className="caside__key">github</span>
              <span>iujjwalrai <Arrow /></span>
            </a>
            <p className="caside__tz">
              <span className="caside__key">timezone</span>
              IST · UTC+5:30
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
