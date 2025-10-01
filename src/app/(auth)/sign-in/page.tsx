import { LoginForm } from "@/app/(auth)/_components/login-form";
import { getUserWithRole } from "@/lib/auth-utils";
import { getDashboardUrlByRole } from "@/lib/utils";
import { redirect } from "next/navigation";

const SignInPage = async () => {
  const user = await getUserWithRole();

  if (user) {
    // Redirect based on user role
    redirect(getDashboardUrlByRole(user.role));
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
};

export default SignInPage;
