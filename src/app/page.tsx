'use client';

import HeroCover from "../components/landingpage/HeroCover";
import Certifications from "../components/landingpage/Certifications";
import Services from "../components/landingpage/Services";
import EventsWorkshops from "../components/landingpage/EventsWorkshops";
import Authenticity from "../components/landingpage/Authenticity";
import GoogleReviews from "../components/landingpage/GoogleReviews";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-white">
      <HeroCover />
      {/*
      <Certifications />
      */}
      <Services />
      <EventsWorkshops />
      <Authenticity />
      <GoogleReviews />
    </main>
  );
}
