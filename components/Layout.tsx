import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useStore } from "../utils/store";

export default function Layout({ children }: { children: React.ReactNode }) {
  const currency = useStore((state) => state.currency);
  return (
    <>
      <header className="flex justify-between">
        <Link passHref href="/">
          <div className="-ml-9 -mb-5">
            <Image src="/banano.svg" alt="Banano logo" height={50} width={400} />
          </div>
        </Link>
        <div className="mt-5 flex">
          {/* <Link href="/">Purchase BAN</Link>

          <Link href="/test">Test payment</Link> */}
          <Link href={"/dashboard"}>To my dashboard</Link>
          <label className="hidden">Do you want to use USD or EUR?</label>
          <select
            onChange={(e) => useStore.setState({ currency: e.target.value })}
            className="ml-4 -m-2"
            value={currency}
            name="currency"
            id="currency"
          >
            <option value="eur">EUR</option>
            <option value="usd">USD</option>
          </select>
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
