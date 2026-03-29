export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-light text-brun-chaud tracking-wide">
            Hive
          </h1>
          <p className="font-caps text-sm text-or-sacre tracking-widest mt-2 uppercase">
            BeeFrequency
          </p>
        </div>
        <p className="font-display text-lg text-brun-chaud mb-4">
          Votre accès est temporairement suspendu.
        </p>
        <p className="font-ui text-sm text-brun-mid">
          Pour toute question, contactez Joffrey directement.
        </p>
      </div>
    </div>
  );
}
