'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => { void import('../app.js'); }, []);
  return (
    <>
      <a className="skip-link" href="#main" data-copy="skip">Skip to main content</a>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#start" aria-label="Sarathi Next home">Sarathi <span>Next</span></a>
          <div className="language-switcher" role="tablist" aria-label="Choose language">
            <button className="language-tab" type="button" role="tab" data-language="en" aria-selected="true">English</button>
            <button className="language-tab" type="button" role="tab" data-language="hi" aria-selected="false">हिन्दी</button>
          </div>
          <button className="quiet-link" id="status-link" type="button" data-copy="application" hidden>My application</button>
        </div>
      </header>
      <main id="main" className="shell" tabIndex={-1} suppressHydrationWarning>
        <section className="page landing-page">
          <aside className="mock-banner" aria-label="This is a prototype."><strong>This is a prototype.</strong> These services use mock data. They do not create an official government record.</aside>
          <p className="eyebrow">Driving licence services</p>
          <h1>What do you need to do?</h1>
          <p className="lede">Choose a service to start. You can save your progress and return later on this device.</p>
          <div className="service-grid" aria-label="Driving licence services">
            <article className="service-card">
              <span className="service-number" aria-hidden="true">01</span>
              <div className="service-card__body"><h2>Apply for a Learner&apos;s Licence</h2><p>Apply for your first licence to learn to drive a two-wheeler, car or commercial vehicle.</p><p className="service-meta">Takes about 15 to 20 minutes</p></div>
              <button className="service-action" type="button" data-go="learner-start">Start application<span aria-hidden="true">→</span></button>
            </article>
            <article className="service-card">
              <span className="service-number" aria-hidden="true">02</span>
              <div className="service-card__body"><h2>Book a Driving Licence test slot</h2><p>Choose an available date and time for your driving test.</p><p className="service-meta">Takes about 5 minutes</p></div>
              <button className="service-action" type="button" data-go="slots">Book a slot<span aria-hidden="true">→</span></button>
            </article>
          </div>
          <section className="section before-start" aria-labelledby="before-start-title"><h2 id="before-start-title">Before you start</h2><p>Keep your mobile phone and licence details ready. Documents and slot availability are simulated in this prototype.</p></section>
          <footer className="footer">Sarathi Next is a hackathon prototype. It is not an official government service. No real application or booking is created.</footer>
        </section>
      </main>
    </>
  );
}
