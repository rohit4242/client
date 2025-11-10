"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboardUrlByRole } from "@/lib/utils";
import { Spinner } from "@/components/spinner";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait a bit longer for the session to be fully established after OAuth
        await new Promise(resolve => setTimeout(resolve, 500));

        // Fetch user role
        const response = await fetch("/api/auth/user-role");
        
        if (response.ok) {
          const { role } = await response.json();
          const redirectUrl = getDashboardUrlByRole(role);
          
          // Redirect to appropriate dashboard
          window.location.href = redirectUrl;
        } else {
          // If role fetch fails, try again after a longer delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const retryResponse = await fetch("/api/auth/user-role");
          if (retryResponse.ok) {
            const { role } = await retryResponse.json();
            const redirectUrl = getDashboardUrlByRole(role);
            window.location.href = redirectUrl;
          } else {
            // Fallback to customer dashboard
            window.location.href = "/customer/dashboard";
          }
        }
      } catch (err) {
        console.error("Error in auth callback:", err);
        setError("Authentication failed. Redirecting to sign-in...");
        
        // Redirect to sign-in after error
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Spinner className="w-8 h-8 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

