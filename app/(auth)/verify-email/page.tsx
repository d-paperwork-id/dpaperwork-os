export default function VerifyEmailPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-3 text-center">
        Check your inbox
      </h1>
      <p className="text-sm text-center text-gray-500">
        We sent a verification link to your email address. Click it to activate
        your account.
      </p>
      <p className="text-sm text-center text-gray-400 mt-2">
        Didn&apos;t receive it? Check your spam folder. It may take a minute to
        arrive.
      </p>
    </>
  );
}
