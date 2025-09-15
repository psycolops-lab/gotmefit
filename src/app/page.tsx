'use client';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import AboutSection from '@/components/sections/AboutSection';
import CTASection from '@/components/sections/CTASection';
import HeroSection from '@/components/sections/HeroSection';
import MembershipSection from '@/components/sections/MembershipSection';
import StepSuccessSection from '@/components/sections/StepSuccessSection';


export default function Home() {

  return (
    <main className="min-h-screen">
      <Navbar  />
      <HeroSection  />
      <AboutSection/>
      <MembershipSection/>
      <StepSuccessSection/>
      <CTASection/>
      <Footer/>
    </main>
  );
}