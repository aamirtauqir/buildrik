import Link from "next/link";
import { GoBackButton } from "@/components/go-back-button";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-6xl font-bold" style={{ color: "#E42313" }}>
          404
        </h1>
        <h2
          className="mt-4 text-xl font-semibold"
          style={{ color: "#0D0D0D" }}
        >
          Page Not Found
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "#E42313" }}
          >
            Go to Dashboard
          </Link>
          <GoBackButton />
        </div>
      </div>
    </div>
  );
}
