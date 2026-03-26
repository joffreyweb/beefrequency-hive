"use client";

export default function SignOutButton() {
  function handleSignOut() {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "onboarding_completed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs font-ui text-brun-mid/40 hover:text-brun-mid transition-colors"
    >
      Sign out
    </button>
  );
}
