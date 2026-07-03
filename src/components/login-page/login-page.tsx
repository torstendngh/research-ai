"use client";

import Link from "next/link";
import loginWithGoogle from "@/lib/supabase/loginWithGoogle";
import LogoIcon from "@/components/shared/icons/logo-icon";
import DotPattern from "@/components/shared/dot-pattern";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
    />
    <path
      fill="#EA4335"
      d="M9 3.583c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.583 9 3.583Z"
    />
  </svg>
);

const LoginPage = () => {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <DotPattern className="fill-zinc-200 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />

      <div className="relative w-full max-w-sm flex flex-col items-center text-center">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 font-medium tracking-tight text-lg text-zinc-800"
        >
          <LogoIcon className="size-5" />
          ResearchAI
        </Link>

        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl">
          <h1 className="text-2xl tracking-tighter text-zinc-900 mb-2">
            Welcome back
          </h1>
          <p className="text-sm tracking-tight text-zinc-400 mb-8 text-balance">
            Sign in to pick up your research where you left off.
          </p>

          <button
            onClick={loginWithGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-zinc-200 bg-white px-5 py-2.5 font-medium tracking-tight text-zinc-800 transition-colors hover:bg-zinc-50 hover:border-zinc-300 cursor-pointer"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-xs tracking-tight text-zinc-400 text-balance">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
