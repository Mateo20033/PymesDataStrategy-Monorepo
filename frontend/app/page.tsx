import {
  LandingHeader,
  HeroSection,
  MetricsBand,
  ProblemSolution,
  HowItWorks,
  HITLSection,
  UseCases,
  SecurityBadge,
  AIStack,
  FAQAccordion,
  FinalCTA,
  LandingFooter,
} from "@/components/features/landing";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <LandingHeader />
      <main className="flex-1 flex flex-col">
        <HeroSection />
        <MetricsBand />
        <ProblemSolution />
        <HowItWorks />
        <HITLSection />
        <UseCases />
        <SecurityBadge />
        <AIStack />
        <FAQAccordion />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
