// Layout onboarding — sans navigation, plein écran
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide parent ClientHeader and ClientNav during onboarding */}
      <style>{`
        [data-client-header] { display: none !important; }
        [data-client-nav] { display: none !important; }
        main { padding-top: 0 !important; padding-bottom: 0 !important; }
      `}</style>
      {children}
    </>
  );
}
