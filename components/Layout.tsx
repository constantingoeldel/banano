import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex justify-between">
        <Link passHref href="/">
          <div className="-ml-9 -mb-5">
            <Image src="/banano.svg" alt="Banano logo" height={50} width={400} />
          </div>
        </Link>
        <div className="mt-5">
          <Link href={"/dashboard"}>To my dashboard</Link>
        </div>
      </header>
      {children}
    </>
  );
}

// function LoginButtons() {
//   const { data: session } = useSession();
//   if (session) {
//     return (
//       <>
//         <Link href={"/dashboard/" + session.user.id}>Dashboard</Link>
//         <button onClick={() => signOut()}>Sign out</button>
//       </>
//     );
//   }
//   return (
//     <>
//       <button onClick={() => signIn()}>Sign in</button>
//     </>
//   );
// }
